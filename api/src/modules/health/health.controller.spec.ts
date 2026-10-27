import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { statfs } from 'fs/promises';

import { PrismaService } from '@/shared/prisma/prisma.service';
import { HealthController } from './health.controller';

jest.mock('fs/promises', () => ({
  statfs: jest.fn(),
}));

const statfsMock = statfs as jest.Mock;

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]) };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'DATA_DIR') return '/data';
        if (key === 'MIN_FREE_DISK_GB') return 5;
        return undefined;
      }),
    };

    statfsMock.mockResolvedValue({
      bavail: 10 * 1024 * 1024,
      bsize: 1024,
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devolve status healthy quando banco e disco estão ok', async () => {
    const resultado = await controller.check();

    expect(resultado.status).toBe('healthy');
    expect(resultado.database).toEqual({ status: 'ok' });
    expect(resultado.disk.status).toBe('ok');
    expect(resultado.disk.freeGb).toBe(10);
  });

  it('devolve o campo timestamp como data ISO válida', async () => {
    const resultado = await controller.check();

    expect(new Date(resultado.timestamp).toISOString()).toBe(resultado.timestamp);
  });

  it('lança HttpException 503 quando o banco falha', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('conexão recusada'));

    try {
      await controller.check();
      throw new Error('deveria ter lançado HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      const resposta = (error as HttpException).getResponse() as any;
      expect(resposta.status).toBe('degraded');
      expect(resposta.database).toEqual({ status: 'error', message: 'conexão recusada' });
    }
  });

  it('lança HttpException 503 quando o disco está com erro de leitura', async () => {
    statfsMock.mockRejectedValue(new Error('falha ao ler disco'));

    try {
      await controller.check();
      throw new Error('deveria ter lançado HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      const resposta = (error as HttpException).getResponse() as any;
      expect(resposta.disk).toEqual({ status: 'error', message: 'falha ao ler disco' });
    }
  });

  it('lança HttpException 503 quando o espaço livre é menor que o mínimo configurado', async () => {
    statfsMock.mockResolvedValue({
      bavail: 2 * 1024 * 1024,
      bsize: 1024,
    });

    try {
      await controller.check();
      throw new Error('deveria ter lançado HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const resposta = (error as HttpException).getResponse() as any;
      expect(resposta.disk.status).toBe('error');
      expect(resposta.disk.freeGb).toBe(2);
      expect(resposta.disk.message).toMatch(/espaço livre insuficiente/i);
    }
  });

  it('usa /data como diretório padrão quando DATA_DIR não está configurado', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'MIN_FREE_DISK_GB') return 5;
      return undefined;
    });

    await controller.check();

    expect(statfsMock).toHaveBeenCalledWith('/data');
  });
});
