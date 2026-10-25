import { Module } from '@nestjs/common';

import { SharedModule } from './shared/shared.module';
import { HealthModule } from './modules/health/health.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [SharedModule, HealthModule, ProjectsModule],
})
export class AppModule {}
