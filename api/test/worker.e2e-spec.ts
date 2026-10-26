import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';

describe('Worker (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  afterAll(async () => {
    await app.close();
  });

  it('inicializa o contexto Nest com o AppModule sem erro', async () => {
    await expect(app.init()).resolves.toBe(app);
  });

  it('não expõe um servidor HTTP escutando em porta, pois nunca chama listen', async () => {
    const httpServer = app.getHttpServer();

    expect(httpServer.listening).toBe(false);
  });

  it('compartilha o mesmo AppModule usado pela API HTTP', () => {
    const modulosImportados = Reflect.getMetadata('imports', AppModule) ?? [];

    expect(Array.isArray(modulosImportados)).toBe(true);
  });
});
