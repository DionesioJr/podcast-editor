import { httpClient } from './http-client';
import { ApiError } from './api-error';
import { BASE_URL } from '@src/config/api';

describe('httpClient (PDE-9)', () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it('retorna os dados quando a resposta é bem sucedida', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1' }),
    }) as unknown as typeof fetch;

    const resultado = await httpClient.get<{ id: string }>('/projetos/1');

    expect(resultado).toEqual({ id: '1' });
  });

  it('traduz o code da resposta de erro para uma mensagem em português', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ code: 'PROJECT_NOT_FOUND' }),
    }) as unknown as typeof fetch;

    await expect(httpClient.get('/projetos/1')).rejects.toMatchObject({
      message: 'Projeto não encontrado.',
      code: 'PROJECT_NOT_FOUND',
      statusCode: 404,
    });
  });

  it('cai na mensagem genérica quando a resposta de erro não traz code', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(httpClient.get('/projetos/1')).rejects.toMatchObject({
      message: 'Erro no servidor. Tente novamente mais tarde.',
      code: 'SERVER_ERROR',
    });
  });

  it('traduz erro de rede quando o fetch falha', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;

    await expect(httpClient.get('/projetos/1')).rejects.toMatchObject({
      message: 'Erro de conexão. Verifique sua internet.',
      code: 'NETWORK_ERROR',
    });
  });

  it('traduz erro de timeout quando a requisição é abortada', async () => {
    const erroAbort = new Error('Aborted');
    erroAbort.name = 'AbortError';

    global.fetch = jest.fn().mockRejectedValue(erroAbort) as unknown as typeof fetch;

    await expect(httpClient.get('/projetos/1')).rejects.toMatchObject({
      message: 'Tempo limite excedido. Tente novamente.',
      code: 'TIMEOUT',
    });
  });

  it('repassa um ApiError já lançado sem transformar de novo', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ code: 'INVALID_TOKEN' }),
    }) as unknown as typeof fetch;

    try {
      await httpClient.get('/projetos/1');
      fail('deveria ter lançado um erro');
    } catch (erro) {
      expect(erro).toBeInstanceOf(ApiError);
      expect((erro as ApiError).code).toBe('INVALID_TOKEN');
    }
  });

  it('envia o corpo como JSON e o header Content-Type no post', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await httpClient.post('/projetos', { nome: 'Episódio 1' });

    const [, opcoes] = fetchMock.mock.calls[0];
    expect(opcoes.method).toBe('POST');
    expect(opcoes.body).toBe(JSON.stringify({ nome: 'Episódio 1' }));
    expect(opcoes.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('não envia corpo no post quando nenhum body é informado', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await httpClient.post('/projetos');

    const [, opcoes] = fetchMock.mock.calls[0];
    expect(opcoes.body).toBeUndefined();
  });

  it('rejeita endpoint que aponta para um origin diferente do BASE_URL', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      httpClient.get('https://outro-dominio.com/admin')
    ).rejects.toMatchObject({
      message: 'Erro no servidor. Tente novamente mais tarde.',
      code: 'SERVER_ERROR',
      statusCode: 400,
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normaliza path traversal e mantém o mesmo origin do BASE_URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await httpClient.get('/../admin');

    const [urlChamada] = fetchMock.mock.calls[0];
    expect(new URL(String(urlChamada)).origin).toBe(new URL(BASE_URL).origin);
  });

  it('usa o método DELETE sem corpo', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await httpClient.delete('/projetos/1');

    const [, opcoes] = fetchMock.mock.calls[0];
    expect(opcoes.method).toBe('DELETE');
  });
});
