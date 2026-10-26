import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../shared/prisma/prisma.service';
import { ProjectsModule } from './projects.module';

describe('ProjectsModule', () => {
  beforeAll(() => {
    process.env.DATABASE_URL ??= 'mysql://usuario:senha@localhost:3306/teste';
  });

  it('compila importando o SharedModule e expõe o PrismaService por injeção de dependência', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ProjectsModule],
    }).compile();

    expect(moduleRef.get(PrismaService)).toBeInstanceOf(PrismaService);
  });
});
