import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const CAMINHO_BACKUP = path.join(RAIZ_DA_API, 'scripts', 'backup.sh');
const TEM_ENV_LOCAL = fs.existsSync(path.join(RAIZ_DA_API, '.env'));

interface ResultadoDeComando {
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

const SHELL_POSIX = temShellPosix();

function descreverComShellPosix(nome: string, definir: () => void): void {
  if (SHELL_POSIX) {
    describe(nome, definir);
  } else {
    describe.skip(
      `${nome} (pulado: é preciso Linux com bash para executar os scripts)`,
      definir,
    );
  }
}

function criarPastaTemporaria(): string {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'pde-backup-'));

  pastasTemporarias.push(pasta);

  return pasta;
}

afterAll(() => {
  for (const pasta of pastasTemporarias) {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
});

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

function rodarBackup(extras: NodeJS.ProcessEnv): ResultadoDeComando {
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
function criarDumpFalso(pasta: string, falhar = false): string {
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

function dumpsEm(pasta: string): string[] {
  if (!fs.existsSync(pasta)) {
    return [];
  }

  return fs
    .readdirSync(pasta)
    .filter((nome) => /^podcast_editor_.*\.sql\.gz$/.test(nome))
    .sort();
}

function lerRegistro(caminho: string): string[] {
  if (!fs.existsSync(caminho)) {
    throw new Error(`O dump falso não registrou os argumentos em ${caminho}`);
  }

  return fs.readFileSync(caminho, 'utf8').split('\n');
}

describe('scripts/backup.sh do Podcast Editor', () => {
  it('existe, é bash e para na primeira falha', () => {
    expect(fs.existsSync(CAMINHO_BACKUP)).toBe(true);

    const fonte = fs.readFileSync(CAMINHO_BACKUP, 'utf8');

    expect(fonte.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(fonte).toMatch(/set -euo pipefail/);
    expect(fonte).toMatch(/mariadb-dump/);
  });
});

descreverComShellPosix('scripts/backup.sh: geração do dump (execução real)', () => {
  it('gera um dump gzipado e não deixa o arquivo parcial para trás', () => {
    const pasta = criarPastaTemporaria();
    const destino = path.join(pasta, 'backups');

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta),
      DUMP_FAKE_LOG: path.join(pasta, 'dump.log'),
      BACKUP_DIR: destino,
      RETENTION_DAYS: '7',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_NAME: 'podcast_editor',
      DB_USER: 'podcast',
      DB_PASSWORD: 'segredo',
    });

    expect(resultado.status).toBe(0);

    const arquivos = fs.readdirSync(destino);

    expect(arquivos.some((nome) => nome.endsWith('.partial'))).toBe(false);

    const dumps = dumpsEm(destino);

    expect(dumps).toHaveLength(1);

    const conteudo = fs.readFileSync(path.join(destino, dumps[0]));

    // Assinatura gzip: prova que o dump passa pelo gzip antes de ser publicado.
    expect(conteudo[0]).toBe(0x1f);
    expect(conteudo[1]).toBe(0x8b);
  });

  it('entrega host, porta, usuário e banco ao dump e mantém a senha fora dos argumentos', () => {
    const pasta = criarPastaTemporaria();
    const registro = path.join(pasta, 'dump.log');

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta),
      DUMP_FAKE_LOG: registro,
      BACKUP_DIR: path.join(pasta, 'backups'),
      RETENTION_DAYS: '7',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_NAME: 'podcast_editor',
      DB_USER: 'podcast',
      DB_PASSWORD: 'p@ss com espaço',
    });

    expect(resultado.status).toBe(0);

    const linhas = lerRegistro(registro);
    const argumentos = linhas.find((linha) => linha.startsWith('argumentos:')) ?? '';
    const senha = linhas.find((linha) => linha.startsWith('senha:')) ?? '';

    expect(argumentos).toContain('--host=localhost');
    expect(argumentos).toContain('--port=3306');
    expect(argumentos).toContain('--user=podcast');
    expect(argumentos).toContain('podcast_editor');
    expect(argumentos).toContain('--single-transaction');
    expect(argumentos).toContain('--quick');
    expect(argumentos).toContain('--skip-lock-tables');
    expect(argumentos).toContain('--default-character-set=utf8mb4');
    expect(argumentos).not.toContain('--password=');
    expect(argumentos).not.toContain('p@ss');
    expect(senha).toBe('senha:p@ss com espaço');
  });

  it('decodifica a senha percent-encoded do DATABASE_URL, como o Prisma exige', () => {
    const pasta = criarPastaTemporaria();
    const registro = path.join(pasta, 'dump.log');

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta),
      DUMP_FAKE_LOG: registro,
      BACKUP_DIR: path.join(pasta, 'backups'),
      DATABASE_URL: 'mysql://usuario_teste:p%40ss%3A1@10.0.0.9:3307/banco_teste',
    });

    expect(resultado.status).toBe(0);

    const linhas = lerRegistro(registro);
    const argumentos = linhas.find((linha) => linha.startsWith('argumentos:')) ?? '';
    const senha = linhas.find((linha) => linha.startsWith('senha:')) ?? '';

    expect(argumentos).toContain('--host=10.0.0.9');
    expect(argumentos).toContain('--port=3307');
    expect(argumentos).toContain('--user=usuario_teste');
    expect(argumentos).toContain('banco_teste');
    expect(argumentos).not.toContain('p@ss');
    expect(senha).toBe('senha:p@ss:1');
  });

  it('falha, apaga o parcial e não publica dump quando o mariadb-dump retorna erro', () => {
    const pasta = criarPastaTemporaria();
    const destino = path.join(pasta, 'backups');

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta, true),
      BACKUP_DIR: destino,
      RETENTION_DAYS: '7',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_NAME: 'podcast_editor',
      DB_USER: 'podcast',
      DB_PASSWORD: 'segredo',
    });

    expect(resultado.status).not.toBe(0);
    expect(resultado.stderr).toMatch(/Falha ao gerar o dump de podcast_editor/);
    expect(fs.existsSync(destino) ? fs.readdirSync(destino) : []).toEqual([]);
  });

  if (!TEM_ENV_LOCAL) {
    it('falha com mensagem clara quando não há DATABASE_URL nem DB_*', () => {
      const pasta = criarPastaTemporaria();

      const resultado = rodarBackup({
        DUMP_BIN: criarDumpFalso(pasta),
        BACKUP_DIR: path.join(pasta, 'backups'),
      });

      expect(resultado.status).not.toBe(0);
      expect(resultado.stderr).toMatch(/Defina DATABASE_URL em api\/\.env/);
      expect(dumpsEm(path.join(pasta, 'backups'))).toEqual([]);
    });
  }
});

descreverComShellPosix('scripts/backup.sh: retenção de 7 dias (execução real)', () => {
  const UM_DIA = 24 * 60 * 60 * 1000;

  function envelhecer(caminho: string, dias: number): void {
    const data = new Date(Date.now() - dias * UM_DIA);

    fs.utimesSync(caminho, data, data);
  }

  it('guarda os 7 backups diários mais recentes e apaga o que passou de 7 dias', () => {
    const pasta = criarPastaTemporaria();
    const destino = path.join(pasta, 'backups');

    fs.mkdirSync(destino, { recursive: true });

    for (let dia = 1; dia <= 8; dia += 1) {
      const caminho = path.join(destino, `podcast_editor_dia_${dia}.sql.gz`);

      fs.writeFileSync(caminho, 'conteúdo antigo');
      // Meio dia além da idade cheia, longe da fronteira do find.
      envelhecer(caminho, dia + 0.5);
    }

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta),
      BACKUP_DIR: destino,
      RETENTION_DAYS: '7',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_NAME: 'podcast_editor',
      DB_USER: 'podcast',
      DB_PASSWORD: 'segredo',
    });

    expect(resultado.status).toBe(0);

    const restantes = dumpsEm(destino);

    // O dump do dia (idade 0) mais os de 1 a 6 dias.
    expect(restantes).toHaveLength(7);

    for (let dia = 1; dia <= 6; dia += 1) {
      expect(restantes).toContain(`podcast_editor_dia_${dia}.sql.gz`);
    }

    expect(restantes).not.toContain('podcast_editor_dia_7.sql.gz');
    expect(restantes).not.toContain('podcast_editor_dia_8.sql.gz');
  });

  it('usa 7 dias por padrão, sem RETENTION_DAYS no ambiente', () => {
    const pasta = criarPastaTemporaria();
    const destino = path.join(pasta, 'backups');

    fs.mkdirSync(destino, { recursive: true });

    const recente = path.join(destino, 'podcast_editor_recente.sql.gz');
    const limite = path.join(destino, 'podcast_editor_limite.sql.gz');
    const antigo = path.join(destino, 'podcast_editor_antigo.sql.gz');

    for (const caminho of [recente, limite, antigo]) {
      fs.writeFileSync(caminho, 'conteúdo antigo');
    }

    // 5,5 dias: dentro da retenção.
    envelhecer(recente, 5.5);
    // 6,5 dias: continua dentro, então o padrão não é menor que 7.
    envelhecer(limite, 6.5);
    // 7,5 dias: fora, então o padrão não é maior que 7.
    envelhecer(antigo, 7.5);

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta),
      BACKUP_DIR: destino,
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_NAME: 'podcast_editor',
      DB_USER: 'podcast',
      DB_PASSWORD: 'segredo',
    });

    expect(resultado.status).toBe(0);

    const restantes = dumpsEm(destino);

    expect(restantes).toContain('podcast_editor_recente.sql.gz');
    expect(restantes).toContain('podcast_editor_limite.sql.gz');
    expect(restantes).not.toContain('podcast_editor_antigo.sql.gz');
  });

  it('não apaga arquivos que não são backup do projeto', () => {
    const pasta = criarPastaTemporaria();
    const destino = path.join(pasta, 'backups');

    fs.mkdirSync(destino, { recursive: true });

    const alheio = path.join(destino, 'outro_arquivo.sql.gz');

    fs.writeFileSync(alheio, 'conteúdo alheio');
    envelhecer(alheio, 30);

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta),
      BACKUP_DIR: destino,
      RETENTION_DAYS: '7',
      DB_HOST: 'localhost',
      DB_PORT: '3306',
      DB_NAME: 'podcast_editor',
      DB_USER: 'podcast',
      DB_PASSWORD: 'segredo',
    });

    expect(resultado.status).toBe(0);
    expect(fs.existsSync(alheio)).toBe(true);
  });
});
