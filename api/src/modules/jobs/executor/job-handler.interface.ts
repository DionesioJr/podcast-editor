import type { JobType } from '@prisma/client';

import type { JobRecord } from '../repositories/jobs.repository.interface';

export interface JobExecutionContext {
  readonly job: JobRecord;
  readonly signal: AbortSignal;
  updateProgress(progress: number, step?: string): Promise<void>;
}

export interface JobHandler {
  readonly type: JobType;
  execute(context: JobExecutionContext): Promise<void>;
}

export class TemporaryJobError extends Error {
  constructor(
    readonly code: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'TemporaryJobError';
  }
}

export class JobValidationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'JobValidationError';
  }
}

export class JobCanceledError extends Error {
  constructor(
    readonly code: string = 'JOB_CANCELED',
    message: string = 'Job cancelado.',
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'JobCanceledError';
  }
}
