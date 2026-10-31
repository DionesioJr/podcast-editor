import { Injectable, Logger } from '@nestjs/common';
import { JobStatus, type Prisma } from '@prisma/client';

import { PrismaService } from '@/shared/prisma/prisma.service';

import type { IJobsRepository } from './jobs.repository.interface';

@Injectable()
export class JobsRepository implements IJobsRepository {
  private readonly logger = new Logger(JobsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async claimNextQueuedJob(): Promise<Prisma.jobsGetPayload<{}> | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const queued = await tx.$queryRaw<{ id: number }[]>`
          SELECT id FROM jobs
          WHERE status = ${JobStatus.queued}
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
      this.logger.error(`Erro ao reservar o próximo job da fila: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
