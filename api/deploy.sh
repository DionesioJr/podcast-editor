#!/usr/bin/env bash
#
# Deploy do Podcast Editor na VPS (Documento Técnico 15.2 e 15.3).
# Rode na VPS, com o git, o pnpm e o PM2 já instalados:
#   bash api/deploy.sh
#
# Variáveis opcionais:
#   REPO_DIR       raiz do repositório (padrão: pasta acima de api/)
#   DEPLOY_BRANCH  branch a publicar (padrão: a branch atual do repositório)
#   PM2_CONFIG     caminho do ecosystem.config.js (padrão: api/ecosystem.config.js)
#   SKIP_APP       "1" para não exportar o app web

set -euo pipefail

log() { printf '[deploy] %s\n' "$1"; }
fail() { printf '[deploy] ERRO: %s\n' "$1" >&2; exit 1; }

usage() {
  cat <<'TXT'
Deploy do Podcast Editor na VPS, de ponta a ponta.

Pré-requisitos da VPS (uma única vez):
  - Node.js 20+, pnpm, PM2, git, FFmpeg e Caddy instalados
  - MariaDB no ar, com o banco e o usuário de DATABASE_URL criados
  - /data criado e /var/log/pm2 existindo
  - api/.env completo, como em api/.env.example
  - app/.env com EXPO_PUBLIC_API_URL apontando para o domínio público
  - Caddy rodando com api/Caddyfile (veja as variáveis no cabeçalho dele)

Passos executados: git pull, build da API, migrações do Prisma,
reload do PM2 e export web do app.

Uso: bash api/deploy.sh [--help]
TXT
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(dirname "$SCRIPT_DIR")}"
API_DIR="$REPO_DIR/api"
APP_DIR="$REPO_DIR/app"
PM2_CONFIG="${PM2_CONFIG:-$API_DIR/ecosystem.config.js}"

[[ -d "$API_DIR" ]] || fail "Pasta da API não encontrada em $API_DIR."
[[ -f "$PM2_CONFIG" ]] || fail "Arquivo do PM2 não encontrado em $PM2_CONFIG."
command -v git >/dev/null 2>&1 || fail "git não encontrado no PATH."
command -v pnpm >/dev/null 2>&1 || fail "pnpm não encontrado no PATH."
command -v pm2 >/dev/null 2>&1 || fail "pm2 não encontrado no PATH."

load_env() {
  if [[ -f "$1" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$1"
    set +a
  fi
}

load_env "$API_DIR/.env"
load_env "$APP_DIR/.env"

log "1/6 Atualizando o código em $REPO_DIR"
if [[ -n "${DEPLOY_BRANCH:-}" ]]; then
  git -C "$REPO_DIR" fetch --prune origin "$DEPLOY_BRANCH"
  git -C "$REPO_DIR" checkout "$DEPLOY_BRANCH"
  git -C "$REPO_DIR" pull --ff-only origin "$DEPLOY_BRANCH"
else
  git -C "$REPO_DIR" pull --ff-only
fi

log "2/6 Instalando as dependências da API"
pnpm --dir "$API_DIR" install --frozen-lockfile

log "3/6 Compilando a API"
pnpm --dir "$API_DIR" run build

log "4/6 Aplicando as migrações do Prisma"
pnpm --dir "$API_DIR" exec prisma migrate deploy

log "5/6 Recarregando os processos do PM2"
# startOrReload sobe os processos no primeiro deploy e recarrega os seguintes.
# NODE_ENV=production explícito e sem --update-env: mesmo com NODE_ENV=development
# em api/.env, a API e o worker sobem em produção pelo env do ecosystem.config.js (PDE-119).
NODE_ENV=production pm2 startOrReload "$PM2_CONFIG"

log "6/6 Exportando o app web"
if [[ "${SKIP_APP:-0}" == "1" ]]; then
  log "Exportação do app web ignorada (SKIP_APP=1)."
else
  [[ -n "${EXPO_PUBLIC_API_URL:-}" ]] || fail "Defina EXPO_PUBLIC_API_URL em $APP_DIR/.env para exportar o app web."
  pnpm --dir "$APP_DIR" install --frozen-lockfile
  # A saída é $APP_DIR/dist. O Caddyfile precisa do mesmo caminho em APP_WEB_ROOT
  # (padrão /srv/podcast-editor/app/dist, igual a app/dist com o repositório em
  # /srv/podcast-editor); ajuste APP_WEB_ROOT no Caddy se clonar em outro lugar.
  pnpm --dir "$APP_DIR" exec expo export -p web --output-dir dist
fi

log "Deploy concluído."
