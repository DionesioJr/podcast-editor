import {
  Body,
  Controller,
  INestApplication,
  Module,
  Post,
  UnprocessableEntityException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IsInt, IsString, Min } from 'class-validator';
import request from 'supertest';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { translateConstraints } from '../src/common/validation/translate-constraints';

class CriarExemploDto {
  @IsString()
  nome: string;

  @IsInt()
  @Min(1)
  quantidade: number;
}

@Controller('exemplo-validacao')
class ExemploValidacaoController {
  @Post()
  criar(@Body() dto: CriarExemploDto) {
    return dto;
  }
}

@Module({
  controllers: [ExemploValidacaoController],
})
class ExemploValidacaoModule {}

describe('Validação global (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ExemploValidacaoModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new NestValidationPipe({
        transform: true,
        forbidNonWhitelisted: true,
        whitelist: true,
        exceptionFactory: (errors: any[]) => {
          const message = errors
            .flatMap((err) => {
              const field = err.property;
              const constraints = translateConstraints(err.constraints || {});
              return constraints.map((c) => `${field} ${c}`);
            })
            .join('; ');

          const exception = new UnprocessableEntityException(message);
          (exception as any).response = {
            statusCode: 422,
            code: 'VALIDATION_ERROR',
            message,
          };
          return exception;
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devolve 422 quando um campo obrigatório está ausente', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/exemplo-validacao')
      .send({ quantidade: 5 });

    expect(resposta.status).toBe(422);
    expect(resposta.body.message).toMatch(/deve|não pode|estar/);
  });

  it('devolve o corpo no formato { statusCode, code, message }', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/exemplo-validacao')
      .send({});

    expect(resposta.body).toEqual({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: expect.any(String),
    });
    expect(resposta.body.message).toMatch(/deve|não pode|estar/);
  });

  it('bloqueia campo extra não declarado no DTO', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/exemplo-validacao')
      .send({ nome: 'teste', quantidade: 1, campoExtra: 'não existe' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.message).toMatch(/propriedade não permitida|campoExtra/);
  });

  it('devolve 422 quando quantidade é menor que o mínimo permitido', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/exemplo-validacao')
      .send({ nome: 'teste', quantidade: 0 });

    expect(resposta.status).toBe(422);
    expect(resposta.body.message).toMatch(/deve ser maior ou igual|deve/);
  });

  it('devolve 422 quando quantidade não é um número inteiro', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/exemplo-validacao')
      .send({ nome: 'teste', quantidade: 'não é número' });

    expect(resposta.status).toBe(422);
    expect(resposta.body.message).toMatch(/deve ser um número|deve/);
  });

  it('aceita corpo válido e devolve 201', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/exemplo-validacao')
      .send({ nome: 'teste', quantidade: 1 });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toEqual({ nome: 'teste', quantidade: 1 });
  });
});
