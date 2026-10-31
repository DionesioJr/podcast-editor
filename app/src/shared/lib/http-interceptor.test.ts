import { BASE_URL } from '@src/config/api';
import { ApiError } from './api-error';
import {
  buildRequestUrl,
  extractErrorCode,
  interceptResponse,
} from './http-interceptor';

const GENERIC_MESSAGE = 'Erro desconhecido.';

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

async function captureThrown(action: () => Promise<unknown>): Promise<unknown> {
  try {
    await action();
    return undefined;
  } catch (error) {
    return error;
  }
}

describe('buildRequestUrl (PDE-9)', () => {
  it('resolve um endpoint relativo dentro da origem da API', () => {
    const url = new URL(buildRequestUrl('/v1/projects'));

    expect(url.origin).toBe(new URL(BASE_URL).origin);
    expect(url.pathname).toBe('/v1/projects');
  });

  it('normaliza o caminho sem deixar o endpoint escapar da origem da API', () => {
    const url = new URL(buildRequestUrl('/../admin'));

    expect(url.origin).toBe(new URL(BASE_URL).origin);
    expect(url.pathname).toBe('/admin');
  });

  it('recusa endpoint com outra origem lançando ApiError SERVER_ERROR 400', () => {
    let captured: unknown;

    try {
      buildRequestUrl('https://evil.example.com/roubar');
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(ApiError);
    expect(captured).toMatchObject({ code: 'SERVER_ERROR', statusCode: 400 });
  });

  it('recusa URL relativa ao protocolo que aponta para outra origem', () => {
    let captured: unknown;

    try {
      buildRequestUrl('//evil.example.com/roubar');
    } catch (error) {
      captured = error;
    }

    expect(captured).toMatchObject({
      code: 'SERVER_ERROR',
      statusCode: 400,
      message: 'Erro no servidor. Tente novamente mais tarde.',
    });
  });
});

describe('extractErrorCode (PDE-9)', () => {
  it('devolve o code informado no corpo', async () => {
    const code = await extractErrorCode(
      fakeResponse({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ code: 'VIDEO_TOO_LARGE' }),
      }),
    );

    expect(code).toBe('VIDEO_TOO_LARGE');
  });

  it('usa SERVER_ERROR quando o corpo não tem code', async () => {
    const code = await extractErrorCode(
      fakeResponse({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    );

    expect(code).toBe('SERVER_ERROR');
  });

  it('usa SERVER_ERROR quando o code é vazio ou só espaços', async () => {
    const code = await extractErrorCode(
      fakeResponse({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ code: '   ' }),
      }),
    );

    expect(code).toBe('SERVER_ERROR');
  });

  it('usa SERVER_ERROR quando o code não é texto', async () => {
    const code = await extractErrorCode(
      fakeResponse({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ code: 123 }),
      }),
    );

    expect(code).toBe('SERVER_ERROR');
  });

  it('usa SERVER_ERROR quando o corpo não é JSON', async () => {
    const code = await extractErrorCode(
      fakeResponse({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('não é JSON')),
      }),
    );

    expect(code).toBe('SERVER_ERROR');
  });
});

describe('interceptResponse (PDE-9)', () => {
  it('devolve o corpo JSON quando a resposta é bem-sucedida', async () => {
    const data = await interceptResponse<{ id: string }>(
      fakeResponse({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"id":"p1"}'),
      }),
    );

    expect(data).toEqual({ id: 'p1' });
  });

  it('devolve undefined em uma resposta 204 sem corpo', async () => {
    const data = await interceptResponse(
      fakeResponse({ ok: true, status: 204 }),
    );

    expect(data).toBeUndefined();
  });

  it('devolve undefined quando a resposta de sucesso vem sem corpo', async () => {
    const data = await interceptResponse(
      fakeResponse({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
      }),
    );

    expect(data).toBeUndefined();
  });

  it('lança SERVER_ERROR quando o corpo de sucesso não é JSON válido', async () => {
    const captured = await captureThrown(() =>
      interceptResponse(
        fakeResponse({
          ok: true,
          status: 200,
          text: () => Promise.resolve('texto solto'),
        }),
      ),
    );

    expect(captured).toMatchObject({ code: 'SERVER_ERROR', statusCode: 200 });
  });

  it('lança ApiError com a mensagem em português quando o code é conhecido', async () => {
    const captured = await captureThrown(() =>
      interceptResponse(
        fakeResponse({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ code: 'PROJECT_NOT_FOUND' }),
        }),
      ),
    );

    expect(captured).toBeInstanceOf(ApiError);
    expect(captured).toMatchObject({
      code: 'PROJECT_NOT_FOUND',
      statusCode: 404,
      message: 'Projeto não encontrado.',
    });
  });

  it('cai na mensagem genérica quando o code é desconhecido', async () => {
    const captured = await captureThrown(() =>
      interceptResponse(
        fakeResponse({
          ok: false,
          status: 422,
          json: () => Promise.resolve({ code: 'CODE_QUE_NAO_EXISTE' }),
        }),
      ),
    );

    expect(captured).toMatchObject({
      code: 'CODE_QUE_NAO_EXISTE',
      statusCode: 422,
      message: GENERIC_MESSAGE,
    });
  });

  it('usa SERVER_ERROR quando a API falha sem informar code', async () => {
    const captured = await captureThrown(() =>
      interceptResponse(
        fakeResponse({ ok: false, status: 500, json: () => Promise.resolve({}) }),
      ),
    );

    expect(captured).toMatchObject({
      code: 'SERVER_ERROR',
      statusCode: 500,
      message: 'Erro no servidor. Tente novamente mais tarde.',
    });
  });
});
