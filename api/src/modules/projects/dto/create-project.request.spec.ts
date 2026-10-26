import { validate } from 'class-validator';

import { CreateProjectRequest } from './create-project.request';

describe('CreateProjectRequest', () => {
  const criarRequest = (overrides: Partial<CreateProjectRequest> = {}): CreateProjectRequest => {
    const request = new CreateProjectRequest();
    request.originalName = 'meu_podcast.mp4';
    request.sizeBytes = 524288000;

    Object.assign(request, overrides);

    return request;
  };

  it('não gera erro de validação com dados válidos', async () => {
    const request = criarRequest();

    const erros = await validate(request);

    expect(erros).toHaveLength(0);
  });

  it('aceita o tamanho mínimo permitido (1 byte)', async () => {
    const request = criarRequest({ sizeBytes: 1 });

    const erros = await validate(request);

    expect(erros).toHaveLength(0);
  });

  it('aceita o tamanho máximo permitido (2 GB)', async () => {
    const request = criarRequest({ sizeBytes: 2147483648 });

    const erros = await validate(request);

    expect(erros).toHaveLength(0);
  });

  it('rejeita sizeBytes igual a zero', async () => {
    const request = criarRequest({ sizeBytes: 0 });

    const erros = await validate(request);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('sizeBytes');
  });

  it('rejeita sizeBytes negativo', async () => {
    const request = criarRequest({ sizeBytes: -1 });

    const erros = await validate(request);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('sizeBytes');
  });

  it('rejeita sizeBytes acima de 2 GB', async () => {
    const request = criarRequest({ sizeBytes: 2147483649 });

    const erros = await validate(request);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('sizeBytes');
  });

  it('rejeita sizeBytes não inteiro', async () => {
    const request = criarRequest({ sizeBytes: 100.5 });

    const erros = await validate(request);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('sizeBytes');
  });

  it('rejeita sizeBytes que não é número', async () => {
    const request = criarRequest({ sizeBytes: 'muito grande' as unknown as number });

    const erros = await validate(request);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('sizeBytes');
  });

  it('rejeita originalName vazio', async () => {
    const request = criarRequest({ originalName: '' });

    const erros = await validate(request);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('originalName');
  });

  it('rejeita originalName que não é string', async () => {
    const request = criarRequest({ originalName: 12345 as unknown as string });

    const erros = await validate(request);

    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].property).toBe('originalName');
  });
});
