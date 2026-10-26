import { Injectable, Inject } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

import { IProjectsRepository } from '../repositories/projects.repository.interface';

export interface CreateProjectInput {
  originalName: string;
  sizeBytes: number;
  clientIp: string;
}

export interface CreateProjectOutput {
  id: string;
  token: string;
  partSize: number;
}

@Injectable()
export class CreateProjectCommand {
  private readonly PART_SIZE = 8388608; // 8 MB

  constructor(@Inject('IProjectsRepository') private readonly repository: IProjectsRepository) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    const id = uuidv4();
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const ipHash = createHash('sha256').update(input.clientIp).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.repository.create({
      id,
      token_hash: tokenHash,
      ip_hash: ipHash,
      status: 'UPLOADING',
      original_name: input.originalName,
      size_bytes: BigInt(input.sizeBytes),
      duration_ms: 0,
      width: 0,
      height: 0,
      settings: JSON.stringify({}),
      manual_cuts: JSON.stringify([]),
      protected_ranges: JSON.stringify([]),
      expires_at: expiresAt,
    });

    return {
      id,
      token,
      partSize: this.PART_SIZE,
    };
  }
}
