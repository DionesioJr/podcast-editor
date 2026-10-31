import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { JobStatus, JobType } from '@prisma/client';

import {
  IJobsRepository,
  type JobRecord,
} from '../repositories/jobs.repository.interface';
import {
  JobCanceledError,
  JobValidationError,
  TemporaryJobError,
} from './job-handler.interface';
import { JobHandlerRegistry } from './job-handler.registry';

const CONCURRENCY_ENV: Record<JobType, string> = {
  [JobType.process]: 'PROCESS_CONCURRENCY',
  [JobType.ai_analysis]: 'AI_ANALYSIS_CONCURRENCY',
  [JobType.audio_sample]: 'AUDIO_SAMPLE_CONCURRENCY',
  [JobType.export_job]: 'EXPORT_CONCURRENCY',
};

const DEFAULT_CONCURRENCY: Record<JobType, number> = {
  [JobType.process]: 2,
  [JobType.ai_analysis]: 4,
  [JobType.audio_sample]: 2,
  [JobType.export_job]: 1,
};

const DEFAULT_STALE_LOCK_MS = 300000;
const MAX_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 2000;
const CANCEL_CHECK_INTERVAL_MS = 2000;

@Injectable()
export class JobExecutorService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(JobExecutorService.name);
  private running = false;
  private ticking = false;
  private pollTimer?: ReturnType<typeof setInterval>;
  private concurrency: Record<JobType, number> = { ...DEFAULT_CONCURRENCY };

  constructor(
    @Inject(IJobsRepository) private readonly repository: IJobsRepository,
    private readonly registry: JobHandlerRegistry,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.APP_ROLE !== 'worker') {
      return;
    }
    await this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    this.concurrency = this.loadConcurrency();
    await this.recoverStaleJobs();
    this.pollTimer = setInterval(() => void this.tick(), POLL_INTERVAL_MS);
    void this.tick();
    this.logger.log('Executor de jobs do worker iniciado');
  }

  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  private async tick(): Promise<void> {
    if (!this.running || this.ticking) {
      return;
    }
    this.ticking = true;
    try {
      for (const type of this.registry.types()) {
        await this.claimJobsForType(type);
      }
    } catch (error) {
      this.logger.error(`Erro ao buscar jobs na fila: ${this.describe(error)}`);
    } finally {
      this.ticking = false;
    }
  }

  private async claimJobsForType(type: JobType): Promise<void> {
    const concurrency = this.concurrency[type] ?? 0;
    if (concurrency <= 0) {
      return;
    }
    while (this.running) {
      const running = await this.repository.countRunningJobsByType(type);
      if (running >= concurrency) {
        return;
      }
      const job = await this.repository.claimNextQueuedJob(type);
      if (!job) {
        return;
      }
      void this.runJob(job).catch((error) => {
        this.logger.error(
          `Erro inesperado ao executar o job ${job.id}: ${this.describe(error)}`,
        );
      });
    }
  }

  private async runJob(job: JobRecord): Promise<void> {
    const handler = this.registry.get(job.job_type);
    if (!handler) {
      await this.repository.markJobFailed(
        job.id,
        job.attempts + 1,
        'JOB_HANDLER_NOT_FOUND',
      );
      this.logger.error(
        `Nenhum handler registrado para o tipo ${job.job_type}. Job ${job.id} marcado como falho.`,
      );
      return;
    }

    const controller = new AbortController();
    const cancelTimer = setInterval(
      () => void this.checkCancellation(job.id, controller),
      CANCEL_CHECK_INTERVAL_MS,
    );

    try {
      if (await this.isCanceled(job.id)) {
        await this.repository.markJobCanceled(job.id);
        return;
      }
      await handler.execute({
        job,
        signal: controller.signal,
        updateProgress: (progress, step) =>
          this.updateProgress(job.id, progress, step),
      });
      if (controller.signal.aborted || (await this.isCanceled(job.id))) {
        await this.repository.markJobCanceled(job.id);
        return;
      }
      await this.repository.markJobDone(job.id);
      this.logger.log(`Job ${job.id} do tipo ${job.job_type} concluído`);
    } catch (error) {
      await this.handleExecutionError(job, error, controller.signal.aborted);
    } finally {
      clearInterval(cancelTimer);
    }
  }

  private async checkCancellation(
    jobId: number,
    controller: AbortController,
  ): Promise<void> {
    if (controller.signal.aborted) {
      return;
    }
    try {
      if (await this.isCanceled(jobId)) {
        controller.abort();
        this.logger.warn(`Job ${jobId} cancelado. Interrompendo a execução.`);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao conferir o cancelamento do job ${jobId}: ${this.describe(error)}`,
      );
    }
  }

  private async isCanceled(jobId: number): Promise<boolean> {
    const status = await this.repository.findJobStatusById(jobId);
    return status === JobStatus.canceled;
  }

  private async handleExecutionError(
    job: JobRecord,
    error: unknown,
    aborted: boolean,
  ): Promise<void> {
    if (
      aborted ||
      error instanceof JobCanceledError ||
      this.isAbortError(error) ||
      (await this.isCanceled(job.id))
    ) {
      await this.repository.markJobCanceled(job.id);
      return;
    }

    const attempts = job.attempts + 1;
    if (error instanceof TemporaryJobError) {
      if (attempts < MAX_ATTEMPTS) {
        await this.repository.requeueJob(job.id, attempts, error.code);
        this.logger.warn(
          `Job ${job.id} falhou com erro temporário. Tentativa ${attempts} de ${MAX_ATTEMPTS}. Devolvido à fila.`,
        );
      } else {
        await this.repository.markJobFailed(job.id, attempts, error.code);
        this.logger.error(
          `Job ${job.id} falhou após ${attempts} tentativas: ${error.code}`,
        );
      }
      return;
    }

    const code = error instanceof JobValidationError ? error.code : 'JOB_ERROR';
    await this.repository.markJobFailed(job.id, attempts, code);
    this.logger.error(`Job ${job.id} falhou: ${code}`);
  }

  private async updateProgress(
    jobId: number,
    progress: number,
    step?: string,
  ): Promise<void> {
    const value = Math.max(0, Math.min(100, Math.round(progress)));
    await this.repository.updateJobProgress(jobId, value, step ?? null);
  }

  private async recoverStaleJobs(): Promise<void> {
    const staleBefore = new Date(
      Date.now() - this.readNumber('WORKER_STALE_LOCK_MS', DEFAULT_STALE_LOCK_MS, false),
    );
    const requeued = await this.repository.requeueStaleRunningJobs(staleBefore);
    if (requeued > 0) {
      this.logger.warn(
        `${requeued} job(s) running com locked_at antigo voltaram para a fila`,
      );
    }
  }

  private loadConcurrency(): Record<JobType, number> {
    const result = { ...DEFAULT_CONCURRENCY };
    for (const type of Object.keys(CONCURRENCY_ENV) as JobType[]) {
      result[type] = this.readNumber(
        CONCURRENCY_ENV[type],
        DEFAULT_CONCURRENCY[type],
        true,
      );
    }
    return result;
  }

  private readNumber(
    key: string,
    fallback: number,
    allowZero: boolean,
  ): number {
    const raw = process.env[key];
    if (raw === undefined || raw.trim() === '') {
      return fallback;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return allowZero ? (value >= 0 ? value : fallback) : value > 0 ? value : fallback;
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }

  private describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
