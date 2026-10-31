import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const RAIZ_DA_API = path.resolve(__dirname, '..', '..');
export const CAMINHO_BACKUP = path.join(RAIZ_DA_API, 'scripts', 'backup.sh');
export const TEM_ENV_LOCAL = fs.existsSync(path.join(RAIZ_DA_API, '.env'));

export interface ResultadoDeComando {
  status: number | null;
  stdout: string;
  stderr: string;
}

const pastasTemporarias: string[] = [];

// Os scripts desta tarefa são bash e dependem de userland GNU na VPS Linux
// (por exemplo find -printf); fora do Linux a execução real é pulada com aviso.
function temShellPosix(): boolean {
  if (process.platform !== 'linux') {
    return false;
  }

  const resultado = spawnSync('bash', ['--version'], { encoding: 'utf8' });

  return resultado.error === undefined && resultado.status === 0;
}

export const SHELL_POSIX = temShellPosix();

export function descreverComShellPosix(nome: string, definir: () => void): void {
  if (SHELL_POSIX) {
    describe(nome, definir);
  } else {
    describe.skip(
      `${nome} (pulado: é preciso Linux com bash para executar os scripts)`,
      definir,
    );
  }
}

export function criarPastaTemporaria(): string {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'pde-backup-'));

  pastasTemporarias.push(pasta);

  return pasta;
}

export function limparPastasTemporarias(): void {
  for (const pasta of pastasTemporarias) {
    fs.rmSync(pasta, { recursive: true, force: true });
  }

  pastasTemporarias.length = 0;
}

function ambienteLimpo(): NodeJS.ProcessEnv {
  const ambiente: NodeJS.ProcessEnv = { ...process.env };

  for (const chave of [
    'DATABASE_URL',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'BACKUP_DIR',
    'RETENTION_DAYS',
    'DUMP_BIN',
  ]) {
    delete ambiente[chave];
  }

  return ambiente;
}

export function rodarBackup(extras: NodeJS.ProcessEnv): ResultadoDeComando {
  const resultado = spawnSync('bash', [CAMINHO_BACKUP], {
    encoding: 'utf8',
    env: { ...ambienteLimpo(), ...extras },
  });

  return {
    status: resultado.status,
    stdout: resultado.stdout ?? '',
    stderr: resultado.stderr ?? '',
  };
}

// Dump falso: imprime o conteúdo do dump e, quando pedido, registra em
// DUMP_FAKE_LOG os argumentos recebidos e o valor de MYSQL_PWD.
export function criarDumpFalso(pasta: string, falhar = false): string {
  const caminho = path.join(pasta, 'dump-falso.sh');
  const linhas = [
    '#!/usr/bin/env bash',
    'if [[ -n "${DUMP_FAKE_LOG:-}" ]]; then',
    '  {',
    `    printf "argumentos:%s\\n" "$*"`,
    `    printf "senha:%s\\n" "\${MYSQL_PWD:-}"`,
    '  } > "$DUMP_FAKE_LOG"',
    'fi',
    falhar ? 'exit 1' : `printf 'dump de teste\\n'`,
  ];

  fs.writeFileSync(caminho, `${linhas.join('\n')}\n`, { mode: 0o755 });

  return caminho;
}

export function dumpsEm(pasta: string): string[] {
  if (!fs.existsSync(pasta)) {
    return [];
  }

  return fs
    .readdirSync(pasta)
    .filter((nome) => /^podcast_editor_.*\.sql\.gz$/.test(nome))
    .sort();
}

export function lerRegistro(caminho: string): string[] {
  if (!fs.existsSync(caminho)) {
    throw new Error(`O dump falso não registrou os argumentos em ${caminho}`);
  }

  return fs.readFileSync(caminho, 'utf8').split('\n');
}
