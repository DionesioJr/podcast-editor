import { Injectable, Logger } from '@nestjs/common';
import type { JobType } from '@prisma/client';

import type { JobHandler } from './job-handler.interface';

@Injectable()
export class JobHandlerRegistry {
  private readonly logger = new Logger(JobHandlerRegistry.name);
  private readonly handlers = new Map<JobType, JobHandler>();

  register(handler: JobHandler): void {
    if (this.handlers.has(handler.type)) {
      this.logger.warn(
        `Handler do tipo ${handler.type} já registrado. Substituindo pelo novo.`,
      );
    }

    this.handlers.set(handler.type, handler);
  }

  get(type: JobType): JobHandler | undefined {
    return this.handlers.get(type);
  }

  types(): JobType[] {
    return [...this.handlers.keys()];
  }
}
