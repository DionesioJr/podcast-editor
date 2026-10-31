import * as fs from 'fs';
import * as path from 'path';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
    createApplicationContext: jest.fn(),
  },
}));

jest.mock('../src/app.module', () => ({
  AppModule: class AppModule {},
}));

const RAIZ_DA_API = path.resolve(__dirname, '..');

interface ModulosMockados {
  NestFactory: {
    create: jest.Mock;
    createApplicationContext: jest.Mock;
  };
  AppModule: unknown;
}

function carregarModulosMockados(): ModulosMockados {
  const { NestFactory } = require('@nestjs/core') as {
    NestFactory: ModulosMockados['NestFactory'];
  };
  const { AppModule } = require('../src/app.module') as { AppModule: unknown };

  return { NestFactory, AppModule };
}

function aguardarPromessas(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function criarContextoFalso() {
  return { enableShutdownHooks: jest.fn() };
}

describe('worker (e2e)', () => {
  let encerrarMock: jest.SpyInstance;
  let erroMock: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    encerrarMock = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never) as unknown as jest.SpyInstance;
    erroMock = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    encerrarMock.mockRestore();
    erroMock.mockRestore();
  });

  it('sobe o contexto do mesmo AppModule da API, sem criar aplicação HTTP', async () => {
    const { NestFactory, AppModule } = carregarModulosMockados();
    NestFactory.createApplicationContext.mockResolvedValue(criarContextoFalso());

    require('../src/worker');
    await aguardarPromessas();

    expect(NestFactory.createApplicationContext).toHaveBeenCalledWith(AppModule);
    expect(NestFactory.create).not.toHaveBeenCalled();
  });

  it('habilita o encerramento limpo do contexto', async () => {
    const { NestFactory } = carregarModulosMockados();
    const contexto = criarContextoFalso();
    NestFactory.createApplicationContext.mockResolvedValue(contexto);

    require('../src/worker');
    await aguardarPromessas();

    expect(contexto.enableShutdownHooks).toHaveBeenCalledTimes(1);
  });

  it('não encerra o processo nem registra erro quando o contexto sobe', async () => {
    const { NestFactory } = carregarModulosMockados();
    NestFactory.createApplicationContext.mockResolvedValue(criarContextoFalso());

    require('../src/worker');
    await aguardarPromessas();

    expect(encerrarMock).not.toHaveBeenCalled();
    expect(erroMock).not.toHaveBeenCalled();
  });

  it('registra a falha e encerra com código 1 quando o contexto não sobe', async () => {
    const { NestFactory } = carregarModulosMockados();
    const erro = new Error('banco indisponível');
    NestFactory.createApplicationContext.mockRejectedValue(erro);

    require('../src/worker');
    await aguardarPromessas();

    expect(erroMock).toHaveBeenCalledWith('Falha ao iniciar o worker', erro);
    expect(encerrarMock).toHaveBeenCalledWith(1);
  });

  it('não cria aplicação HTTP nem quando a subida do contexto falha', async () => {
    const { NestFactory } = carregarModulosMockados();
    NestFactory.createApplicationContext.mockRejectedValue(new Error('configuração inválida'));

    require('../src/worker');
    await aguardarPromessas();

    expect(NestFactory.create).not.toHaveBeenCalled();
  });
});

describe('entrypoints da API e do worker', () => {
  const fonteWorker = fs.readFileSync(path.join(RAIZ_DA_API, 'src/worker.ts'), 'utf8');
  const fonteMain = fs.readFileSync(path.join(RAIZ_DA_API, 'src/main.ts'), 'utf8');

  it('o worker sobe um contexto de aplicação, sem abrir porta HTTP', () => {
    expect(fonteWorker).toMatch(/createApplicationContext/);
    expect(fonteWorker).not.toMatch(/\.listen\s*\(/);
    expect(fonteWorker).not.toMatch(/NestFactory\.create\s*\(/);
  });

  it('a API e o worker compartilham o mesmo AppModule', () => {
    expect(fonteMain).toMatch(/from '\.\/app\.module'/);
    expect(fonteWorker).toMatch(/from '\.\/app\.module'/);
  });

  it('a API é quem abre a porta HTTP', () => {
    expect(fonteMain).toMatch(/NestFactory\.create\s*\(/);
    expect(fonteMain).toMatch(/\.listen\s*\(/);
  });
});

describe('scripts start:prod e start:worker do package.json', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(RAIZ_DA_API, 'package.json'), 'utf8'),
  );

  it('start:worker executa o worker compilado a partir de dist/src', () => {
    expect(packageJson.scripts['start:worker']).toBe('node dist/src/worker');
  });

  it('start:prod executa a API compilada a partir de dist/src', () => {
    expect(packageJson.scripts['start:prod']).toBe('node dist/src/main');
  });
});
