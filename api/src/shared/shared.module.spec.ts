import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from './prisma/prisma.service';
import { SharedModule } from './shared.module';

describe('SharedModule', () => {
  let moduleRef: TestingModule;

  beforeAll(() => {
    process.env.DATABASE_URL ??= 'mysql://usuario:senha@localhost:3306/teste';
  });

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [SharedModule],
    }).compile();
  });

  it('exporta o PrismaService para os módulos que importarem o SharedModule', () => {
    const prismaService = moduleRef.get(PrismaService);

    expect(prismaService).toBeInstanceOf(PrismaService);
  });

  it('devolve a mesma instância de PrismaService em resoluções sucessivas (singleton)', () => {
    const primeira = moduleRef.get(PrismaService);
    const segunda = moduleRef.get(PrismaService);

    expect(primeira).toBe(segunda);
  });

  it('lança erro ao tentar resolver um provider que o SharedModule não declara', () => {
    class ProviderInexistente {}

    expect(() => moduleRef.get(ProviderInexistente)).toThrow();
  });
});
