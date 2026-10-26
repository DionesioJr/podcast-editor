import { SharedModule as SharedModuleViaAlias } from '@/shared/shared.module';
import { PrismaService as PrismaServiceViaAlias } from '@/shared/prisma/prisma.service';

import { SharedModule as SharedModuleViaCaminhoRelativo } from './shared/shared.module';
import { PrismaService as PrismaServiceViaCaminhoRelativo } from './shared/prisma/prisma.service';

describe('Resolução do alias @/* no Jest', () => {
  it('resolve um import de primeiro nível (@/shared/shared.module) para a mesma classe do caminho relativo', () => {
    expect(SharedModuleViaAlias).toBeDefined();
    expect(SharedModuleViaAlias).toBe(SharedModuleViaCaminhoRelativo);
  });

  it('resolve um import de caminho aninhado (@/shared/prisma/prisma.service) para a mesma classe do caminho relativo', () => {
    expect(PrismaServiceViaAlias).toBeDefined();
    expect(PrismaServiceViaAlias).toBe(PrismaServiceViaCaminhoRelativo);
  });

  it('não resolve um alias que não existe em src, falhando como "Cannot find module"', () => {
    expect(() => require('@/modulo/que/nao/existe')).toThrow(/Cannot find module/);
  });
});
