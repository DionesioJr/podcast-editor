import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/shared/prisma/prisma.service';

import { IJobsRepository, JobsModule } from './jobs.module';
import { JobsRepository } from './repositories/jobs.repository';

describe('JobsModule', () => {
  beforeAll(() => {
    process.env.DATABASE_URL ??= 'mysql://usuario:senha@localhost:3306/teste';
  });

  it('compila importando o SharedModule e expõe o PrismaService por injeção de dependência', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [JobsModule],
    }).compile();

    expect(moduleRef.get(PrismaService)).toBeInstanceOf(PrismaService);
  });

  it('resolve o token IJobsRepository para a implementação JobsRepository', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [JobsModule],
    }).compile();

    expect(moduleRef.get(IJobsRepository)).toBeInstanceOf(JobsRepository);
  });

  it('usa um Symbol nomeado como token do repositório, não a própria classe', () => {
    expect(typeof IJobsRepository).toBe('symbol');
    expect(IJobsRepository.toString()).toContain('IJobsRepository');
  });
});
