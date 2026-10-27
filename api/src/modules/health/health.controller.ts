import { Controller, Get, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { statfs } from 'fs/promises';

import { PrismaService } from '@/shared/prisma/prisma.service';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: { status: 'ok' | 'error'; message?: string };
  disk: { status: 'ok' | 'error'; message?: string; freeGb?: number };
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verifica saúde da API, banco e disco' })
  @ApiResponse({ status: 200, description: 'Todos os serviços estão ok' })
  @ApiResponse({ status: 503, description: 'Banco ou disco com problemas' })
  async check(): Promise<HealthResponse> {
    const dbCheck = await this.checkDatabase();
    const diskCheck = await this.checkDisk();

    const isHealthy = dbCheck.status === 'ok' && diskCheck.status === 'ok';
    const status = isHealthy ? 'healthy' : 'degraded';

    const response: HealthResponse = {
      status,
      database: dbCheck,
      disk: diskCheck,
      timestamp: new Date().toISOString(),
    };

    if (!isHealthy) {
      throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return response;
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    message?: string;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database health check failed: ${message}`);
      return { status: 'error', message };
    }
  }

  private async checkDisk(): Promise<{
    status: 'ok' | 'error';
    message?: string;
    freeGb?: number;
  }> {
    try {
      const dataDir = this.config.get<string>('DATA_DIR') || '/data';
      const minFreeGb = this.config.get<number>('MIN_FREE_DISK_GB') ?? 0;

      const stats = await statfs(dataDir);
      const freeGb = Math.floor((stats.bavail * stats.bsize) / (1024 ** 3));

      if (freeGb < minFreeGb) {
        return {
          status: 'error',
          message: `Espaço livre insuficiente: ${freeGb}GB < ${minFreeGb}GB`,
          freeGb,
        };
      }

      return { status: 'ok', freeGb };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Disk health check failed: ${message}`);
      return { status: 'error', message };
    }
  }
}
