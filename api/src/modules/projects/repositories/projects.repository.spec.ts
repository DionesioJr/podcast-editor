import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/shared/prisma/prisma.service';

import { ProjectsRepository } from './projects.repository';

describe('ProjectsRepository', () => {
  let repository: ProjectsRepository;
  let prisma: {
    projects: {
      create: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };

  const projetoFake = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    token_hash: 'a'.repeat(64),
    ip_hash: 'b'.repeat(64),
    status: 'UPLOADING',
    error_code: null,
    original_name: 'aula-01.mp4',
    size_bytes: BigInt(1024),
    duration_ms: 60000,
    width: 1920,
    height: 1080,
    has_speech: false,
    low_quality: false,
    settings: '{}',
    manual_cuts: '[]',
    protected_ranges: '[]',
    history_cursor: 0,
    ai_analyses_used: 0,
    exports_used: 0,
    expires_at: new Date('2026-10-26T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      projects: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<ProjectsRepository>(ProjectsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar o projeto repassando os dados ao Prisma e devolver o registro criado', async () => {
      prisma.projects.create.mockResolvedValue(projetoFake);

      const resultado = await repository.create(projetoFake as never);

      expect(prisma.projects.create).toHaveBeenCalledWith({ data: projetoFake });
      expect(resultado).toEqual(projetoFake);
    });

    it('deve propagar o erro quando o Prisma falhar ao criar, sem expor o uuid na mensagem', async () => {
      const erro = new Error('Erro de conexão com o banco');
      prisma.projects.create.mockRejectedValue(erro);

      await expect(repository.create(projetoFake as never)).rejects.toThrow(erro);
    });
  });

  describe('findByUuid', () => {
    it('deve buscar o projeto pelo uuid e devolver o registro encontrado', async () => {
      prisma.projects.findUnique.mockResolvedValue(projetoFake);

      const resultado = await repository.findByUuid(projetoFake.id);

      expect(prisma.projects.findUnique).toHaveBeenCalledWith({
        where: { id: projetoFake.id },
      });
      expect(resultado).toEqual(projetoFake);
    });

    it('deve devolver null quando não encontrar projeto com o uuid informado', async () => {
      prisma.projects.findUnique.mockResolvedValue(null);

      const resultado = await repository.findByUuid('uuid-inexistente');

      expect(resultado).toBeNull();
    });

    it('deve propagar o erro quando o Prisma falhar ao buscar', async () => {
      const erro = new Error('Erro de conexão com o banco');
      prisma.projects.findUnique.mockRejectedValue(erro);

      await expect(repository.findByUuid(projetoFake.id)).rejects.toThrow(erro);
    });
  });

  describe('delete', () => {
    it('deve apagar o projeto pelo uuid e devolver o registro apagado', async () => {
      prisma.projects.delete.mockResolvedValue(projetoFake);

      const resultado = await repository.delete(projetoFake.id);

      expect(prisma.projects.delete).toHaveBeenCalledWith({
        where: { id: projetoFake.id },
      });
      expect(resultado).toEqual(projetoFake);
    });

    it('deve propagar o erro quando tentar apagar um projeto que não existe', async () => {
      const erro = new Error('Registro não encontrado');
      prisma.projects.delete.mockRejectedValue(erro);

      await expect(repository.delete('uuid-inexistente')).rejects.toThrow(erro);
    });
  });
});
