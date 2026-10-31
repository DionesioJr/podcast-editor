#!/usr/bin/env bash
#
# Backup diário do banco do Podcast Editor (Documento Técnico 15.4).
# Gera um dump comprimido e mantém os 7 dias mais recentes.
# Agendado pelo deploy.sh em /etc/cron.d/podcast-backup (todo dia às 3h).
#
# Variáveis lidas de api/.env quando existirem:
#   DATABASE_URL   conexão da API; dispensável se DB_HOST, DB_NAME e DB_USER vierem do ambiente
#   BACKUP_DIR     pasta de destino (padrão: /var/backups/podcast-editor)
#   RETENTION_DAYS dias de retenção (padrão: 7)

set -euo pipefail

log() { printf '[backup] %s\n' "$1"; }
fail() { printf '[backup] ERRO: %s\n' "$1" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/podcast-editor}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Aceita DB_* direto do ambiente ou extrai do DATABASE_URL da API.
if [[ -z "${DB_HOST:-}" || -z "${DB_NAME:-}" || -z "${DB_USER:-}" ]]; then
  [[ -n "${DATABASE_URL:-}" ]] || fail "Defina DATABASE_URL em api/.env ou as variáveis DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME."

  url="${DATABASE_URL#*://}"
  credentials="${url%%@*}"
  remainder="${url##*@}"
  host_port="${remainder%%/*}"

  DB_USER="${DB_USER:-${credentials%%:*}}"
  if [[ "$credentials" == *:* ]]; then
    DB_PASSWORD="${DB_PASSWORD:-${credentials#*:}}"
  else
    DB_PASSWORD="${DB_PASSWORD:-}"
  fi

  DB_NAME="${DB_NAME:-${remainder#*/}}"
  DB_NAME="${DB_NAME%%\?*}"
  DB_HOST="${DB_HOST:-${host_port%%:*}}"
  if [[ "$host_port" == *:* ]]; then
    DB_PORT="${DB_PORT:-${host_port##*:}}"
  else
    DB_PORT="${DB_PORT:-3306}"
  fi
fi

DB_PASSWORD="${DB_PASSWORD:-}"
DB_PORT="${DB_PORT:-3306}"

DUMP_BIN="${DUMP_BIN:-}"
if [[ -z "$DUMP_BIN" ]]; then
  if command -v mariadb-dump >/dev/null 2>&1; then
    DUMP_BIN="mariadb-dump"
  elif command -v mysqldump >/dev/null 2>&1; then
    DUMP_BIN="mysqldump"
  else
    fail "mariadb-dump (ou mysqldump) não encontrado no PATH."
  fi
fi

mkdir -p "$BACKUP_DIR"

stamp="$(date +%Y-%m-%d_%H-%M)"
target="$BACKUP_DIR/podcast_editor_${stamp}.sql.gz"
partial="${target}.partial"

log "Gerando $target"
# MYSQL_PWD evita expor a senha na lista de processos.
if ! MYSQL_PWD="$DB_PASSWORD" "$DUMP_BIN" \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --single-transaction \
  --quick \
  --skip-lock-tables \
  --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip -c >"$partial"; then
  rm -f "$partial"
  fail "Falha ao gerar o dump de $DB_NAME."
fi

mv "$partial" "$target"

# Retenção: apaga o que passou de RETENTION_DAYS dias, mantendo 7 backups diários.
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'podcast_editor_*.sql.gz' -mtime "+$((RETENTION_DAYS - 1))" -delete

log "Backup concluído em $BACKUP_DIR:"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'podcast_editor_*.sql.gz' -printf '%f\n' | sort
