import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ResultadoDeComando } from './shell-harness';

export const RAIZ_DA_API = path.resolve(__dirname, '..', '..');
export const RAIZ_DO_REPO = path.resolve(RAIZ_DA_API, '..');
export const CAMINHO_DEPLOY = path.join(RAIZ_DA_API, 'deploy.sh');
export const TEM_ENV_DO_APP = fs.existsSync(path.join(RAIZ_DO_REPO, 'app', '.env'));

const pastasTemporarias: string[] = [];

export function limparPastasTemporarias(): void {
  for (const pasta of pastasTemporarias) {
    fs.rmSync(pasta, { recursive: true, force: true });
  }

  pastasTemporarias.length = 0;
}

// Cria uma pasta temporária registrada para limpeza no afterAll.
export function criarPastaTemporaria(prefixo = 'pde-tmp-'): string {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));

  pastasTemporarias.push(pasta);

  return pasta;
}

export function ambienteLimpoDeploy(): NodeJS.ProcessEnv {
  const ambiente: NodeJS.ProcessEnv = { ...process.env };

  for (const chave of [
    'REPO_DIR',
    'DEPLOY_BRANCH',
    'PM2_CONFIG',
    'CADDY_ENV_FILE',
    'SKIP_APP',
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

function caminhoOriginal(): string {
  return process.env.PATH ?? process.env.Path ?? '/usr/local/bin:/usr/bin:/bin';
}

export interface AmbienteDeDeploy {
  pasta: string;
  log: string;
  arquivoCaddy: string;
  rodar(extras: NodeJS.ProcessEnv, remover?: string[]): ResultadoDeComando;
  lerLinhas(): string[];
  posicao(trecho: string): number;
}

export function criarAmbienteDeDeploy(): AmbienteDeDeploy {
  const pasta = criarPastaTemporaria('pde-deploy-');
  const pastaBin = criarBinariosFalsos(pasta);
  const log = path.join(pasta, 'comandos.log');
  const arquivoCaddy = path.join(pasta, '.env.caddy');

  function rodar(extras: NodeJS.ProcessEnv, remover: string[] = []): ResultadoDeComando {
    const ambiente: NodeJS.ProcessEnv = {
      ...ambienteLimpoDeploy(),
      PATH: `${pastaBin}${path.delimiter}${caminhoOriginal()}`,
      FAKE_LOG: log,
      EXPO_PUBLIC_API_URL: 'https://editor.exemplo.com',
      CADDY_ENV_FILE: arquivoCaddy,
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

  function posicao(trecho: string): number {
    const indice = lerLinhas().findIndex((linha) => linha.includes(trecho));

    if (indice === -1) {
      throw new Error(`O deploy não executou o comando esperado: ${trecho}`);
    }

    return indice;
  }

  return { pasta, log, arquivoCaddy, rodar, lerLinhas, posicao };
}
