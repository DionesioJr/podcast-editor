import * as fs from 'fs';
import * as path from 'path';

import {
  TEM_ENV_LOCAL,
  criarDumpFalso,
  criarPastaTemporaria,
  descreverComShellPosix,
  dumpsEm,
  limparPastasTemporarias,
  rodarBackup,
} from './support/backup-harness';

afterAll(limparPastasTemporarias);

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
