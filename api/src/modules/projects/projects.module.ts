import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';

import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './repositories/projects.repository';

@Module({
  imports: [SharedModule],
  controllers: [ProjectsController],
  providers: [ProjectsRepository],
})
export class ProjectsModule {}
