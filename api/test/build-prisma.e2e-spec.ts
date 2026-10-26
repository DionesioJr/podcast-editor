import * as fs from 'fs';
import { globSync } from 'glob';

jest.mock('fs');
jest.mock('glob');

describe('build-prisma (script que compila o schema.prisma modular)', () => {
  const fsMock = fs as jest.Mocked<typeof fs>;
  const globSyncMock = globSync as jest.MockedFunction<typeof globSync>;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function executarScript(): void {
    require('../prisma/build-prisma');
  }

  it('concatena base.prisma com os schemas de cada módulo em ordem alfabética', () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readFileSync.mockImplementation((caminho) => {
      if (caminho === 'prisma/base.prisma') {
        return 'generator client {\n  provider = "prisma-client-js"\n}';
      }
      if (caminho === 'src/modules/users/prisma/users.prisma') {
        return 'model users {\n  id Int @id\n}';
      }
      if (caminho === 'src/modules/projects/prisma/projects.prisma') {
        return 'model projects {\n  id Int @id\n}';
      }
      throw new Error(`Arquivo inesperado lido pelo script: ${caminho}`);
    });
    globSyncMock.mockReturnValue([
      'src/modules/users/prisma/users.prisma',
      'src/modules/projects/prisma/projects.prisma',
    ] as ReturnType<typeof globSync>);

    executarScript();

    expect(fsMock.writeFileSync).toHaveBeenCalledTimes(1);

    const [caminhoEscrito, schemaEscrito] = fsMock.writeFileSync.mock.calls[0];
    expect(caminhoEscrito).toBe('prisma/schema.prisma');
    expect(schemaEscrito as string).toContain('model projects');
    expect(schemaEscrito as string).toContain('model users');
    expect((schemaEscrito as string).indexOf('model projects')).toBeLessThan(
      (schemaEscrito as string).indexOf('model users'),
    );
  });

  it('ignora um schema de módulo vazio ou só com espaços em branco', () => {
    fsMock.existsSync.mockReturnValue(true);
    fsMock.readFileSync.mockImplementation((caminho) => {
      if (caminho === 'prisma/base.prisma') {
        return 'generator client {\n  provider = "prisma-client-js"\n}';
      }
      if (caminho === 'src/modules/vazio/prisma/vazio.prisma') {
        return '   \n  \n';
      }
      throw new Error(`Arquivo inesperado lido pelo script: ${caminho}`);
    });
    globSyncMock.mockReturnValue(['src/modules/vazio/prisma/vazio.prisma'] as ReturnType<
      typeof globSync
    >);

    executarScript();

    const [, schemaEscrito] = fsMock.writeFileSync.mock.calls[0];
    expect(schemaEscrito as string).toBe(
      'generator client {\n  provider = "prisma-client-js"\n}',
    );
  });

  it('encerra o processo com código de erro quando base.prisma não existe', () => {
    fsMock.existsSync.mockReturnValue(false);
    const processExitMock = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit chamado');
    }) as unknown as jest.SpyInstance;
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => executarScript()).toThrow('process.exit chamado');
    expect(processExitMock).toHaveBeenCalledWith(1);
    expect(consoleErrorMock).toHaveBeenCalled();
    expect(fsMock.writeFileSync).not.toHaveBeenCalled();

    processExitMock.mockRestore();
    consoleErrorMock.mockRestore();
  });
});
