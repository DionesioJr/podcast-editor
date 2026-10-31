#!/usr/bin/env bash
#
# Instala ou atualiza o cron do backup diário do Podcast Editor
# (Documento Técnico 15.4). Idempotente: rodar de novo com o cron já em dia
# não altera o arquivo.
#
# Execute na VPS, como root:
#   sudo bash api/scripts/install-backup-cron.sh
#
# Variáveis opcionais:
#   CRON_FILE      arquivo do cron (padrão: /etc/cron.d/podcast-backup)
#   CRON_SCHEDULE  expressão cron de cinco campos (padrão: 0 3 * * *)
#   CRON_USER      usuário que executa o backup (padrão: root)
#   BACKUP_LOG     arquivo de log do backup (padrão: /var/log/podcast-editor-backup.log)

set -euo pipefail

log() { printf '[backup-cron] %s\n' "$1"; }
fail() { printf '[backup-cron] ERRO: %s\n' "$1" >&2; exit 1; }

usage() {
  cat <<'TXT'
Instala ou atualiza o cron do backup diário do Podcast Editor.

O arquivo gerado aponta para o caminho absoluto de scripts/backup.sh desta
cópia do repositório. Rode de novo depois de mover o repositório para o cron
acompanhar o novo caminho.

Pré-requisito: permissão de escrita em /etc/cron.d (rode com sudo).

Uso: sudo bash api/scripts/install-backup-cron.sh [--help]

Variáveis opcionais:
  CRON_FILE      caminho do arquivo do cron (padrão: /etc/cron.d/podcast-backup)
  CRON_SCHEDULE  expressão cron de cinco campos (padrão: 0 3 * * *)
  CRON_USER      usuário que executa o backup (padrão: root)
  BACKUP_LOG     arquivo de log do backup (padrão: /var/log/podcast-editor-backup.log)
TXT
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

[[ $# -eq 0 ]] || fail "Argumento não reconhecido: $1. Use --help."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"

CRON_FILE="${CRON_FILE:-/etc/cron.d/podcast-backup}"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 3 * * *}"
CRON_USER="${CRON_USER:-root}"
BACKUP_LOG="${BACKUP_LOG:-/var/log/podcast-editor-backup.log}"

[[ -f "$BACKUP_SCRIPT" ]] || fail "Script de backup não encontrado em $BACKUP_SCRIPT."

# A checagem de root só vale para o destino padrão. Com CRON_FILE apontando
# para outro lugar (testes, instalação local), basta ter escrita na pasta.
if [[ "$CRON_FILE" == /etc/* && "${EUID}" -ne 0 ]]; then
  fail "Escrever em $CRON_FILE exige root. Rode com sudo."
fi

# Só entram números e os símbolos de cron, em exatamente cinco campos separados
# por um espaço: quebra de linha, % e aspas não chegam ao arquivo do cron.
CRON_SCHEDULE_RE='^[0-9*/,-]+( [0-9*/,-]+){4}$'
[[ "$CRON_SCHEDULE" =~ $CRON_SCHEDULE_RE ]] || fail "CRON_SCHEDULE inválido: '$CRON_SCHEDULE'. Use cinco campos numéricos, como em '0 3 * * *'."

CRON_USER_RE='^[a-z_][a-z0-9_-]*$'
[[ "$CRON_USER" =~ $CRON_USER_RE ]] || fail "CRON_USER inválido: '$CRON_USER'. Use um nome de usuário Unix."

check_path() {
  local nome="$1" valor="$2"
  if [[ "$valor" == *[[:space:]%]* ]]; then
    fail "$nome não pode ter espaço, quebra de linha nem '%': '$valor'."
  fi
}
check_path "CRON_FILE" "$CRON_FILE"
check_path "BACKUP_SCRIPT" "$BACKUP_SCRIPT"
check_path "BACKUP_LOG" "$BACKUP_LOG"

# O cron roda com PATH mínimo; sem ele o backup.sh não acha gzip, find e o dump.
conteudo="$(cat <<TXT
# Gerado por api/scripts/install-backup-cron.sh. Não edite à mão.
# Backup diário do banco do Podcast Editor (Documento Técnico 15.4).
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=""
$CRON_SCHEDULE $CRON_USER $BACKUP_SCRIPT >> $BACKUP_LOG 2>&1
TXT
)"

cron_dir="$(dirname "$CRON_FILE")"

mkdir -p "$cron_dir"

if [[ -f "$CRON_FILE" && "$(cat "$CRON_FILE")" == "$conteudo" ]]; then
  log "Cron já está atualizado em $CRON_FILE."
  exit 0
fi

# Nome começando com ponto: o cron ignora o temporário enquanto ele existe.
tmp="$(mktemp "$cron_dir/.backup-cron.XXXXXX")"
trap 'rm -f "$tmp"' EXIT

printf '%s\n' "$conteudo" >"$tmp"
chmod 0644 "$tmp"
mv "$tmp" "$CRON_FILE"
trap - EXIT

log "Cron instalado em $CRON_FILE:"
log "  $CRON_SCHEDULE $CRON_USER $BACKUP_SCRIPT"
