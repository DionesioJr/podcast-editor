import * as fs from 'fs';
import * as path from 'path';

import {
  criarDumpFalso,
  criarPastaTemporaria,
  descreverComShellPosix,
  dumpsEm,
  limparPastasTemporarias,
  rodarBackup,
} from './support/backup-harness';

afterAll(limparPastasTemporarias);

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
