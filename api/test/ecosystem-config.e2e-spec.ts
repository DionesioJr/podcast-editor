import * as os from 'os';
import * as path from 'path';

interface ProcessoPm2 {
  name?: string;
  script?: string;
  cwd?: string;
  instances?: number;
  exec_mode?: string;
  autorestart?: boolean;
  exp_backoff_restart_delay?: number;
  max_memory_restart?: string;
  env?: Record<string, string>;
  error_file?: string;
  out_file?: string;
  merge_logs?: boolean;
  time?: boolean;
}

interface EcosystemConfig {
  apps: ProcessoPm2[];
}

const RAIZ_DA_API = path.resolve(__dirname, '..');
const CAMINHO_ECOSYSTEM = path.join(RAIZ_DA_API, 'ecosystem.config.js');
const NOMES_ESPERADOS = ['podcast-api', 'podcast-worker'];

function carregarEcosystem(): EcosystemConfig {
  return require(CAMINHO_ECOSYSTEM) as EcosystemConfig;
}

function buscarProcesso(config: EcosystemConfig, nome: string): ProcessoPm2 {
  const processo = config.apps.find((app) => app.name === nome);

  if (!processo) {
    throw new Error(`Processo ${nome} não está definido no ecosystem.config.js`);
  }

  return processo;
}

describe('ecosystem.config.js do PM2 (e2e)', () => {
  let config: EcosystemConfig;

  beforeEach(() => {
    jest.resetModules();
    config = carregarEcosystem();
  });

  it('exporta exatamente os processos podcast-api e podcast-worker', () => {
    expect(Array.isArray(config.apps)).toBe(true);
    expect(config.apps).toHaveLength(NOMES_ESPERADOS.length);
    expect(config.apps.map((app) => app.name).sort()).toEqual(['podcast-api', 'podcast-worker']);
  });

  it('não repete o mesmo nome de processo', () => {
    const nomes = config.apps.map((app) => app.name);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it.each(NOMES_ESPERADOS)('%s está configurado para reiniciar sozinho', (nome) => {
    expect(buscarProcesso(config, nome).autorestart).toBe(true);
  });

  it.each(NOMES_ESPERADOS)('%s usa backoff exponencial com atraso positivo', (nome) => {
    const atraso = buscarProcesso(config, nome).exp_backoff_restart_delay;

    expect(typeof atraso).toBe('number');
    expect(atraso).toBeGreaterThan(0);
  });

  it('roda a API a partir do artefato compilado dist/src/main.js', () => {
    expect(buscarProcesso(config, 'podcast-api').script).toBe('dist/src/main.js');
  });

  it('roda o worker a partir do artefato compilado dist/src/worker.js', () => {
    expect(buscarProcesso(config, 'podcast-worker').script).toBe('dist/src/worker.js');
  });

  it.each(NOMES_ESPERADOS)(
    '%s aponta para JavaScript compilado, nunca para o TypeScript de origem',
    (nome) => {
      const script = buscarProcesso(config, nome).script ?? '';

      expect(script).toMatch(/\.js$/);
      expect(script).not.toMatch(/\.ts$/);
    },
  );

  it.each(NOMES_ESPERADOS)('%s executa a partir da pasta da API', (nome) => {
    expect(buscarProcesso(config, nome).cwd).toBe(RAIZ_DA_API);
  });

  it.each(NOMES_ESPERADOS)('%s tem teto de memória para o PM2 reiniciar antes de esgotar a VPS', (nome) => {
    expect(buscarProcesso(config, nome).max_memory_restart ?? '').toMatch(/^\d+[MG]$/);
  });

  it.each(NOMES_ESPERADOS)('%s grava erro e saída em arquivos de log próprios', (nome) => {
    const processo = buscarProcesso(config, nome);

    expect(processo.error_file ?? '').toMatch(new RegExp(`${nome}-error\\.log$`));
    expect(processo.out_file ?? '').toMatch(new RegExp(`${nome}-out\\.log$`));
  });

  it.each(NOMES_ESPERADOS)('%s sobe com NODE_ENV de produção', (nome) => {
    expect(buscarProcesso(config, nome).env?.NODE_ENV).toBe('production');
  });

  it('roda cada processo em um único fork, sem cluster', () => {
    for (const nome of NOMES_ESPERADOS) {
      const processo = buscarProcesso(config, nome);

      expect(processo.exec_mode).toBe('fork');
      expect(processo.instances).toBe(1);
    }
  });
});

describe('diretório de log configurável do ecosystem.config.js (e2e)', () => {
  const envOriginal = process.env.PM2_LOG_DIR;
  let erroMock: jest.SpyInstance;

  beforeEach(() => {
    erroMock = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    erroMock.mockRestore();
    jest.resetModules();

    if (envOriginal === undefined) {
      delete process.env.PM2_LOG_DIR;
    } else {
      process.env.PM2_LOG_DIR = envOriginal;
    }
  });

  it('usa /var/log/pm2 como padrão quando PM2_LOG_DIR não está definida', () => {
    delete process.env.PM2_LOG_DIR;
    jest.resetModules();
    const config = carregarEcosystem();

    for (const app of config.apps) {
      expect(app.error_file).toBe(path.join('/var/log/pm2', `${app.name}-error.log`));
      expect(app.out_file).toBe(path.join('/var/log/pm2', `${app.name}-out.log`));
    }
  });

  it('deriva error_file e out_file de PM2_LOG_DIR quando ela está definida', () => {
    const diretorio = path.join(os.tmpdir(), 'pm2-logs-pde-117');
    process.env.PM2_LOG_DIR = diretorio;
    jest.resetModules();
    const config = carregarEcosystem();

    for (const app of config.apps) {
      expect(app.error_file).toBe(path.join(diretorio, `${app.name}-error.log`));
      expect(app.out_file).toBe(path.join(diretorio, `${app.name}-out.log`));
    }
  });

  it('não mantém caminho absoluto fixo quando PM2_LOG_DIR aponta para outro diretório', () => {
    const diretorio = path.join(os.tmpdir(), 'pm2-logs-alternativo');
    process.env.PM2_LOG_DIR = diretorio;
    jest.resetModules();
    const config = carregarEcosystem();

    for (const app of config.apps) {
      expect(path.dirname(app.error_file ?? '')).toBe(diretorio);
      expect(path.dirname(app.out_file ?? '')).toBe(diretorio);
    }
  });
});
