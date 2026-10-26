import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@/shared/prisma/prisma.service';

import type { ITranscriptsRepository } from './transcripts.repository.interface';

@Injectable()
export class TranscriptsRepository implements ITranscriptsRepository {
  private readonly logger = new Logger(TranscriptsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.transcriptsCreateInput): Promise<Prisma.transcriptsGetPayload<{}>> {
    try {
      const transcript = await this.prisma.transcripts.create({ data });
      this.logger.log('Transcrição criada com sucesso');
      return transcript;
    } catch (error) {
      this.logger.error(`Erro ao criar transcrição: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findByProjectId(projectId: string): Promise<Prisma.transcriptsGetPayload<{}> | null> {
    try {
      const transcript = await this.prisma.transcripts.findUnique({ where: { project_id: projectId } });
      return transcript;
    } catch (error) {
      this.logger.error(`Erro ao buscar transcrição: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async update(projectId: string, data: Prisma.transcriptsUpdateInput): Promise<Prisma.transcriptsGetPayload<{}>> {
    try {
      const transcript = await this.prisma.transcripts.update({
        where: { project_id: projectId },
        data,
      });
      this.logger.log('Transcrição atualizada com sucesso');
      return transcript;
    } catch (error) {
      this.logger.error(`Erro ao atualizar transcrição: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async delete(projectId: string): Promise<Prisma.transcriptsGetPayload<{}>> {
    try {
      const transcript = await this.prisma.transcripts.delete({ where: { project_id: projectId } });
      this.logger.log('Transcrição deletada com sucesso');
      return transcript;
    } catch (error) {
      this.logger.error(`Erro ao deletar transcrição: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
