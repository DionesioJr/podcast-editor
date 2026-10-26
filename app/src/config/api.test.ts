describe('config da API (PDE-8)', () => {
  const urlOriginal = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = urlOriginal;
    jest.resetModules();
  });

  it('usa EXPO_PUBLIC_API_URL quando a variável de ambiente está definida', () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo.com';

    const { BASE_URL } = require('./api');

    expect(BASE_URL).toBe('https://api.exemplo.com');
  });

  it('cai no fallback de desenvolvimento quando a variável não está definida', () => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_API_URL;

    const { BASE_URL } = require('./api');

    expect(BASE_URL).toBe('http://localhost:3000');
  });

  it('cai no fallback quando a variável está vazia', () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_URL = '';

    const { BASE_URL } = require('./api');

    expect(BASE_URL).toBe('http://localhost:3000');
  });

  it('expõe api.baseURL igual a BASE_URL', () => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo.com';

    const { api, BASE_URL } = require('./api');

    expect(api.baseURL).toBe(BASE_URL);
  });
});
