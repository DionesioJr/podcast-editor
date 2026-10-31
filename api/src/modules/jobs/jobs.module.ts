import { Module } from '@nestjs/common';

import { SharedModule } from '@/shared/shared.module';

import { JobsRepository } from './repositories/jobs.repository';

export const IJobsRepository = Symbol('IJobsRepository');

@Module({
  imports: [SharedModule],
  providers: [
    {
      provide: IJobsRepository,
      useClass: JobsRepository,
    },
  ],
})
export class JobsModule {}
