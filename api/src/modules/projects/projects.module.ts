import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';

import { ProjectsRepository } from './repositories/projects.repository';

export const IProjectsRepository = Symbol('IProjectsRepository');

@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: IProjectsRepository,
      useClass: ProjectsRepository,
    },
  ],
})
export class ProjectsModule {}
