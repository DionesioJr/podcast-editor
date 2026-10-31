jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
    createApplicationContext: jest.fn(),
  },
}));

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: class {
    setTitle() {
      return this;
    }
    setDescription() {
      return this;
    }
    setVersion() {
      return this;
    }
    build() {
      return {};
    }
  },
  SwaggerModule: {
    createDocument: jest.fn(() => ({})),
    setup: jest.fn(),
  },
}));

jest.mock('../src/app.module', () => ({
  AppModule: class AppModule {},
}));

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

function criarAplicacaoFalsa() {
  return {
    useGlobalFilters: jest.fn(),
    useGlobalPipes: jest.fn(),
    listen: jest.fn().mockResolvedValue(undefined),
  };
}

describe('main da API (e2e)', () => {
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

  it('sobe a aplicação HTTP a partir do AppModule', async () => {
    const { NestFactory, AppModule } = carregarModulosMockados();
    NestFactory.create.mockResolvedValue(criarAplicacaoFalsa());

    require('../src/main');
    await aguardarPromessas();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(NestFactory.createApplicationContext).not.toHaveBeenCalled();
  });

  it('abre a porta HTTP a partir do PORT do ambiente', async () => {
    const { NestFactory } = carregarModulosMockados();
    const aplicacao = criarAplicacaoFalsa();
    NestFactory.create.mockResolvedValue(aplicacao);

    require('../src/main');
    await aguardarPromessas();

    expect(aplicacao.listen).toHaveBeenCalledWith(process.env.PORT ?? 3000);
  });

  it('não encerra o processo nem registra erro quando a API sobe', async () => {
    const { NestFactory } = carregarModulosMockados();
    NestFactory.create.mockResolvedValue(criarAplicacaoFalsa());

    require('../src/main');
    await aguardarPromessas();

    expect(encerrarMock).not.toHaveBeenCalled();
    expect(erroMock).not.toHaveBeenCalled();
  });

  it('registra a falha e encerra com código 1 quando a subida da API falha', async () => {
    const { NestFactory } = carregarModulosMockados();
    const erro = new Error('banco indisponível');
    NestFactory.create.mockRejectedValue(erro);

    require('../src/main');
    await aguardarPromessas();

    expect(erroMock).toHaveBeenCalledWith('Falha ao iniciar a API', erro);
    expect(encerrarMock).toHaveBeenCalledWith(1);
  });

  it('não cria contexto de worker quando a subida da API falha', async () => {
    const { NestFactory } = carregarModulosMockados();
    NestFactory.create.mockRejectedValue(new Error('banco indisponível'));

    require('../src/main');
    await aguardarPromessas();

    expect(NestFactory.createApplicationContext).not.toHaveBeenCalled();
  });

  it('registra a falha e encerra com código 1 quando abrir a porta HTTP falha', async () => {
    const { NestFactory } = carregarModulosMockados();
    const erro = new Error('porta ocupada');
    const aplicacao = criarAplicacaoFalsa();
    aplicacao.listen.mockRejectedValue(erro);
    NestFactory.create.mockResolvedValue(aplicacao);

    require('../src/main');
    await aguardarPromessas();

    expect(erroMock).toHaveBeenCalledWith('Falha ao iniciar a API', erro);
    expect(encerrarMock).toHaveBeenCalledWith(1);
  });
});
