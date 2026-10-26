import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';

import { ProjectsRepository } from './repositories/projects.repository';
import { ProjectsController } from './projects.controller';
import { CreateProjectCommand } from './commands/create-project.command';
import { CreateProjectFacade } from './facade/create-project.facade';

@Module({
  imports: [SharedModule],
  controllers: [ProjectsController],
  providers: [
    {
      provide: 'IProjectsRepository',
      useClass: ProjectsRepository,
    },
    CreateProjectCommand,
    CreateProjectFacade,
  ],
  exports: [CreateProjectFacade, 'IProjectsRepository'],
})
export class ProjectsModule {}
