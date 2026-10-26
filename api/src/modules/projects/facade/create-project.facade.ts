import { Injectable } from '@nestjs/common';

import { CreateProjectCommand, CreateProjectOutput } from '../commands/create-project.command';

export interface CreateProjectInput {
  originalName: string;
  sizeBytes: number;
  clientIp: string;
}

@Injectable()
export class CreateProjectFacade {
  constructor(private readonly createProjectCommand: CreateProjectCommand) {}

  async create(input: CreateProjectInput): Promise<CreateProjectOutput> {
    return this.createProjectCommand.execute(input);
  }
}
