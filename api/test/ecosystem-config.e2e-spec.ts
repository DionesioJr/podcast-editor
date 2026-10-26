import * as path from 'path';

describe('ecosystem.config.js do PM2', () => {
  const ecosystem = require(path.resolve(__dirname, '../ecosystem.config.js'));

  it('define exatamente os processos podcast-api e podcast-worker', () => {
    const nomes = ecosystem.apps.map((app: { name: string }) => app.name);

    expect(nomes).toEqual(['podcast-api', 'podcast-worker']);
  });

  it('podcast-api aponta para o main.js compilado', () => {
    const api = ecosystem.apps.find((app: { name: string }) => app.name === 'podcast-api');

    expect(api.script).toBe('dist/src/main.js');
  });

  it('podcast-worker aponta para o worker.js compilado', () => {
    const worker = ecosystem.apps.find((app: { name: string }) => app.name === 'podcast-worker');

    expect(worker.script).toBe('dist/src/worker.js');
  });

  it.each(['podcast-api', 'podcast-worker'])(
    '%s tem autorestart habilitado e backoff exponencial configurado',
    (nomeProcesso) => {
      const processo = ecosystem.apps.find((app: { name: string }) => app.name === nomeProcesso);

      expect(processo.autorestart).toBe(true);
      expect(typeof processo.exp_backoff_restart_delay).toBe('number');
      expect(processo.exp_backoff_restart_delay).toBeGreaterThan(0);
    },
  );

  it.each(['podcast-api', 'podcast-worker'])(
    '%s grava logs de erro e de saída em arquivos distintos',
    (nomeProcesso) => {
      const processo = ecosystem.apps.find((app: { name: string }) => app.name === nomeProcesso);

      expect(processo.error_file).toMatch(/\/var\/log\/pm2\//);
      expect(processo.out_file).toMatch(/\/var\/log\/pm2\//);
      expect(processo.error_file).not.toBe(processo.out_file);
    },
  );

  it('não define nenhum processo duplicado com o mesmo nome', () => {
    const nomes = ecosystem.apps.map((app: { name: string }) => app.name);
    const nomesUnicos = new Set(nomes);

    expect(nomesUnicos.size).toBe(nomes.length);
  });
});
