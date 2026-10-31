import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';

import { JobExecutorService } from './executor/job-executor.service';
import { JobHandlerRegistry } from './executor/job-handler.registry';
import { JobsRepository } from './repositories/jobs.repository';
import { IJobsRepository } from './repositories/jobs.repository.interface';

export { IJobsRepository };

@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: IJobsRepository,
      useClass: JobsRepository,
    },
    JobHandlerRegistry,
    JobExecutorService,
  ],
  exports: [JobHandlerRegistry],
})
export class JobsModule {}
