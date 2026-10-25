import { ApiError, handleApiError } from './api-error';

describe('ApiError (PDE-6)', () => {
  it('traduz um código conhecido para a mensagem em português', () => {
    const erro = new ApiError('PROJECT_NOT_FOUND');

    expect(erro.message).toBe('Projeto não encontrado.');
    expect(erro.code).toBe('PROJECT_NOT_FOUND');
    expect(erro.statusCode).toBe(500);
    expect(erro.name).toBe('ApiError');
  });

  it('usa o status informado quando não é o padrão', () => {
    const erro = new ApiError('INVALID_TOKEN', 401);

    expect(erro.statusCode).toBe(401);
  });

  it('cai na mensagem padrão quando o código é desconhecido', () => {
    const erro = new ApiError('CODIGO_INEXISTENTE');

    expect(erro.message).toBe('Erro desconhecido.');
  });
});

describe('handleApiError (PDE-6)', () => {
  it('repassa um ApiError sem alterar nada', () => {
    const original = new ApiError('UPLOAD_FAILED');

    expect(handleApiError(original)).toBe(original);
  });

  it('converte um Error nativo em ApiError usando a mensagem como código', () => {
    const erro = handleApiError(new Error('NETWORK_ERROR'));

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.code).toBe('NETWORK_ERROR');
    expect(erro.message).toBe('Erro de conexão. Verifique sua internet.');
    expect(erro.statusCode).toBe(500);
  });

  it('cai em SERVER_ERROR quando o valor lançado não é um Error', () => {
    const erro = handleApiError('qualquer coisa que não é Error');

    expect(erro.code).toBe('SERVER_ERROR');
    expect(erro.message).toBe('Erro no servidor. Tente novamente mais tarde.');
  });

  it('cai em SERVER_ERROR quando o valor lançado é undefined', () => {
    const erro = handleApiError(undefined);

    expect(erro.code).toBe('SERVER_ERROR');
  });
});
