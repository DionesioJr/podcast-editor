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
    jobs: { update: jest.Mock };
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
      jobs: { update: jest.fn() },
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
  });
});
