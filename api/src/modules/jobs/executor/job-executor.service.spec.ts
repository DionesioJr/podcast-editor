import { JobStatus, JobType } from '@prisma/client';

import {
  type IJobsRepository,
  type JobRecord,
} from '../repositories/jobs.repository.interface';
import {
  type JobExecutionContext,
  type JobHandler,
  JobValidationError,
  TemporaryJobError,
} from './job-handler.interface';
import { JobHandlerRegistry } from './job-handler.registry';
import { JobExecutorService } from './job-executor.service';

const PROJETO = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHAVES_ENV = ['PROCESS_CONCURRENCY', 'WORKER_STALE_LOCK_MS'] as const;
const ENV_ORIGINAL: Record<string, string | undefined> = Object.fromEntries(
  CHAVES_ENV.map((chave) => [chave, process.env[chave]] as const),
);

function criarJob(sobrescritas: Partial<JobRecord> = {}): JobRecord {
  return {
    id: 1,
    project_id: PROJETO,
    job_type: JobType.process,
    status: JobStatus.queued,
    payload: null,
    progress: 0,
    step: null,
    attempts: 0,
    error_code: null,
    locked_at: null,
    created_at: new Date('2026-10-31T12:00:00.000Z'),
    ...sobrescritas,
  };
}

function criarRepositorio(job: JobRecord) {
  let permitirReserva = true;
  const transitar = (status: JobStatus, attempts?: number, code?: string) => {
    job.status = status;
    if (attempts !== undefined) job.attempts = attempts;
    if (code !== undefined) job.error_code = code;
    job.locked_at = null;
    return Promise.resolve();
  };
  const repositorio: jest.Mocked<IJobsRepository> = {
    claimNextQueuedJob: jest.fn<Promise<JobRecord | null>, [JobType?]>(() => {
      if (!permitirReserva || job.status !== JobStatus.queued) {
        return Promise.resolve(null);
      }
      permitirReserva = false;
      job.status = JobStatus.running;
      job.locked_at = new Date();
      return Promise.resolve({ ...job });
    }),
    countRunningJobsByType: jest.fn<Promise<number>, [JobType]>(() =>
      Promise.resolve(0),
    ),
    findJobStatusById: jest.fn<Promise<JobStatus | null>, [number]>(() =>
      Promise.resolve(job.status),
    ),
    updateJobProgress: jest.fn<Promise<void>, [number, number, string | null]>(() =>
      Promise.resolve(),
    ),
    markJobDone: jest.fn<Promise<void>, [number]>(() => transitar(JobStatus.done)),
    markJobFailed: jest.fn<Promise<void>, [number, number, string]>(
      (_id, attempts, code) => transitar(JobStatus.failed, attempts, code),
    ),
    requeueJob: jest.fn<Promise<void>, [number, number, string]>(
      (_id, attempts, code) => transitar(JobStatus.queued, attempts, code),
    ),
    markJobCanceled: jest.fn<Promise<void>, [number]>(() =>
      transitar(JobStatus.canceled),
    ),
    requeueStaleRunningJobs: jest.fn<Promise<number>, [Date]>(() =>
      Promise.resolve(0),
    ),
  };
  return {
    repositorio,
    job,
    liberarReserva: () => {
      permitirReserva = true;
    },
  };
}

function criarExecutor(
  repositorio: jest.Mocked<IJobsRepository>,
  execute: jest.Mock<Promise<void>, [JobExecutionContext]>,
): JobExecutorService {
  const registro = new JobHandlerRegistry();
  const handler: JobHandler = { type: JobType.process, execute };
  registro.register(handler);
  return new JobExecutorService(repositorio, registro);
}

async function aguardarAte(condicao: () => boolean, voltas = 100): Promise<void> {
  for (let i = 0; i < voltas; i += 1) {
    if (condicao()) return;
    await Promise.resolve();
  }
  throw new Error(`Condição não atingida após ${voltas} voltas.`);
}

describe('JobExecutorService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    process.env.PROCESS_CONCURRENCY = '2';
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    for (const chave of CHAVES_ENV) {
      const valor = ENV_ORIGINAL[chave];
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
  });

  it('devolve à fila e repete até a terceira tentativa em erro temporário', async () => {
    const { repositorio, job, liberarReserva } = criarRepositorio(criarJob());
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.reject(new TemporaryJobError('REDE', 'Falha temporária.')),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.requeueJob.mock.calls.length === 1);
    executor.stop();

    liberarReserva();
    await executor.start();
    await aguardarAte(() => repositorio.requeueJob.mock.calls.length === 2);
    executor.stop();

    liberarReserva();
    await executor.start();
    await aguardarAte(() => repositorio.markJobFailed.mock.calls.length === 1);
    executor.stop();

    expect(execute).toHaveBeenCalledTimes(3);
    expect(repositorio.requeueJob.mock.calls).toEqual([
      [job.id, 1, 'REDE'],
      [job.id, 2, 'REDE'],
    ]);
    expect(repositorio.markJobFailed).toHaveBeenCalledWith(job.id, 3, 'REDE');
    expect(repositorio.markJobDone).not.toHaveBeenCalled();
    expect(repositorio.markJobCanceled).not.toHaveBeenCalled();
  });

  it('falha na hora, sem devolver à fila, quando o handler lança erro de validação', async () => {
    const { repositorio, job } = criarRepositorio(criarJob());
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.reject(new JobValidationError('VIDEO_INVALIDO', 'Vídeo inválido.')),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.markJobFailed.mock.calls.length === 1);
    executor.stop();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(repositorio.markJobFailed).toHaveBeenCalledWith(job.id, 1, 'VIDEO_INVALIDO');
    expect(repositorio.requeueJob).not.toHaveBeenCalled();
    expect(repositorio.markJobDone).not.toHaveBeenCalled();
  });

  it('interrompe o handler em até 2 s quando a API marca o job como cancelado', async () => {
    const { repositorio, job } = criarRepositorio(criarJob());
    let encerrou = false;
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(({ signal }) => {
      if (signal.aborted) return Promise.resolve();
      return new Promise<void>((resolve) => {
        signal.addEventListener(
          'abort',
          () => {
            encerrou = true;
            resolve();
          },
          { once: true },
        );
      });
    });
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => execute.mock.calls.length === 1);
    const sinal = execute.mock.calls[0][0].signal;

    job.status = JobStatus.canceled;
    jest.advanceTimersByTime(1999);
    expect(sinal.aborted).toBe(false);

    jest.advanceTimersByTime(1);
    await aguardarAte(() => repositorio.markJobCanceled.mock.calls.length === 1);
    executor.stop();

    expect(sinal.aborted).toBe(true);
    expect(encerrou).toBe(true);
    expect(repositorio.markJobCanceled).toHaveBeenCalledWith(job.id);
    expect(repositorio.markJobDone).not.toHaveBeenCalled();
  });

  it('não executa o handler quando o job já está cancelado ao ser reservado', async () => {
    const { repositorio, job } = criarRepositorio(criarJob());
    repositorio.findJobStatusById.mockReturnValue(Promise.resolve(JobStatus.canceled));
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.resolve(),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.markJobCanceled.mock.calls.length === 1);
    executor.stop();

    expect(execute).not.toHaveBeenCalled();
    expect(repositorio.markJobCanceled).toHaveBeenCalledWith(job.id);
    expect(repositorio.markJobFailed).not.toHaveBeenCalled();
    expect(repositorio.requeueJob).not.toHaveBeenCalled();
  });

  it('pede a devolução dos running antigos antes de buscar jobs na fila', async () => {
    jest.setSystemTime(new Date('2026-10-31T12:00:00.000Z'));
    process.env.WORKER_STALE_LOCK_MS = '60000';
    const { repositorio } = criarRepositorio(
      criarJob({
        status: JobStatus.running,
        locked_at: new Date('2026-10-31T11:50:00.000Z'),
      }),
    );
    repositorio.requeueStaleRunningJobs.mockResolvedValue(1);
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.resolve(),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.claimNextQueuedJob.mock.calls.length > 0);
    executor.stop();

    expect(repositorio.requeueStaleRunningJobs).toHaveBeenCalledWith(
      new Date('2026-10-31T11:59:00.000Z'),
    );
    expect(repositorio.requeueStaleRunningJobs.mock.invocationCallOrder[0]).toBeLessThan(
      repositorio.claimNextQueuedJob.mock.invocationCallOrder[0],
    );
  });

  it('usa 300000 ms como limite padrão de locked_at antigo', async () => {
    jest.setSystemTime(new Date('2026-10-31T12:00:00.000Z'));
    delete process.env.WORKER_STALE_LOCK_MS;
    const { repositorio } = criarRepositorio(
      criarJob({
        status: JobStatus.running,
        locked_at: new Date('2026-10-31T11:50:00.000Z'),
      }),
    );
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.resolve(),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    executor.stop();

    expect(repositorio.requeueStaleRunningJobs).toHaveBeenCalledWith(
      new Date('2026-10-31T11:55:00.000Z'),
    );
  });

  it('respeita a concorrência configurada por tipo antes de reservar mais um job', async () => {
    process.env.PROCESS_CONCURRENCY = '1';
    const { repositorio } = criarRepositorio(criarJob());
    repositorio.countRunningJobsByType.mockReturnValue(Promise.resolve(1));
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.resolve(),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    executor.stop();

    expect(repositorio.countRunningJobsByType).toHaveBeenCalledWith(JobType.process);
    expect(repositorio.claimNextQueuedJob).not.toHaveBeenCalled();
  });
});
