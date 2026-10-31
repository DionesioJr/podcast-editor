import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const RAIZ_DO_REPO = path.resolve(RAIZ_DA_API, '..');
const CAMINHO_DEPLOY = path.join(RAIZ_DA_API, 'deploy.sh');
const TEM_ENV_DO_APP = fs.existsSync(path.join(RAIZ_DO_REPO, 'app', '.env'));

interface ResultadoDeComando {
  status: number | null;
  stdout: string;
  stderr: string;
}

const pastasTemporarias: string[] = [];

// Os scripts desta tarefa são bash e dependem de userland GNU na VPS Linux;
// fora do Linux a execução real do deploy é pulada com aviso.
function temShellPosix(): boolean {
  if (process.platform !== 'linux') {
    return false;
  }

  const resultado = spawnSync('bash', ['--version'], { encoding: 'utf8' });

  return resultado.error === undefined && resultado.status === 0;
}

const SHELL_POSIX = temShellPosix();

function descreverComShellPosix(nome: string, definir: () => void): void {
  if (SHELL_POSIX) {
    describe(nome, definir);
  } else {
    describe.skip(
      `${nome} (pulado: é preciso Linux com bash para executar o deploy)`,
      definir,
    );
  }
}

function ambienteLimpo(): NodeJS.ProcessEnv {
  const ambiente: NodeJS.ProcessEnv = { ...process.env };

  for (const chave of [
    'REPO_DIR',
    'DEPLOY_BRANCH',
    'PM2_CONFIG',
    'SKIP_APP',
    'SKIP_CRON',
    'EXPO_PUBLIC_API_URL',
    'NODE_ENV',
  ]) {
    delete ambiente[chave];
  }

  return ambiente;
}

// git, pnpm e pm2 falsos: registram o comando em FAKE_LOG e, quando
// FAKE_FAIL_ARGS casa com os argumentos, saem com erro para testar o aborto.
function criarBinariosFalsos(pasta: string): string {
  const pastaBin = path.join(pasta, 'bin');

  fs.mkdirSync(pastaBin, { recursive: true });

  const script = [
    '#!/usr/bin/env bash',
    'nome="$(basename "$0")"',
    'if [[ -n "${FAKE_LOG:-}" ]]; then',
    `  printf "%s|%s|NODE_ENV=%s\\n" "$nome" "$*" "\${NODE_ENV:-}" >> "$FAKE_LOG"`,
    'fi',
    'if [[ -n "${FAKE_FAIL_ARGS:-}" && "$*" == *"$FAKE_FAIL_ARGS"* ]]; then',
    '  exit 1',
    'fi',
    'exit 0',
    '',
  ].join('\n');

  for (const nome of ['git', 'pnpm', 'pm2']) {
    fs.writeFileSync(path.join(pastaBin, nome), script, { mode: 0o755 });
  }

  return pastaBin;
}

let pasta = '';
let pastaBin = '';
let log = '';

beforeEach(() => {
  pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'pde-deploy-'));
  pastasTemporarias.push(pasta);
  pastaBin = criarBinariosFalsos(pasta);
  log = path.join(pasta, 'comandos.log');
});

afterAll(() => {
  for (const pastaTemporaria of pastasTemporarias) {
    fs.rmSync(pastaTemporaria, { recursive: true, force: true });
  }
});

function caminhoOriginal(): string {
  return process.env.PATH ?? process.env.Path ?? '/usr/local/bin:/usr/bin:/bin';
}

function rodarDeploy(extras: NodeJS.ProcessEnv, remover: string[] = []): ResultadoDeComando {
  const ambiente: NodeJS.ProcessEnv = {
    ...ambienteLimpo(),
    PATH: `${pastaBin}${path.delimiter}${caminhoOriginal()}`,
    FAKE_LOG: log,
    SKIP_CRON: '1',
    EXPO_PUBLIC_API_URL: 'https://editor.exemplo.com',
    ...extras,
  };

  for (const chave of remover) {
    delete ambiente[chave];
  }

  const resultado = spawnSync('bash', [CAMINHO_DEPLOY], {
    encoding: 'utf8',
    cwd: RAIZ_DO_REPO,
    env: ambiente,
  });

  return {
    status: resultado.status,
    stdout: resultado.stdout ?? '',
    stderr: resultado.stderr ?? '',
  };
}

function lerLinhas(): string[] {
  if (!fs.existsSync(log)) {
    return [];
  }

  return fs
    .readFileSync(log, 'utf8')
    .split('\n')
    .filter((linha) => linha.length > 0);
}

function posicao(linhas: string[], trecho: string): number {
  const indice = linhas.findIndex((linha) => linha.includes(trecho));

  if (indice === -1) {
    throw new Error(`O deploy não executou o comando esperado: ${trecho}`);
  }

  return indice;
}

function linhaCom(linhas: string[], trecho: string): string {
  return linhas[posicao(linhas, trecho)];
}

describe('deploy.sh do Podcast Editor', () => {
  it('existe, é bash e encerra na primeira falha', () => {
    expect(fs.existsSync(CAMINHO_DEPLOY)).toBe(true);

    const fonte = fs.readFileSync(CAMINHO_DEPLOY, 'utf8');

    expect(fonte.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(fonte).toMatch(/set -euo pipefail/);
    expect(fonte).toMatch(/--help/);
  });
});

descreverComShellPosix('deploy.sh: execução real com binários simulados', () => {
  it('responde ao --help sem exigir .env nem binários instalados', () => {
    const resultado = spawnSync('bash', [CAMINHO_DEPLOY, '--help'], {
      encoding: 'utf8',
      cwd: RAIZ_DO_REPO,
      env: ambienteLimpo(),
    });

    expect(resultado.status).toBe(0);
    expect(resultado.stdout ?? '').toContain('Uso: bash api/deploy.sh');
  });

  it('executa pull, build, migrações, PM2 e export web na ordem do Documento Técnico 15.3', () => {
    const resultado = rodarDeploy({});

    expect(resultado.status).toBe(0);

    const linhas = lerLinhas();
    const etapas = [
      'pull --ff-only',
      'install --frozen-lockfile',
      'run build',
      'prisma migrate deploy',
      'startOrReload',
      'expo export -p web --output-dir dist',
    ];
    const posicoes = etapas.map((trecho) => posicao(linhas, trecho));

    expect(posicoes).toEqual([...posicoes].sort((a, b) => a - b));
  });

  it('recarrega o PM2 com NODE_ENV=production mesmo com NODE_ENV=development no ambiente', () => {
    const resultado = rodarDeploy({ NODE_ENV: 'development' });

    expect(resultado.status).toBe(0);

    const pm2 = linhaCom(lerLinhas(), 'startOrReload');

    expect(pm2).toContain('--update-env');
    expect(pm2).toContain('NODE_ENV=production');
  });

  it('instala as dependências sem --prod, para o build ter as devDependencies', () => {
    const resultado = rodarDeploy({});

    expect(resultado.status).toBe(0);

    const linhasPnpm = lerLinhas().filter((linha) => linha.startsWith('pnpm|'));

    expect(linhasPnpm.length).toBeGreaterThanOrEqual(4);

    for (const linha of linhasPnpm) {
      expect(linha).not.toContain('--prod');
    }
  });

  it('pula a exportação web quando SKIP_APP=1', () => {
    const resultado = rodarDeploy({ SKIP_APP: '1' });

    expect(resultado.status).toBe(0);

    const linhas = lerLinhas();

    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('para o deploy quando o pull falha, sem compilar, migrar nem recarregar o PM2', () => {
    const resultado = rodarDeploy({ FAKE_FAIL_ARGS: 'pull --ff-only' });

    expect(resultado.status).not.toBe(0);

    const linhas = lerLinhas();

    expect(linhas.some((linha) => linha.includes('pull --ff-only'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('run build'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('prisma migrate deploy'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('para antes de recarregar o PM2 quando as migrações falham', () => {
    const resultado = rodarDeploy({ FAKE_FAIL_ARGS: 'prisma migrate deploy' });

    expect(resultado.status).not.toBe(0);

    const linhas = lerLinhas();

    expect(linhas.some((linha) => linha.includes('run build'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('prisma migrate deploy'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('recusa rodar quando o arquivo do PM2 não existe, antes de qualquer passo', () => {
    const resultado = rodarDeploy({ PM2_CONFIG: path.join(pasta, 'inexistente.config.js') });

    expect(resultado.status).not.toBe(0);
    expect(resultado.stderr).toMatch(/Arquivo do PM2 não encontrado/);
    expect(lerLinhas()).toEqual([]);
  });

  if (!TEM_ENV_DO_APP) {
    it('falha ao exportar o app quando falta EXPO_PUBLIC_API_URL', () => {
      const resultado = rodarDeploy({}, ['EXPO_PUBLIC_API_URL']);

      expect(resultado.status).not.toBe(0);
      expect(resultado.stderr).toMatch(/Defina EXPO_PUBLIC_API_URL/);

      const linhas = lerLinhas();

      expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(true);
      expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
    });
  }
});
