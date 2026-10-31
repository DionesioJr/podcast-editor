import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ResultadoDeComando } from './shell-harness';

export { descreverComShellPosix } from './shell-harness';

export const RAIZ_DA_API = path.resolve(__dirname, '..', '..');
export const CAMINHO_BACKUP = path.join(RAIZ_DA_API, 'scripts', 'backup.sh');
export const TEM_ENV_LOCAL = fs.existsSync(path.join(RAIZ_DA_API, '.env'));

const pastasTemporarias: string[] = [];

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
// DUMP_FAKE_LOG o nome do binário, os argumentos e o valor de MYSQL_PWD.
function conteudoDumpFalso(falhar: boolean): string {
  const linhas = [
    '#!/usr/bin/env bash',
    'if [[ -n "${DUMP_FAKE_LOG:-}" ]]; then',
    '  {',
    `    printf "nome:%s\\n" "\${0##*/}"`,
    `    printf "argumentos:%s\\n" "$*"`,
    `    printf "senha:%s\\n" "\${MYSQL_PWD:-}"`,
    '  } > "$DUMP_FAKE_LOG"',
    'fi',
    falhar ? 'exit 1' : `printf 'dump de teste\\n'`,
  ];

  return `${linhas.join('\n')}\n`;
}

export function criarDumpNoNome(
  pasta: string,
  nome: string,
  falhar = false,
): string {
  const caminho = path.join(pasta, nome);

  fs.writeFileSync(caminho, conteudoDumpFalso(falhar), { mode: 0o755 });

  return caminho;
}

export function criarDumpFalso(pasta: string, falhar = false): string {
  return criarDumpNoNome(pasta, 'dump-falso.sh', falhar);
}

// O backup.sh procura mariadb-dump e mysqldump no PATH. Para exercitar a
// escolha do binário de verdade, o teste roda o script com um PATH só com
// cópias dos utilitários que ele usa, sem os binários de dump do sistema.
const COMANDOS_NECESSARIOS = [
  'bash',
  'date',
  'dirname',
  'find',
  'grep',
  'gzip',
  'mkdir',
  'mv',
  'rm',
  'sed',
  'sort',
  'tail',
];

function resolverComando(nome: string): string | undefined {
  const resultado = spawnSync('bash', ['-c', `command -v ${nome}`], {
    encoding: 'utf8',
  });

  if (resultado.error || resultado.status !== 0) {
    return undefined;
  }

  const caminho = (resultado.stdout ?? '').trim();

  return caminho === '' ? undefined : caminho;
}

export function criarPastaBinRestrita(pasta: string): string {
  const pastaBin = path.join(pasta, 'bin-restrito');

  fs.mkdirSync(pastaBin, { recursive: true });

  for (const comando of COMANDOS_NECESSARIOS) {
    const origem = resolverComando(comando);

    if (!origem) {
      throw new Error(
        `Comando necessário ao backup.sh não encontrado no ambiente: ${comando}`,
      );
    }

    fs.symlinkSync(origem, path.join(pastaBin, comando));
  }

  return pastaBin;
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
