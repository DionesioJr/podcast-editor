import type { Prisma } from '@prisma/client';

export interface IJobsRepository {
  claimNextQueuedJob(): Promise<Prisma.jobsGetPayload<{}> | null>;
}
