import type { Prisma } from '@prisma/client';

export interface IProjectsRepository {
  create(data: Prisma.projectsCreateInput): Promise<Prisma.projectsGetPayload<{}>>;
  findByUuid(id: string): Promise<Prisma.projectsGetPayload<{}> | null>;
  delete(id: string): Promise<Prisma.projectsGetPayload<{}>>;
}
