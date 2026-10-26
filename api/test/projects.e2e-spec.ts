import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('POST /v1/projects (e2e)', () => {
  let app: INestApplication;
  let repositoryMock: { create: jest.Mock };

  beforeAll(async () => {
    repositoryMock = {
      create: jest.fn().mockResolvedValue({}),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('IProjectsRepository')
      .useValue(repositoryMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria o projeto e devolve id, token e partSize', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4', sizeBytes: 524288000 });

    expect(resposta.status).toBe(201);
    expect(resposta.body.id).toBeDefined();
    expect(resposta.body.token).toBeDefined();
    expect(resposta.body.partSize).toBe(8388608);
  });

  it('o token devolvido tem 256 bits (64 caracteres hexadecimais)', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4', sizeBytes: 524288000 });

    expect(resposta.body.token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('nunca guarda o token em claro, apenas o hash, no repositório', async () => {
    await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4', sizeBytes: 524288000 });

    const dadosGravados = repositoryMock.create.mock.calls[repositoryMock.create.mock.calls.length - 1][0];

    expect(dadosGravados.token_hash).toBeDefined();
    expect(dadosGravados.token_hash).not.toContain(' ');
    expect(Object.keys(dadosGravados)).not.toContain('token');
  });

  it('a resposta não expõe token_hash nem ip_hash', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4', sizeBytes: 524288000 });

    expect(resposta.body.token_hash).toBeUndefined();
    expect(resposta.body.ip_hash).toBeUndefined();
  });

  it('rejeita sizeBytes igual a zero com 400', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4', sizeBytes: 0 });

    expect(resposta.status).toBe(400);
  });

  it('rejeita sizeBytes negativo com 400', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4', sizeBytes: -100 });

    expect(resposta.status).toBe(400);
  });

  it('rejeita sizeBytes acima de 2 GB com 400', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4', sizeBytes: 2147483649 });

    expect(resposta.status).toBe(400);
  });

  it('rejeita payload sem originalName com 400', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ sizeBytes: 524288000 });

    expect(resposta.status).toBe(400);
  });

  it('rejeita payload sem sizeBytes com 400', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ originalName: 'meu_podcast.mp4' });

    expect(resposta.status).toBe(400);
  });

  it('GET /v1/projects não é um método suportado e devolve 404', async () => {
    const resposta = await request(app.getHttpServer()).get('/v1/projects');

    expect(resposta.status).toBe(404);
  });
});
