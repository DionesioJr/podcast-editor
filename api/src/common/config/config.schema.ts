import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  validateSync,
  IsOptional,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  DATA_DIR: string = '/data';

  @IsString()
  FILE_URL_SECRET: string;

  @IsString()
  OPENAI_API_KEY: string;

  @IsString()
  OPENAI_TRANSCRIBE_MODEL: string;

  @IsString()
  OPENAI_DIARIZE_MODEL: string;

  @IsString()
  OPENAI_LLM_MODEL: string;

  @IsNumber()
  MIN_FREE_DISK_GB: number;

  @IsNumber()
  EXPORT_CONCURRENCY: number;

  @IsNumber()
  @IsOptional()
  LIMIT_MAX_SIZE_BYTES: number = 2147483648;

  @IsNumber()
  @IsOptional()
  LIMIT_MAX_DURATION_MS: number = 7200000;

  @IsNumber()
  @IsOptional()
  LIMIT_RETENTION_HOURS: number = 24;

  @IsNumber()
  @IsOptional()
  LIMIT_EXPORTS: number = 10;

  @IsNumber()
  @IsOptional()
  LIMIT_AI_ANALYSES: number = 5;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT: number = 50;

  @IsNumber()
  @IsOptional()
  THROTTLE_TTL: number = 60000;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missingVars = errors
      .map((err) => `${err.property} (${err.constraints ? Object.values(err.constraints).join(', ') : 'obrigatória'})`)
      .join(', ');
    throw new Error(
      `Configuração inválida. Variáveis de ambiente obrigatórias faltando ou inválidas: ${missingVars}`,
    );
  }

  return validatedConfig;
}
