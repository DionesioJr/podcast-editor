import { BASE_URL } from '@src/config/api';
import { ApiError } from './api-error';
import { httpClient } from './http-client';

const fetchMock = jest.fn();

interface FakeResponseInit {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}

function fakeResponse(init: FakeResponseInit): Response {
  return {
    ok: init.ok,
    status: init.status,
    json: init.json ?? (() => Promise.reject(new Error('corpo sem JSON'))),
    text: init.text ?? (() => Promise.resolve('')),
  } as unknown as Response;
}

function lastFetchCall(): [string, RequestInit] {
  return fetchMock.mock.calls[0] as [string, RequestInit];
}

async function captureThrown(action: () => Promise<unknown>): Promise<unknown> {
  try {
    await action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe('httpClient (PDE-9)', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('faz GET na URL da API e devolve o corpo JSON', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"id":"p1"}'),
      }),
    );

    const data = await httpClient.get<{ id: string }>('/v1/projects/p1');
    const [url, init] = lastFetchCall();

    expect(url).toBe(new URL('/v1/projects/p1', BASE_URL).toString());
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>).Accept).toBe(
      'application/json',
    );
    expect(data).toEqual({ id: 'p1' });
  });

  it('faz POST com corpo JSON e Content-Type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ ok: true, status: 204 }));

    await httpClient.post('/v1/projects', { name: 'aula' });
    const [, init] = lastFetchCall();

    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
    expect(init.body).toBe('{"name":"aula"}');
  });

  it('faz PUT com corpo JSON e Content-Type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ ok: true, status: 204 }));

    await httpClient.put('/v1/projects/p1', { title: 'novo' });
    const [, init] = lastFetchCall();

    expect(init.method).toBe('PUT');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
    expect(init.body).toBe('{"title":"novo"}');
  });

  it('faz PATCH com corpo JSON e Content-Type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ ok: true, status: 204 }));

    await httpClient.patch('/v1/projects/p1', { title: 'novo' });
    const [, init] = lastFetchCall();

    expect(init.method).toBe('PATCH');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json',
    );
    expect(init.body).toBe('{"title":"novo"}');
  });

  it('faz DELETE sem corpo e sem Content-Type', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ ok: true, status: 204 }));

    await httpClient.delete('/v1/projects/p1');
    const [, init] = lastFetchCall();

    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
    expect(
      (init.headers as Record<string, string>)['Content-Type'],
    ).toBeUndefined();
  });

  it('mescla os headers informados nas opções com os cabeçalhos padrão', async () => {
    fetchMock.mockResolvedValue(fakeResponse({ ok: true, status: 204 }));

    await httpClient.get('/v1/projects', {
      headers: { Authorization: 'Bearer token' },
    });
    const [, init] = lastFetchCall();

    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer token',
    );
    expect((init.headers as Record<string, string>).Accept).toBe(
      'application/json',
    );
  });

  it('traduz o code conhecido da API para a mensagem em português', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 413,
        json: () => Promise.resolve({ code: 'FILE_TOO_LARGE' }),
      }),
    );

    const captured = await captureThrown(() => httpClient.get('/v1/projects'));

    expect(captured).toBeInstanceOf(ApiError);
    expect(captured).toMatchObject({
      code: 'FILE_TOO_LARGE',
      statusCode: 413,
      message: 'Esse vídeo tem X GB. O limite é 2 GB.',
    });
  });

  it('traduz o code desconhecido da API para a mensagem genérica', async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ code: 'CODE_NOVO' }),
      }),
    );

    const captured = await captureThrown(() => httpClient.get('/v1/projects'));

    expect(captured).toMatchObject({
      code: 'CODE_NOVO',
      message: 'Erro desconhecido.',
    });
  });

  it('transforma falha de conexão em ApiError NETWORK_ERROR em português', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const captured = await captureThrown(() => httpClient.get('/v1/projects'));

    expect(captured).toBeInstanceOf(ApiError);
    expect(captured).toMatchObject({
      code: 'NETWORK_ERROR',
      statusCode: 0,
      message: 'Erro de conexão. Verifique sua internet.',
    });
  });

  it('recusa endpoint com outra origem sem chamar o fetch', async () => {
    const captured = await captureThrown(() =>
      httpClient.get('https://evil.example.com/dados'),
    );

    expect(captured).toMatchObject({ code: 'SERVER_ERROR', statusCode: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('transforma o esgotamento do tempo limite em ApiError TIMEOUT', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new Error('requisição abortada')),
          );
        }),
    );

    const promise = httpClient.get('/v1/projects', { timeoutMs: 1000 });
    jest.advanceTimersByTime(1000);

    const captured = await captureThrown(() => promise);

    expect(captured).toMatchObject({
      code: 'TIMEOUT',
      statusCode: 0,
      message: 'Tempo limite excedido. Tente novamente.',
    });
  });
});
