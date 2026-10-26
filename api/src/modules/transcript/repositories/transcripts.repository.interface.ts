import type { Prisma } from '@prisma/client';

export interface ITranscriptsRepository {
  create(data: Prisma.transcriptsCreateInput): Promise<Prisma.transcriptsGetPayload<{}>>;
  findByProjectId(projectId: string): Promise<Prisma.transcriptsGetPayload<{}> | null>;
  update(projectId: string, data: Prisma.transcriptsUpdateInput): Promise<Prisma.transcriptsGetPayload<{}>>;
  delete(projectId: string): Promise<Prisma.transcriptsGetPayload<{}>>;
}
