import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/shared/prisma/prisma.service';

import { TranscriptsRepository } from './transcripts.repository';

describe('TranscriptsRepository', () => {
  let repository: TranscriptsRepository;
  let prisma: {
    transcripts: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const palavraFake = { i: 0, w: 'olá', s: 0, e: 320, sp: 1, f: null };

  const transcricaoFake = {
    project_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    words: JSON.stringify([palavraFake]),
    sentences: JSON.stringify([{ i: 0, start: 0, end: 320, text: 'olá' }]),
    pauses: JSON.stringify([{ s: 320, e: 500 }]),
  };

  beforeEach(async () => {
    prisma = {
      transcripts: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<TranscriptsRepository>(TranscriptsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar a transcrição repassando os dados ao Prisma e devolver o registro criado', async () => {
      prisma.transcripts.create.mockResolvedValue(transcricaoFake);

      const resultado = await repository.create(transcricaoFake as never);

      expect(prisma.transcripts.create).toHaveBeenCalledWith({ data: transcricaoFake });
      expect(resultado).toEqual(transcricaoFake);
    });

    it('deve guardar as palavras com os campos i, w, s, e, sp e f', async () => {
      prisma.transcripts.create.mockResolvedValue(transcricaoFake);

      await repository.create(transcricaoFake as never);

      const palavras = JSON.parse((prisma.transcripts.create.mock.calls[0][0].data as { words: string }).words);
      expect(palavras[0]).toEqual(
        expect.objectContaining({ i: 0, w: 'olá', s: 0, e: 320, sp: 1, f: null }),
      );
    });

    it('deve propagar o erro quando o Prisma falhar ao criar', async () => {
      const erro = new Error('Erro de conexão com o banco');
      prisma.transcripts.create.mockRejectedValue(erro);

      await expect(repository.create(transcricaoFake as never)).rejects.toThrow(erro);
    });
  });

  describe('findByProjectId', () => {
    it('deve buscar a transcrição pelo id do projeto e devolver o registro encontrado', async () => {
      prisma.transcripts.findUnique.mockResolvedValue(transcricaoFake);

      const resultado = await repository.findByProjectId(transcricaoFake.project_id);

      expect(prisma.transcripts.findUnique).toHaveBeenCalledWith({
        where: { project_id: transcricaoFake.project_id },
      });
      expect(resultado).toEqual(transcricaoFake);
    });

    it('deve devolver null quando não encontrar transcrição para o projeto informado', async () => {
      prisma.transcripts.findUnique.mockResolvedValue(null);

      const resultado = await repository.findByProjectId('uuid-inexistente');

      expect(resultado).toBeNull();
    });

    it('deve propagar o erro quando o Prisma falhar ao buscar', async () => {
      const erro = new Error('Erro de conexão com o banco');
      prisma.transcripts.findUnique.mockRejectedValue(erro);

      await expect(repository.findByProjectId(transcricaoFake.project_id)).rejects.toThrow(erro);
    });
  });

  describe('update', () => {
    it('deve atualizar a transcrição pelo id do projeto e devolver o registro atualizado', async () => {
      const dadosAtualizados = { sentences: JSON.stringify([{ i: 0, start: 0, end: 500, text: 'olá mundo' }]) };
      const transcricaoAtualizada = { ...transcricaoFake, ...dadosAtualizados };
      prisma.transcripts.update.mockResolvedValue(transcricaoAtualizada);

      const resultado = await repository.update(transcricaoFake.project_id, dadosAtualizados as never);

      expect(prisma.transcripts.update).toHaveBeenCalledWith({
        where: { project_id: transcricaoFake.project_id },
        data: dadosAtualizados,
      });
      expect(resultado).toEqual(transcricaoAtualizada);
    });

    it('deve propagar o erro quando tentar atualizar uma transcrição que não existe', async () => {
      const erro = new Error('Registro não encontrado');
      prisma.transcripts.update.mockRejectedValue(erro);

      await expect(repository.update('uuid-inexistente', {} as never)).rejects.toThrow(erro);
    });
  });

  describe('delete', () => {
    it('deve apagar a transcrição pelo id do projeto e devolver o registro apagado', async () => {
      prisma.transcripts.delete.mockResolvedValue(transcricaoFake);

      const resultado = await repository.delete(transcricaoFake.project_id);

      expect(prisma.transcripts.delete).toHaveBeenCalledWith({
        where: { project_id: transcricaoFake.project_id },
      });
      expect(resultado).toEqual(transcricaoFake);
    });

    it('deve propagar o erro quando tentar apagar uma transcrição que não existe', async () => {
      const erro = new Error('Registro não encontrado');
      prisma.transcripts.delete.mockRejectedValue(erro);

      await expect(repository.delete('uuid-inexistente')).rejects.toThrow(erro);
    });
  });
});
