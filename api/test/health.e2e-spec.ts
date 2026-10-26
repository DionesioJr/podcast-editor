import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health devolve 200 com status ok', async () => {
    const resposta = await request(app.getHttpServer()).get('/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok' });
  });

  it('GET /health devolve corpo em JSON', async () => {
    const resposta = await request(app.getHttpServer()).get('/health');

    expect(resposta.headers['content-type']).toMatch(/json/);
  });

  it('POST /health não é um método suportado e devolve 404', async () => {
    const resposta = await request(app.getHttpServer()).post('/health');

    expect(resposta.status).toBe(404);
  });

  it('GET /rota-inexistente devolve 404', async () => {
    const resposta = await request(app.getHttpServer()).get('/rota-inexistente');

    expect(resposta.status).toBe(404);
  });

  it('GET /Health com letra maiúscula não casa com a rota e devolve 404', async () => {
    const resposta = await request(app.getHttpServer()).get('/Health');

    expect(resposta.status).toBe(404);
  });

  it('GET /health/ com barra final ainda casa com a rota', async () => {
    const resposta = await request(app.getHttpServer()).get('/health/');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok' });
  });
});
