import * as path from 'path';

import {
  criarDumpFalso,
  criarPastaTemporaria,
  descreverComShellPosix,
  lerRegistro,
  limparPastasTemporarias,
  rodarBackup,
} from './support/backup-harness';

afterAll(limparPastasTemporarias);

descreverComShellPosix('scripts/backup.sh: credenciais do banco (execução real)', () => {
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

  it('usa a porta 3306 quando o DATABASE_URL não traz porta', () => {
    const pasta = criarPastaTemporaria();
    const registro = path.join(pasta, 'dump.log');

    const resultado = rodarBackup({
      DUMP_BIN: criarDumpFalso(pasta),
      DUMP_FAKE_LOG: registro,
      BACKUP_DIR: path.join(pasta, 'backups'),
      DATABASE_URL: 'mysql://usuario_teste:segredo@10.0.0.9/banco_teste',
    });

    expect(resultado.status).toBe(0);

    const argumentos =
      lerRegistro(registro).find((linha) => linha.startsWith('argumentos:')) ?? '';

    expect(argumentos).toContain('--host=10.0.0.9');
    expect(argumentos).toContain('--port=3306');
    expect(argumentos).toContain('--user=usuario_teste');
    expect(argumentos).toContain('banco_teste');
  });
});
