import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

async function criarAppComoProducao(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Podcast Editor API')
    .setDescription('Documentação da API do Podcast Editor')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.getHttpServer().get('/docs-json', (req: Request, res: Response) => {
    res.json(document);
  });

  app.setGlobalPrefix('v1', {
    exclude: ['/health', '/docs', '/docs-json'],
  });

  await app.init();

  return app;
}

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL ??= 'mysql://user:pass@localhost:3306/podcast';
    process.env.FILE_URL_SECRET ??= 'segredo-de-teste';
    process.env.OPENAI_API_KEY ??= 'sk-teste';
    process.env.OPENAI_TRANSCRIBE_MODEL ??= 'whisper-1';
    process.env.OPENAI_DIARIZE_MODEL ??= 'diarize-1';
    process.env.OPENAI_LLM_MODEL ??= 'gpt-4o-mini';
    process.env.MIN_FREE_DISK_GB ??= '5';
    process.env.EXPORT_CONCURRENCY ??= '2';

    app = await criarAppComoProducao();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health devolve 503 quando o banco não está disponível e descreve banco e disco', async () => {
    const resposta = await request(app.getHttpServer()).get('/health');

    expect(resposta.status).toBe(503);
    expect(resposta.body).toHaveProperty('status', 'degraded');
    expect(resposta.body).toHaveProperty('database');
    expect(resposta.body).toHaveProperty('disk');
    expect(resposta.body).toHaveProperty('timestamp');
    expect(resposta.body.database.status).toBe('error');
  });

  it('GET /health não recebe o prefixo /v1', async () => {
    const comPrefixo = await request(app.getHttpServer()).get('/v1/health');

    expect(comPrefixo.status).toBe(404);
  });

  it('GET /docs mostra a UI do Swagger', async () => {
    const resposta = await request(app.getHttpServer()).get('/docs');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/html/);
  });

  it('GET /docs-json devolve o documento OpenAPI', async () => {
    const resposta = await request(app.getHttpServer()).get('/docs-json');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveProperty('openapi');
    expect(resposta.body).toHaveProperty('paths');
    expect(resposta.body.info).toHaveProperty('title', 'Podcast Editor API');
  });

  it('GET /docs-json não recebe o prefixo /v1', async () => {
    const comPrefixo = await request(app.getHttpServer()).get('/v1/docs-json');

    expect(comPrefixo.status).toBe(404);
  });

  it('GET /rota-inexistente sem prefixo devolve 404', async () => {
    const resposta = await request(app.getHttpServer()).get('/rota-inexistente');

    expect(resposta.status).toBe(404);
  });
});
