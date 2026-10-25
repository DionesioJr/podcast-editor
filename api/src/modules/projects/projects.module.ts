import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [SharedModule],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
