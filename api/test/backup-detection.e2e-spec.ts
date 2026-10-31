import * as fs from 'fs';
import * as path from 'path';

import {
  criarDumpNoNome,
  criarPastaBinRestrita,
  criarPastaTemporaria,
  descreverComShellPosix,
  dumpsEm,
  lerRegistro,
  limparPastasTemporarias,
  rodarBackup,
} from './support/backup-harness';

afterAll(limparPastasTemporarias);

const CONEXAO = {
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_NAME: 'podcast_editor',
  DB_USER: 'podcast',
  DB_PASSWORD: 'segredo',
  RETENTION_DAYS: '7',
};

descreverComShellPosix(
  'scripts/backup.sh: escolha do binário de dump (execução real)',
  () => {
    it('escolhe o mariadb-dump quando ele existe no PATH', () => {
      const pasta = criarPastaTemporaria();
      const bin = criarPastaBinRestrita(pasta);
      const registro = path.join(pasta, 'dump.log');
      const destino = path.join(pasta, 'backups');

      criarDumpNoNome(bin, 'mariadb-dump');

      const resultado = rodarBackup({
        ...CONEXAO,
        PATH: bin,
        DUMP_FAKE_LOG: registro,
        BACKUP_DIR: destino,
      });

      expect(resultado.status).toBe(0);
      expect(dumpsEm(destino)).toHaveLength(1);
      expect(lerRegistro(registro)).toContain('nome:mariadb-dump');
    });

    it('usa o mysqldump quando o mariadb-dump não existe no PATH', () => {
      const pasta = criarPastaTemporaria();
      const bin = criarPastaBinRestrita(pasta);
      const registro = path.join(pasta, 'dump.log');
      const destino = path.join(pasta, 'backups');

      criarDumpNoNome(bin, 'mysqldump');

      const resultado = rodarBackup({
        ...CONEXAO,
        PATH: bin,
        DUMP_FAKE_LOG: registro,
        BACKUP_DIR: destino,
      });

      expect(resultado.status).toBe(0);
      expect(dumpsEm(destino)).toHaveLength(1);
      expect(lerRegistro(registro)).toContain('nome:mysqldump');
    });

    it('falha quando não há mariadb-dump nem mysqldump', () => {
      const pasta = criarPastaTemporaria();
      const bin = criarPastaBinRestrita(pasta);
      const destino = path.join(pasta, 'backups');

      const resultado = rodarBackup({
        ...CONEXAO,
        PATH: bin,
        BACKUP_DIR: destino,
      });

      expect(resultado.status).not.toBe(0);
      expect(resultado.stderr).toMatch(
        /mariadb-dump \(ou mysqldump\) não encontrado no PATH/,
      );
      expect(fs.existsSync(destino)).toBe(false);
    });
  },
);
