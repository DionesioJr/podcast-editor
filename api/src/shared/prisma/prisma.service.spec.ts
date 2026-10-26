import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeAll(() => {
    process.env.DATABASE_URL ??= 'mysql://usuario:senha@localhost:3306/teste';
  });

  beforeEach(() => {
    service = new PrismaService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('conecta ao banco de dados ao inicializar o módulo', async () => {
    const conectar = jest.spyOn(service, '$connect').mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(conectar).toHaveBeenCalledTimes(1);
  });

  it('desconecta do banco de dados ao destruir o módulo', async () => {
    const desconectar = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(desconectar).toHaveBeenCalledTimes(1);
  });

  it('propaga o erro quando a conexão com o banco falha na inicialização', async () => {
    const erro = new Error('Não foi possível conectar ao banco de dados');
    jest.spyOn(service, '$connect').mockRejectedValue(erro);

    await expect(service.onModuleInit()).rejects.toThrow(erro);
  });

  it('propaga o erro quando a desconexão falha na destruição do módulo', async () => {
    const erro = new Error('Não foi possível desconectar do banco de dados');
    jest.spyOn(service, '$disconnect').mockRejectedValue(erro);

    await expect(service.onModuleDestroy()).rejects.toThrow(erro);
  });
});
