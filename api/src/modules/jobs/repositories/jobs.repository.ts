import { Injectable, Logger } from '@nestjs/common';
import { JobStatus, JobType, Prisma } from '@prisma/client';

import { PrismaService } from '@/shared/prisma/prisma.service';

import type { IJobsRepository, JobRecord } from './jobs.repository.interface';

const JOB_TYPE_DB_VALUE: Record<JobType, string> = {
  [JobType.process]: 'process',
  [JobType.ai_analysis]: 'ai_analysis',
  [JobType.audio_sample]: 'audio_sample',
  [JobType.export_job]: 'export',
};

@Injectable()
export class JobsRepository implements IJobsRepository {
  private readonly logger = new Logger(JobsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async claimNextQueuedJob(type?: JobType): Promise<JobRecord | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const typeFilter = type ? Prisma.sql`AND type = ${JOB_TYPE_DB_VALUE[type]}` : Prisma.empty;
        const queued = await tx.$queryRaw<{ id: number }[]>`
          SELECT id FROM jobs
          WHERE status = ${JobStatus.queued}
          ${typeFilter}
          ORDER BY id
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;

        if (queued.length === 0) {
          return null;
        }

        return tx.jobs.update({
          where: { id: queued[0].id },
          data: { status: JobStatus.running, locked_at: new Date() },
        });
      });
    } catch (error) {
      this.logger.error(
        `Erro ao reservar o próximo job da fila: ${this.describe(error)}`,
      );
      throw error;
    }
  }

  async countRunningJobsByType(type: JobType): Promise<number> {
    return this.prisma.jobs.count({
      where: { status: JobStatus.running, job_type: type },
    });
  }

  async findJobStatusById(id: number): Promise<JobStatus | null> {
    const job = await this.prisma.jobs.findUnique({
      where: { id },
      select: { status: true },
    });

    return job?.status ?? null;
  }

  async updateJobProgress(
    id: number,
    progress: number,
    step: string | null,
  ): Promise<void> {
    await this.prisma.jobs.update({
      where: { id },
      data: { progress, step, locked_at: new Date() },
    });
  }

  async markJobDone(id: number): Promise<void> {
    await this.prisma.jobs.update({
      where: { id },
      data: {
        status: JobStatus.done,
        progress: 100,
        error_code: null,
        locked_at: null,
      },
    });
  }

  async markJobFailed(
    id: number,
    attempts: number,
    errorCode: string,
  ): Promise<void> {
    await this.prisma.jobs.update({
      where: { id },
      data: {
        status: JobStatus.failed,
        attempts,
        error_code: errorCode,
        locked_at: null,
      },
    });
  }

  async requeueJob(
    id: number,
    attempts: number,
    errorCode: string,
  ): Promise<void> {
    await this.prisma.jobs.update({
      where: { id },
      data: {
        status: JobStatus.queued,
        attempts,
        error_code: errorCode,
        locked_at: null,
      },
    });
  }

  async markJobCanceled(id: number): Promise<void> {
    await this.prisma.jobs.update({
      where: { id },
      data: { status: JobStatus.canceled, locked_at: null },
    });
  }

  async requeueStaleRunningJobs(staleBefore: Date): Promise<number> {
    const result = await this.prisma.jobs.updateMany({
      where: {
        status: JobStatus.running,
        OR: [{ locked_at: null }, { locked_at: { lt: staleBefore } }],
      },
      data: { status: JobStatus.queued, locked_at: null },
    });

    return result.count;
  }

  private describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
