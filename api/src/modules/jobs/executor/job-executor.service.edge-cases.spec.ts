import { JobStatus, JobType } from '@prisma/client';

import {
  type IJobsRepository,
  type JobRecord,
} from '../repositories/jobs.repository.interface';
import {
  type JobExecutionContext,
  type JobHandler,
  JobCanceledError,
  TemporaryJobError,
} from './job-handler.interface';
import { JobHandlerRegistry } from './job-handler.registry';
import { JobExecutorService } from './job-executor.service';

const PROJETO = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const APP_ROLE_ORIGINAL = process.env.APP_ROLE;

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
    updateJobProgress: jest.fn<Promise<void>, [number, number, string | null]>(
      (_id, progress, step) => {
        job.progress = progress;
        job.step = step;
        return Promise.resolve();
      },
    ),
    markJobDone: jest.fn<Promise<void>, [number]>(() => {
      job.status = JobStatus.done;
      return Promise.resolve();
    }),
    markJobFailed: jest.fn<Promise<void>, [number, number, string]>(
      (_id, attempts, code) => {
        job.status = JobStatus.failed;
        job.attempts = attempts;
        job.error_code = code;
        return Promise.resolve();
      },
    ),
    requeueJob: jest.fn<Promise<void>, [number, number, string]>(
      (_id, attempts, code) => {
        job.status = JobStatus.queued;
        job.attempts = attempts;
        job.error_code = code;
        return Promise.resolve();
      },
    ),
    markJobCanceled: jest.fn<Promise<void>, [number]>(() => {
      job.status = JobStatus.canceled;
      return Promise.resolve();
    }),
    requeueStaleRunningJobs: jest.fn<Promise<number>, [Date]>(() =>
      Promise.resolve(0),
    ),
  };
  return { repositorio, job };
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

async function aguardarAte(condicao: () => boolean, voltas = 200): Promise<void> {
  for (let i = 0; i < voltas; i += 1) {
    if (condicao()) return;
    await Promise.resolve();
  }
  throw new Error(`Condição não atingida após ${voltas} voltas.`);
}

describe('JobExecutorService (casos de borda do retry)', () => {
  afterEach(() => {
    if (APP_ROLE_ORIGINAL === undefined) delete process.env.APP_ROLE;
    else process.env.APP_ROLE = APP_ROLE_ORIGINAL;
  });

  it('classifica erro desconhecido como JOB_ERROR e falha de imediato, sem devolver à fila', async () => {
    const { repositorio, job } = criarRepositorio(criarJob());
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.reject(new Error('falha inesperada no FFmpeg')),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.markJobFailed.mock.calls.length === 1);
    executor.stop();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(repositorio.markJobFailed).toHaveBeenCalledWith(job.id, 1, 'JOB_ERROR');
    expect(repositorio.requeueJob).not.toHaveBeenCalled();
    expect(repositorio.markJobDone).not.toHaveBeenCalled();
    expect(repositorio.markJobCanceled).not.toHaveBeenCalled();
  });

  it('marca como cancelado, sem falhar, quando o handler lança JobCanceledError', async () => {
    const { repositorio, job } = criarRepositorio(criarJob());
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.reject(new JobCanceledError('JOB_CANCELADO', 'Cancelado pelo usuário.')),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.markJobCanceled.mock.calls.length === 1);
    executor.stop();

    expect(repositorio.markJobCanceled).toHaveBeenCalledWith(job.id);
    expect(repositorio.markJobFailed).not.toHaveBeenCalled();
    expect(repositorio.requeueJob).not.toHaveBeenCalled();
    expect(repositorio.markJobDone).not.toHaveBeenCalled();
  });

  it('marca como cancelado quando o handler lança um AbortError', async () => {
    const { repositorio, job } = criarRepositorio(criarJob());
    const abortError = new Error('Operação abortada');
    abortError.name = 'AbortError';
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.reject(abortError),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.markJobCanceled.mock.calls.length === 1);
    executor.stop();

    expect(repositorio.markJobCanceled).toHaveBeenCalledWith(job.id);
    expect(repositorio.markJobFailed).not.toHaveBeenCalled();
    expect(repositorio.requeueJob).not.toHaveBeenCalled();
  });

  it('falha na terceira tentativa, sem devolver à fila, quando o job chega com duas tentativas', async () => {
    const { repositorio, job } = criarRepositorio(criarJob({ attempts: 2 }));
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.reject(new TemporaryJobError('REDE', 'Falha temporária.')),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.markJobFailed.mock.calls.length === 1);
    executor.stop();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(repositorio.markJobFailed).toHaveBeenCalledWith(job.id, 3, 'REDE');
    expect(repositorio.requeueJob).not.toHaveBeenCalled();
  });

  it('devolve à fila com a tentativa seguinte quando o job chega com uma tentativa', async () => {
    const { repositorio, job } = criarRepositorio(criarJob({ attempts: 1 }));
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.reject(new TemporaryJobError('REDE', 'Falha temporária.')),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.requeueJob.mock.calls.length === 1);
    executor.stop();

    expect(repositorio.requeueJob).toHaveBeenCalledWith(job.id, 2, 'REDE');
    expect(repositorio.markJobFailed).not.toHaveBeenCalled();
    expect(repositorio.markJobCanceled).not.toHaveBeenCalled();
  });

  it('normaliza o progresso entre 0 e 100, arredonda e repassa o step', async () => {
    const { repositorio, job } = criarRepositorio(criarJob());
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(
      async (contexto) => {
        await contexto.updateProgress(-10);
        await contexto.updateProgress(150.6);
        await contexto.updateProgress(33.4, 'extraindo');
      },
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.start();
    await aguardarAte(() => repositorio.markJobDone.mock.calls.length === 1);
    executor.stop();

    expect(repositorio.updateJobProgress.mock.calls).toEqual([
      [job.id, 0, null],
      [job.id, 100, null],
      [job.id, 33, 'extraindo'],
    ]);
    expect(repositorio.markJobDone).toHaveBeenCalledWith(job.id);
  });
});

describe('JobExecutorService (ciclo de vida)', () => {
  afterEach(() => {
    if (APP_ROLE_ORIGINAL === undefined) delete process.env.APP_ROLE;
    else process.env.APP_ROLE = APP_ROLE_ORIGINAL;
  });

  it('não inicia pelo bootstrap quando APP_ROLE não é worker', async () => {
    process.env.APP_ROLE = 'api';
    const { repositorio } = criarRepositorio(criarJob());
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.resolve(),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.onApplicationBootstrap();
    executor.stop();

    expect(repositorio.requeueStaleRunningJobs).not.toHaveBeenCalled();
    expect(repositorio.claimNextQueuedJob).not.toHaveBeenCalled();
  });

  it('recupera os jobs antigos pelo bootstrap quando APP_ROLE é worker', async () => {
    process.env.APP_ROLE = 'worker';
    const { repositorio } = criarRepositorio(criarJob());
    const execute = jest.fn<Promise<void>, [JobExecutionContext]>(() =>
      Promise.resolve(),
    );
    const executor = criarExecutor(repositorio, execute);

    await executor.onApplicationBootstrap();
    executor.stop();

    expect(repositorio.requeueStaleRunningJobs).toHaveBeenCalledTimes(1);
  });
});
