import * as fs from 'fs';
import * as path from 'path';

import { PrismaService as ServicoViaAlias } from '@/shared/prisma/prisma.service';
import { SharedModule as ModuloViaAlias } from '@/shared/shared.module';

import { PrismaService as ServicoViaCaminhoRelativo } from '../src/shared/prisma/prisma.service';
import { SharedModule as ModuloViaCaminhoRelativo } from '../src/shared/shared.module';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const PADRAO_ALIAS = '^@/(.*)$';

const tsconfig = JSON.parse(
  fs.readFileSync(path.join(RAIZ_DA_API, 'tsconfig.json'), 'utf8'),
) as {
  compilerOptions: {
    baseUrl: string;
    paths: Record<string, string[]>;
  };
};

const packageJson = JSON.parse(
  fs.readFileSync(path.join(RAIZ_DA_API, 'package.json'), 'utf8'),
) as {
  scripts: Record<string, string | undefined>;
  jest: {
    rootDir: string;
    moduleNameMapper: Record<string, string>;
  };
};

const jestE2e = JSON.parse(
  fs.readFileSync(path.join(RAIZ_DA_API, 'test', 'jest-e2e.json'), 'utf8'),
) as {
  rootDir: string;
  moduleNameMapper: Record<string, string>;
};

describe('Aliases @/* no TypeScript da api (PDE-115)', () => {
  it('define baseUrl na raiz da api', () => {
    expect(tsconfig.compilerOptions.baseUrl).toBe('./');
  });

  it('mapeia @/* para a pasta src', () => {
    expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['src/*']);
  });

  it('não declara alias além de @/*', () => {
    expect(Object.keys(tsconfig.compilerOptions.paths).sort()).toEqual(['@/*']);
  });
});

describe('Alias @/* no Jest de testes unitários (PDE-115)', () => {
  it('mapeia @/* para a pasta src a partir do rootDir src', () => {
    expect(packageJson.jest.moduleNameMapper[PADRAO_ALIAS]).toBe(
      '<rootDir>/$1',
    );
  });

  it('usa src como rootDir, para @/ apontar para a pasta src', () => {
    expect(packageJson.jest.rootDir).toBe('src');
  });

  it('não declara alias além de @/* no Jest', () => {
    expect(Object.keys(packageJson.jest.moduleNameMapper).sort()).toEqual([
      PADRAO_ALIAS,
    ]);
  });
});

describe('Alias @/* no Jest de testes e2e (PDE-115)', () => {
  it('mapeia @/* para a pasta src a partir de test/', () => {
    expect(jestE2e.moduleNameMapper[PADRAO_ALIAS]).toBe(
      '<rootDir>/../src/$1',
    );
  });

  it('não declara alias além de @/* no Jest e2e', () => {
    expect(Object.keys(jestE2e.moduleNameMapper).sort()).toEqual([
      PADRAO_ALIAS,
    ]);
  });
});

describe('Checagem de tipos dos aliases (PDE-115)', () => {
  it('declara um script typecheck que roda tsc sem emitir arquivos', () => {
    const typecheck = packageJson.scripts.typecheck ?? '';

    expect(packageJson.scripts.typecheck).toBeDefined();
    expect(typecheck).toMatch(/\btsc\b/);
    expect(typecheck).toMatch(/--noEmit/);
  });
});

describe('Consistência do destino dos aliases (PDE-115)', () => {
  it('aponta tsconfig, Jest unitário e Jest e2e para a mesma pasta src', () => {
    const srcDoTsconfig = path.resolve(
      RAIZ_DA_API,
      tsconfig.compilerOptions.baseUrl,
      tsconfig.compilerOptions.paths['@/*'][0].replace('*', 'shared'),
    );
    const srcDoJestUnitario = path.resolve(
      RAIZ_DA_API,
      packageJson.jest.rootDir,
      'shared',
    );
    const srcDoJestE2e = path.resolve(
      RAIZ_DA_API,
      'test',
      jestE2e.moduleNameMapper[PADRAO_ALIAS]
        .replace('<rootDir>/', '')
        .replace('$1', 'shared'),
    );

    expect(srcDoTsconfig).toBe(srcDoJestUnitario);
    expect(srcDoJestE2e).toBe(srcDoJestUnitario);
  });
});

describe('Resolução em tempo de execução do alias @/* (PDE-115)', () => {
  it('resolve @/ para o mesmo módulo do caminho relativo dentro de src', () => {
    expect(ModuloViaAlias).toBeDefined();
    expect(ModuloViaAlias).toBe(ModuloViaCaminhoRelativo);
  });

  it('resolve um caminho aninhado com @/ para o mesmo módulo do caminho relativo', () => {
    expect(ServicoViaAlias).toBeDefined();
    expect(ServicoViaAlias).toBe(ServicoViaCaminhoRelativo);
  });

  it('não captura pacotes do node_modules', () => {
    const regex = new RegExp(PADRAO_ALIAS);

    expect(regex.test('@nestjs/common')).toBe(false);
    expect(regex.test('rxjs')).toBe(false);
  });

  it('falha com MODULE_NOT_FOUND ao importar um alias inexistente', () => {
    let erroCapturado: unknown;

    try {
      require('@/modulo/que/nao/existe');
    } catch (erro) {
      erroCapturado = erro;
    }

    expect(erroCapturado).toBeInstanceOf(Error);
    expect((erroCapturado as NodeJS.ErrnoException).code).toBe(
      'MODULE_NOT_FOUND',
    );
  });
});
