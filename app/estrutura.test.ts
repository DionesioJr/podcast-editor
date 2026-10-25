import fs from 'fs';
import path from 'path';

import jestConfig from './jest.config';

const tsconfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf-8'),
);

const PASTAS_ESPERADAS = [
  'components',
  'config',
  'constants',
  'hooks',
  'i18n',
  'modules',
  'providers',
  'shared',
];

describe('Aliases do TypeScript (PDE-6)', () => {
  it('define baseUrl na raiz do app', () => {
    expect(tsconfig.compilerOptions.baseUrl).toBe('.');
  });

  it('mapeia @/* para a raiz do app', () => {
    expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./*']);
  });

  it('mapeia @src/* para a pasta src', () => {
    expect(tsconfig.compilerOptions.paths['@src/*']).toEqual(['./src/*']);
  });

  it('não define alias além dos dois esperados', () => {
    expect(Object.keys(tsconfig.compilerOptions.paths).sort()).toEqual([
      '@/*',
      '@src/*',
    ]);
  });
});

describe('Alias no Jest (PDE-6)', () => {
  it('mapeia @/* para a mesma pasta que o tsconfig', () => {
    expect(jestConfig.moduleNameMapper['^@/(.*)$']).toBe('<rootDir>/$1');
  });

  it('mapeia @src/* para a mesma pasta que o tsconfig', () => {
    expect(jestConfig.moduleNameMapper['^@src/(.*)$']).toBe('<rootDir>/src/$1');
  });

  it('não define alias no Jest além dos dois que existem no tsconfig', () => {
    expect(Object.keys(jestConfig.moduleNameMapper).sort()).toEqual([
      '^@/(.*)$',
      '^@src/(.*)$',
    ]);
  });
});

describe('Estrutura de pastas do pust/mobile (PDE-6)', () => {
  it.each(PASTAS_ESPERADAS)('src/%s existe e é uma pasta', (pasta) => {
    const caminho = path.join(__dirname, 'src', pasta);
    expect(fs.existsSync(caminho)).toBe(true);
    expect(fs.statSync(caminho).isDirectory()).toBe(true);
  });

  it('não existe pasta fora do padrão dentro de src', () => {
    const pastasEmSrc = fs
      .readdirSync(path.join(__dirname, 'src'))
      .filter((nome) =>
        fs.statSync(path.join(__dirname, 'src', nome)).isDirectory(),
      )
      .sort();

    expect(pastasEmSrc).toEqual([...PASTAS_ESPERADAS].sort());
  });
});
