import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

import { createValidationPipe } from './create-validation-pipe';

class ExemploDto {
  @IsString()
  nome: string;

  @IsInt()
  @Min(1)
  quantidade: number;
}

class ExemploConstraintDesconhecidaDto {
  @IsUUID('4', { message: 'identificador inválido' })
  id: string;
}

interface CorpoDeErro {
  statusCode: number;
  code: string;
  message: string;
}

async function respostaDeValidacao(
  metatype: new () => object,
  valor: unknown,
): Promise<CorpoDeErro> {
  const pipe = createValidationPipe();

  try {
    await pipe.transform(valor, { type: 'body', metatype });
  } catch (erro) {
    if (erro instanceof UnprocessableEntityException) {
      return erro.getResponse() as CorpoDeErro;
    }
    throw erro;
  }

  throw new Error('o corpo foi aceito, mas deveria ter falhado na validação');
}

describe('createValidationPipe', () => {
  it('devolve uma instância de ValidationPipe', () => {
    expect(createValidationPipe()).toBeInstanceOf(ValidationPipe);
  });

  it('devolve uma instância nova a cada chamada', () => {
    expect(createValidationPipe()).not.toBe(createValidationPipe());
  });

  it('transforma e aceita um corpo válido', async () => {
    const resultado = await createValidationPipe().transform(
      { nome: 'entrevista', quantidade: 2 },
      { type: 'body', metatype: ExemploDto },
    );

    expect(resultado).toBeInstanceOf(ExemploDto);
    expect(resultado).toEqual(
      expect.objectContaining({ nome: 'entrevista', quantidade: 2 }),
    );
  });

  it('devolve 422 com o corpo { statusCode, code, message } quando falta campo obrigatório', async () => {
    const corpo = await respostaDeValidacao(ExemploDto, { quantidade: 2 });

    expect(corpo).toEqual({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: expect.any(String),
    });
    expect(corpo.message).toContain('nome');
  });

  it('junta vários erros de validação com ponto e vírgula e espaço', async () => {
    const corpo = await respostaDeValidacao(ExemploDto, {});

    expect(corpo.message).toContain('nome');
    expect(corpo.message).toContain('quantidade');
    expect(corpo.message).toContain('; ');
  });

  it('traduz constraints camelCase para português na mensagem final', async () => {
    const corpo = await respostaDeValidacao(ExemploDto, { quantidade: 2 });

    expect(corpo.message).toContain('nome deve ser uma string');
  });

  it('devolve 422 quando quantidade fica abaixo do mínimo', async () => {
    const corpo = await respostaDeValidacao(ExemploDto, {
      nome: 'entrevista',
      quantidade: 0,
    });

    expect(corpo.message).toContain('quantidade deve ser maior ou igual a');
  });

  it('bloqueia propriedade não declarada no DTO', async () => {
    const corpo = await respostaDeValidacao(ExemploDto, {
      nome: 'entrevista',
      quantidade: 1,
      campoExtra: 'não existe',
    });

    expect(corpo.message).toContain('campoExtra');
  });

  it('usa a mensagem original quando a constraint não tem tradução', async () => {
    const corpo = await respostaDeValidacao(ExemploConstraintDesconhecidaDto, {
      id: 'não é uuid',
    });

    expect(corpo.message).toContain('identificador inválido');
  });
});
