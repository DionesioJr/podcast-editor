import path from 'path';

import { Platform } from 'react-native';

import { api as apiPorAlias } from '@/src/config/api';
import { theme as themePorAlias } from '@src/constants/theme';
import { ApiError } from '@src/shared/lib/api-error';

import jestConfig from './jest.config';
import { api as apiRelativo } from './src/config/api';
import { theme as themeRelativo } from './src/constants/theme';

const MAPEAMENTO: Record<string, string> = { ...jestConfig.moduleNameMapper };
const PADRAO_RAIZ = '^@/(.*)$';
const PADRAO_SRC = '^@src/(.*)$';

describe('moduleNameMapper dos aliases do app (PDE-105)', () => {
  it('mapeia @/* para a raiz do app', () => {
    expect(MAPEAMENTO[PADRAO_RAIZ]).toBe('<rootDir>/$1');
  });

  it('mapeia @src/* para a pasta src do app', () => {
    expect(MAPEAMENTO[PADRAO_SRC]).toBe('<rootDir>/src/$1');
  });

  it('não define alias além dos dois declarados no tsconfig', () => {
    expect(Object.keys(MAPEAMENTO).sort()).toEqual(
      [PADRAO_RAIZ, PADRAO_SRC].sort(),
    );
  });

  it('usa <rootDir> nos destinos, sem caminho absoluto da máquina', () => {
    for (const destino of Object.values(MAPEAMENTO)) {
      expect(destino.startsWith('<rootDir>/')).toBe(true);
      expect(path.isAbsolute(destino)).toBe(false);
    }
  });

  it('mantém o preset jest-expo, para o mapeamento não substituir a configuração do Expo', () => {
    expect(jestConfig.preset).toBe('jest-expo');
  });
});

describe('Especificidade dos padrões de alias (PDE-105)', () => {
  const regexRaiz = new RegExp(PADRAO_RAIZ);
  const regexSrc = new RegExp(PADRAO_SRC);

  it('captura caminhos com várias pastas depois do alias', () => {
    expect(regexSrc.exec('@src/shared/lib/api-error')?.[1]).toBe(
      'shared/lib/api-error',
    );
    expect(regexRaiz.exec('@/src/config/api')?.[1]).toBe('src/config/api');
  });

  it('não deixa @/* capturar um import de @src/*', () => {
    expect(regexRaiz.test('@src/constants/theme')).toBe(false);
  });

  it('não deixa @src/* capturar um import de @/*', () => {
    expect(regexSrc.test('@/src/config/api')).toBe(false);
  });

  it('não captura pacotes do node_modules', () => {
    expect(regexRaiz.test('react-native')).toBe(false);
    expect(regexSrc.test('react-native')).toBe(false);
  });
});

describe('Resolução em tempo de execução dos aliases (PDE-105)', () => {
  it('resolve @src/* em um módulo aninhado dentro de src', () => {
    expect(themePorAlias.colors.primary).toBe('#4F2BE8');
  });

  it('resolve @src/* em cadeia, quando o módulo importado também usa o alias', () => {
    expect(new ApiError('PROJECT_NOT_FOUND').message).toBe(
      'Projeto não encontrado.',
    );
  });

  it('resolve @/* a partir da raiz do app', () => {
    expect(apiPorAlias.baseURL).toBe(apiRelativo.baseURL);
  });

  it('o import por alias devolve o mesmo módulo que o import relativo', () => {
    expect(themePorAlias).toBe(themeRelativo);
    expect(apiPorAlias).toBe(apiRelativo);
  });

  it('não atrapalha a resolução de pacotes do node_modules', () => {
    expect(typeof Platform.OS).toBe('string');
  });
});
