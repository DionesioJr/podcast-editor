import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Throttler global (e2e)', () => {
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
    process.env.THROTTLE_LIMIT = '2';
    process.env.THROTTLE_TTL = '60000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('libera requisições dentro do limite configurado por ambiente', async () => {
    const primeira = await request(app.getHttpServer()).get('/health');
    const segunda = await request(app.getHttpServer()).get('/health');

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(200);
  });

  it('bloqueia com 429 ao exceder o limite configurado por IP', async () => {
    const resposta = await request(app.getHttpServer()).get('/health');

    expect(resposta.status).toBe(429);
  });

  it('devolve o corpo no formato { statusCode, code, message } ao bloquear por limite', async () => {
    const resposta = await request(app.getHttpServer()).get('/health');

    expect(resposta.status).toBe(429);
    expect(resposta.body).toHaveProperty('statusCode', 429);
    expect(resposta.body).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
    expect(resposta.body).toHaveProperty('message');
  });
});
