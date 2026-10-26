import {
  ArgumentsHost,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { HttpExceptionFilter } from './http-exception.filter';

function criarHostFalso() {
  const resposta = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const host = {
    switchToHttp: () => ({
      getResponse: () => resposta,
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  return { host, resposta };
}

describe('HttpExceptionFilter', () => {
  let filtro: HttpExceptionFilter;

  beforeEach(() => {
    filtro = new HttpExceptionFilter();
  });

  it('devolve statusCode, code e message quando a exceção já define code', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new UnprocessableEntityException('Dado inválido');
    (exception as any).response = {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Dado inválido',
    };

    filtro.catch(exception, host);

    expect(resposta.status).toHaveBeenCalledWith(422);
    expect(resposta.json).toHaveBeenCalledWith({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Dado inválido',
    });
  });

  it('deriva o code VALIDATION_ERROR para status 400 quando a exceção não define code', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new HttpException('Requisição inválida', HttpStatus.BAD_REQUEST);

    filtro.catch(exception, host);

    expect(resposta.json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Requisição inválida',
    });
  });

  it('deriva o code NOT_FOUND para status 404', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new NotFoundException('Recurso não encontrado');

    filtro.catch(exception, host);

    expect(resposta.json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Recurso não encontrado',
    });
  });

  it('deriva o code UNAUTHORIZED para status 401', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new UnauthorizedException('Não autenticado');

    filtro.catch(exception, host);

    expect(resposta.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' }),
    );
  });

  it('deriva o code FORBIDDEN para status 403', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new ForbiddenException('Sem permissão');

    filtro.catch(exception, host);

    expect(resposta.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, code: 'FORBIDDEN' }),
    );
  });

  it('deriva o code CONFLICT para status 409', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new ConflictException('Conflito de estado');

    filtro.catch(exception, host);

    expect(resposta.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, code: 'CONFLICT' }),
    );
  });

  it('deriva o code RATE_LIMIT_EXCEEDED para status 429', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new HttpException('Muitas requisições', HttpStatus.TOO_MANY_REQUESTS);

    filtro.catch(exception, host);

    expect(resposta.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 429, code: 'RATE_LIMIT_EXCEEDED' }),
    );
  });

  it('deriva o code INTERNAL_ERROR para status 500', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new InternalServerErrorException('Erro interno');

    filtro.catch(exception, host);

    expect(resposta.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, code: 'INTERNAL_ERROR' }),
    );
  });

  it('usa a mensagem de texto quando a exceção devolve uma string simples', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new HttpException('Mensagem simples', HttpStatus.BAD_REQUEST);

    filtro.catch(exception, host);

    const corpo = resposta.json.mock.calls[0][0];
    expect(corpo.message).toBe('Mensagem simples');
  });

  it('nunca devolve corpo com chaves diferentes de statusCode, code e message', () => {
    const { host, resposta } = criarHostFalso();
    const exception = new ForbiddenException('Sem permissão');

    filtro.catch(exception, host);

    const corpo = resposta.json.mock.calls[0][0];
    expect(Object.keys(corpo).sort()).toEqual(['code', 'message', 'statusCode']);
  });
});
