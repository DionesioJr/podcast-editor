import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@/shared/prisma/prisma.service';

import type { ITranscriptsRepository } from './transcripts.repository.interface';

@Injectable()
export class TranscriptsRepository implements ITranscriptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.transcriptsCreateInput): Promise<Prisma.transcriptsGetPayload<{}>> {
    const transcript = await this.prisma.transcripts.create({ data });
    return transcript;
  }

  async findByProjectId(projectId: string): Promise<Prisma.transcriptsGetPayload<{}> | null> {
    return this.prisma.transcripts.findUnique({ where: { project_id: projectId } });
  }

  async update(projectId: string, data: Prisma.transcriptsUpdateInput): Promise<Prisma.transcriptsGetPayload<{}>> {
    return this.prisma.transcripts.update({
      where: { project_id: projectId },
      data,
    });
  }

  async delete(projectId: string): Promise<Prisma.transcriptsGetPayload<{}>> {
    return this.prisma.transcripts.delete({ where: { project_id: projectId } });
  }
}
