import { JobType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/shared/prisma/prisma.service';

import { JobsRepository } from './jobs.repository';

type TransacaoFalsa = {
  $queryRaw: jest.Mock;
  jobs: { update: jest.Mock };
};

describe('JobsRepository', () => {
  let repository: JobsRepository;
  let transacao: TransacaoFalsa;
  let prisma: {
    $transaction: jest.Mock;
    jobs: { update: jest.Mock; updateMany: jest.Mock };
  };

  const jobReservado = {
    id: 7,
    project_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    job_type: 'process',
    status: 'running',
    payload: null,
    progress: 0,
    step: null,
    attempts: 0,
    error_code: null,
    locked_at: new Date('2026-10-31T12:00:00.000Z'),
    created_at: new Date('2026-10-31T11:00:00.000Z'),
  };

  beforeEach(async () => {
    transacao = {
      $queryRaw: jest.fn(),
      jobs: { update: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback: (tx: TransacaoFalsa) => unknown) => callback(transacao)),
      jobs: { update: jest.fn(), updateMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<JobsRepository>(JobsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('claimNextQueuedJob', () => {
    it('reserva o primeiro job queued e o marca como running dentro da transação', async () => {
      transacao.$queryRaw.mockResolvedValue([{ id: jobReservado.id }]);
      transacao.jobs.update.mockResolvedValue(jobReservado);

      const resultado = await repository.claimNextQueuedJob();

      expect(resultado).toEqual(jobReservado);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(transacao.jobs.update).toHaveBeenCalledTimes(1);
      expect(transacao.jobs.update).toHaveBeenCalledWith({
        where: { id: jobReservado.id },
        data: { status: 'running', locked_at: expect.any(Date) },
      });
    });

    it('devolve null quando a fila não tem job queued, sem atualizar nada', async () => {
      transacao.$queryRaw.mockResolvedValue([]);

      const resultado = await repository.claimNextQueuedJob();

      expect(resultado).toBeNull();
      expect(transacao.jobs.update).not.toHaveBeenCalled();
    });

    it('seleciona só o primeiro job queued com FOR UPDATE SKIP LOCKED', async () => {
      transacao.$queryRaw.mockResolvedValue([{ id: 1 }]);
      transacao.jobs.update.mockResolvedValue(jobReservado);

      await repository.claimNextQueuedJob();

      const [textos, ...valores] = transacao.$queryRaw.mock.calls[0];
      const sql = (textos as string[]).join(' ');

      expect(sql).toMatch(/FROM jobs/i);
      expect(sql).toMatch(/ORDER BY id/i);
      expect(sql).toMatch(/LIMIT 1/i);
      expect(sql).toMatch(/FOR UPDATE SKIP LOCKED/i);
      expect(valores).toContain('queued');
    });

    it('atualiza a linha pela transação, nunca pelo cliente Prisma de fora do lock', async () => {
      transacao.$queryRaw.mockResolvedValue([{ id: jobReservado.id }]);
      transacao.jobs.update.mockResolvedValue(jobReservado);

      await repository.claimNextQueuedJob();

      expect(transacao.jobs.update).toHaveBeenCalledTimes(1);
      expect(prisma.jobs.update).not.toHaveBeenCalled();
    });

    it('dois workers em sequência nunca recebem o mesmo job', async () => {
      const fila: Array<{ id: number; status: string }> = [
        { id: 1, status: 'queued' },
        { id: 2, status: 'queued' },
      ];
      transacao.$queryRaw.mockImplementation((_textos: unknown, status: string) => {
        const proximo = fila
          .filter((job) => job.status === status)
          .sort((a, b) => a.id - b.id)[0];

        return Promise.resolve(proximo ? [{ id: proximo.id }] : []);
      });
      transacao.jobs.update.mockImplementation(
        (argumentos: { where: { id: number }; data: { status: string; locked_at: Date } }) => {
          const job = fila.find((candidato) => candidato.id === argumentos.where.id);

          if (!job) {
            return Promise.reject(new Error('job não encontrado'));
          }

          job.status = argumentos.data.status;

          return Promise.resolve({ ...job, ...argumentos.data });
        },
      );

      const primeiro = await repository.claimNextQueuedJob();
      const segundo = await repository.claimNextQueuedJob();

      expect(primeiro?.id).toBe(1);
      expect(segundo?.id).toBe(2);
      expect(primeiro?.id).not.toBe(segundo?.id);
      expect(transacao.jobs.update).toHaveBeenCalledTimes(2);
    });

    it('propaga o erro quando a transação falha, sem engolir a exceção', async () => {
      const erro = new Error('conexão com o banco perdida');
      prisma.$transaction.mockRejectedValue(erro);

      await expect(repository.claimNextQueuedJob()).rejects.toThrow(erro);
    });

    it('propaga o erro quando a atualização dentro da transação falha', async () => {
      transacao.$queryRaw.mockResolvedValue([{ id: jobReservado.id }]);
      const erro = new Error('falha ao atualizar o job');
      transacao.jobs.update.mockRejectedValue(erro);

      await expect(repository.claimNextQueuedJob()).rejects.toThrow(erro);
    });

    it('aplica no SQL o tipo mapeado para o valor do banco quando um tipo é informado', async () => {
      transacao.$queryRaw.mockResolvedValue([{ id: jobReservado.id }]);
      transacao.jobs.update.mockResolvedValue(jobReservado);

      await repository.claimNextQueuedJob(JobType.export_job);

      const filtro = transacao.$queryRaw.mock.calls[0][2] as {
        strings: string[];
        values: unknown[];
      };

      expect(filtro.strings.join('')).toMatch(/AND type = /);
      expect(filtro.values).toEqual(['export']);
    });

    it('não filtra por tipo quando nenhum tipo é informado', async () => {
      transacao.$queryRaw.mockResolvedValue([{ id: jobReservado.id }]);
      transacao.jobs.update.mockResolvedValue(jobReservado);

      await repository.claimNextQueuedJob();

      const filtro = transacao.$queryRaw.mock.calls[0][2] as {
        strings: string[];
        values: unknown[];
      };

      expect(filtro.strings.join('')).not.toMatch(/AND type/);
      expect(filtro.values).toEqual([]);
    });
  });

  describe('requeueStaleRunningJobs', () => {
    type LinhaJob = { id: number; status: string; locked_at: Date | null };

    const montarLinha = (
      id: number,
      status: string,
      lockedAt: Date | null,
    ): LinhaJob => ({ id, status, locked_at: lockedAt });

    function casarWhere(
      linha: LinhaJob,
      where: { status?: string; OR?: Array<Record<string, unknown>> },
    ): boolean {
      if (where.status !== undefined && linha.status !== where.status) {
        return false;
      }
      if (!where.OR) {
        return true;
      }
      return where.OR.some((condicao) => {
        const locked = condicao.locked_at;
        if (locked === null) {
          return linha.locked_at === null;
        }
        const limite = (locked as { lt?: Date } | undefined)?.lt;
        return (
          limite instanceof Date &&
          linha.locked_at !== null &&
          linha.locked_at.getTime() < limite.getTime()
        );
      });
    }

    it('devolve à fila os running com locked_at anterior ao limite, direto no SQL', async () => {
      const staleBefore = new Date('2026-10-31T11:55:00.000Z');
      prisma.jobs.updateMany.mockResolvedValue({ count: 2 });

      const total = await repository.requeueStaleRunningJobs(staleBefore);

      expect(total).toBe(2);
      expect(prisma.jobs.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'running',
          OR: [{ locked_at: null }, { locked_at: { lt: staleBefore } }],
        },
        data: { status: 'queued', locked_at: null },
      });
    });

    it('mantém running o job com locked_at recente, só o antigo volta para a fila', async () => {
      const staleBefore = new Date('2026-10-31T11:55:00.000Z');
      const linhas = [
        montarLinha(1, 'running', new Date('2026-10-31T11:50:00.000Z')),
        montarLinha(2, 'running', new Date('2026-10-31T11:58:00.000Z')),
      ];
      prisma.jobs.updateMany.mockImplementation(
        (argumentos: {
          where: { status?: string; OR?: Array<Record<string, unknown>> };
          data: { status: string; locked_at: null };
        }) => {
          const afetadas = linhas.filter((linha) =>
            casarWhere(linha, argumentos.where),
          );
          for (const linha of afetadas) {
            linha.status = argumentos.data.status;
            linha.locked_at = argumentos.data.locked_at;
          }
          return Promise.resolve({ count: afetadas.length });
        },
      );

      const total = await repository.requeueStaleRunningJobs(staleBefore);

      expect(total).toBe(1);
      expect(linhas[0]).toEqual(montarLinha(1, 'queued', null));
      expect(linhas[1]).toEqual(
        montarLinha(2, 'running', new Date('2026-10-31T11:58:00.000Z')),
      );
    });
  });
});
