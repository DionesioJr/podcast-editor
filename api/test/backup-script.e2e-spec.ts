import * as fs from 'fs';
import * as path from 'path';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const CAMINHO_BACKUP = path.join(RAIZ_DA_API, 'scripts', 'backup.sh');

function posicao(texto: string, trecho: string): number {
  const indice = texto.indexOf(trecho);

  if (indice === -1) {
    throw new Error(`Trecho não encontrado no backup.sh: ${trecho}`);
  }

  return indice;
}

const fonte = fs.readFileSync(CAMINHO_BACKUP, 'utf8');

describe('scripts/backup.sh do Podcast Editor (e2e)', () => {
  it('existe e é declarado como script bash que para na primeira falha', () => {
    expect(fs.existsSync(CAMINHO_BACKUP)).toBe(true);
    expect(fonte.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(fonte).toMatch(/set -euo pipefail/);
  });

  it('explica que o backup é diário, com 7 dias de retenção', () => {
    expect(fonte).toMatch(/mariadb-dump/);
    expect(fonte).toMatch(/7 dias/);
  });
});

describe('backup.sh: geração do dump (e2e)', () => {
  it('usa mariadb-dump com queda para mysqldump', () => {
    expect(posicao(fonte, 'mariadb-dump')).toBeLessThan(
      posicao(fonte, 'mysqldump'),
    );
  });

  it('falha com mensagem clara quando nenhum dump está disponível', () => {
    expect(fonte).toMatch(/não encontrado no PATH/);
  });

  it('gera o dump sem travar as tabelas e de forma consistente', () => {
    expect(fonte).toMatch(/--single-transaction/);
    expect(fonte).toMatch(/--quick/);
    expect(fonte).toMatch(/--skip-lock-tables/);
  });

  it('não expõe a senha na lista de processos', () => {
    expect(fonte).toMatch(/MYSQL_PWD="\$DB_PASSWORD"/);
    expect(fonte).not.toMatch(/--password=/);
  });

  it('grava em arquivo .partial e só então renomeia para o nome final', () => {
    expect(fonte).toMatch(/partial="\$\{target\}\.partial"/);
    expect(posicao(fonte, '"$partial"')).toBeLessThan(
      posicao(fonte, 'mv "$partial"'),
    );
  });

  it('remove o parcial e falha quando o dump não é gerado', () => {
    expect(fonte).toMatch(/rm -f "\$partial"/);
    expect(fonte).toMatch(/fail "Falha ao gerar o dump/);
  });
});

describe('backup.sh: conexão com o banco (e2e)', () => {
  it('aceita DB_HOST, DB_NAME e DB_USER direto do ambiente do cron', () => {
    expect(fonte).toMatch(/DB_HOST/);
    expect(fonte).toMatch(/DB_NAME/);
    expect(fonte).toMatch(/DB_USER/);
  });

  it('extrai a conexão do DATABASE_URL quando as variáveis DB_* não existem', () => {
    expect(fonte).toMatch(/DATABASE_URL/);
  });

  it('falha com mensagem clara quando não há DATABASE_URL nem DB_*', () => {
    expect(fonte).toMatch(/fail "Defina DATABASE_URL/);
  });

  it('usa a porta 3306 quando nenhuma porta é informada', () => {
    expect(fonte).toMatch(/DB_PORT:-3306/);
  });
});

describe('backup.sh: retenção de 7 dias (e2e)', () => {
  it('tem 7 dias como padrão de retenção', () => {
    expect(fonte).toMatch(/RETENTION_DAYS:-7/);
  });

  it('remove o que passou de seis dias cheios, mantendo os 7 backups diários', () => {
    expect(fonte).toContain('-mtime "+$((RETENTION_DAYS - 1))"');
  });

  it('aplica a retenção apenas aos arquivos de backup do projeto', () => {
    expect(fonte).toContain("-name 'podcast_editor_*.sql.gz'");
  });

  it('roda a limpeza depois de gravar o backup do dia', () => {
    expect(posicao(fonte, 'mv "$partial"')).toBeLessThan(
      posicao(fonte, '-delete'),
    );
  });

  it('permite ajustar os dias e a pasta por variável de ambiente', () => {
    expect(fonte).toMatch(/BACKUP_DIR:-/);
    expect(fonte).toMatch(/RETENTION_DAYS:-/);
  });
});
