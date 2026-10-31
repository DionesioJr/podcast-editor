import type { JobStatus, JobType, Prisma } from '@prisma/client';

export const IJobsRepository = Symbol('IJobsRepository');

export type JobRecord = Prisma.jobsGetPayload<{}>;

export interface IJobsRepository {
  claimNextQueuedJob(type?: JobType): Promise<JobRecord | null>;
  countRunningJobsByType(type: JobType): Promise<number>;
  findJobStatusById(id: number): Promise<JobStatus | null>;
  updateJobProgress(id: number, progress: number, step: string | null): Promise<void>;
  markJobDone(id: number): Promise<void>;
  markJobFailed(id: number, attempts: number, errorCode: string): Promise<void>;
  requeueJob(id: number, attempts: number, errorCode: string): Promise<void>;
  markJobCanceled(id: number): Promise<void>;
  requeueStaleRunningJobs(staleBefore: Date): Promise<number>;
}
