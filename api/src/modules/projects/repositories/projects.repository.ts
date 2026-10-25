import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@/shared/prisma/prisma.service';

import type { IProjectsRepository } from './projects.repository.interface';

@Injectable()
export class ProjectsRepository implements IProjectsRepository {
  private readonly logger = new Logger(ProjectsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.projectsCreateInput): Promise<Prisma.projectsGetPayload<{}>> {
    try {
      const project = await this.prisma.projects.create({ data });
      this.logger.log(`Projeto criado: ${project.id}`);
      return project;
    } catch (error) {
      this.logger.error(`Erro ao criar projeto: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findByUuid(id: string): Promise<Prisma.projectsGetPayload<{}> | null> {
    try {
      const project = await this.prisma.projects.findUnique({ where: { id } });
      return project;
    } catch (error) {
      this.logger.error(`Erro ao buscar projeto ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async delete(id: string): Promise<Prisma.projectsGetPayload<{}>> {
    try {
      const project = await this.prisma.projects.delete({ where: { id } });
      this.logger.log(`Projeto deletado: ${id}`);
      return project;
    } catch (error) {
      this.logger.error(`Erro ao deletar projeto ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
