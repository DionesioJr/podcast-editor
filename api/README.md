# Deploy do Podcast Editor numa VPS

Passo a passo único para subir o Podcast Editor numa VPS limpa, do zero até o site respondendo no domínio. É a implantação descrita no Documento Técnico 15. Os arquivos citados já existem no repositório e não precisam ser alterados: `api/deploy.sh`, `api/ecosystem.config.js`, `api/Caddyfile`, `api/.env.example` e `api/scripts/backup.sh`.

Pré-requisitos: uma VPS Debian ou Ubuntu limpa, acesso SSH com um usuário que tenha `sudo`, um domínio apontando para o IP da VPS e a URL do repositório do projeto.

## 1. Instalar Node.js 20 ou superior, pnpm, PM2, git, FFmpeg e Caddy

### Node.js 20 ou superior

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### pnpm

```bash
sudo npm install -g pnpm
pnpm --version
```

### PM2

```bash
sudo npm install -g pm2
pm2 --version
```

### git

```bash
sudo apt-get install -y git
git --version
```

### FFmpeg

```bash
sudo apt-get install -y ffmpeg
ffmpeg -version
```

### Caddy

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
caddy version
```

## 2. Criar /data e o diretório de logs do PM2

`/data` guarda os arquivos dos projetos (Documento Técnico 5 e 15.5) e o PM2 grava os logs em `/var/log/pm2` (Documento Técnico 15.2).

```bash
sudo mkdir -p /data /var/log/pm2
```

## 3. Criar o banco e o usuário do MariaDB

O banco é o MariaDB (Documento Técnico 4). Se ainda não estiver instalado na VPS, instale o servidor:

```bash
sudo apt-get install -y mariadb-server
sudo systemctl enable --now mariadb
```

Crie o banco `podcast_editor` e o usuário que a API vai usar. Troque a senha por uma forte e use exatamente os mesmos valores em `DATABASE_URL` no passo 4:

```bash
sudo mariadb -e "CREATE DATABASE podcast_editor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mariadb -e "CREATE USER 'podcast'@'localhost' IDENTIFIED BY 'TROCAR_POR_SENHA_FORTE';"
sudo mariadb -e "GRANT ALL PRIVILEGES ON podcast_editor.* TO 'podcast'@'localhost'; FLUSH PRIVILEGES;"
```

O provider do Prisma é `mysql` (`api/prisma/schema.prisma`), então a conexão usa `DATABASE_URL` no formato `mysql://usuario:senha@localhost:3306/podcast_editor`.

## 4. Preencher api/.env e criar app/.env

Os dois arquivos ficam dentro do repositório, que será clonado no passo 5. Se ainda não clonou, clone antes de editar. O `api/.env` é a cópia do exemplo versionado, e `deploy.sh` lê os dois arquivos ao rodar.

Crie `api/.env` a partir de `api/.env.example`:

```bash
cp /srv/podcast-editor/api/.env.example /srv/podcast-editor/api/.env
```

Edite `/srv/podcast-editor/api/.env` e ajuste pelo menos:

- `DATABASE_URL` com o usuário, a senha e o banco criados no passo 3.
- `DATA_DIR=/data`, a pasta criada no passo 2.
- `FILE_URL_SECRET` com um segredo próprio.
- `OPENAI_API_KEY` com a chave da OpenAI.

As demais variáveis de `api/.env.example` podem ficar com os valores padrão.

Crie `/srv/podcast-editor/app/.env` com a URL pública da API (Documento Técnico 15.5):

```bash
printf 'EXPO_PUBLIC_API_URL=https://editor.exemplo.com\n' > /srv/podcast-editor/app/.env
```

O app lê `EXPO_PUBLIC_API_URL` em `app/src/config/api.ts`, e `deploy.sh` exige essa variável para exportar a web estática.

## 5. Clonar o repositório em /srv/podcast-editor

O caminho `/srv/podcast-editor` é o padrão esperado por `api/deploy.sh` e pelo `APP_WEB_ROOT` do `api/Caddyfile`. Para usar outro caminho, ajuste `REPO_DIR` no passo 7 e `APP_WEB_ROOT` no passo 6.

```bash
sudo mkdir -p /srv
sudo chown "$USER":"$USER" /srv
git clone <URL_DO_REPOSITORIO> /srv/podcast-editor
cd /srv/podcast-editor
```

## 6. Subir o Caddy com api/Caddyfile

O Caddy é o único serviço aberto para a internet: cuida do HTTPS automático, encaminha `/v1`, `/docs` e `/health` para a API e serve a web estática exportada (Documento Técnico 15.2). O `api/Caddyfile` recebe três variáveis de ambiente:

- `DOMAIN`: domínio público, com HTTPS automático (padrão `localhost`).
- `API_UPSTREAM`: endereço da API NestJS (padrão `127.0.0.1:3000`).
- `APP_WEB_ROOT`: pasta onde o `deploy.sh` exporta a web do app (padrão `/srv/podcast-editor/app/dist`).

Pare um serviço Caddy padrão, se existir, para ele não disputar as portas 80 e 443, e suba o Caddy com o arquivo do repositório:

```bash
sudo systemctl stop caddy 2>/dev/null || true
cd /srv/podcast-editor
DOMAIN=editor.exemplo.com \
API_UPSTREAM=127.0.0.1:3000 \
APP_WEB_ROOT=/srv/podcast-editor/app/dist \
sudo -E caddy start --config /srv/podcast-editor/api/Caddyfile
```

O `caddy start` deixa o Caddy rodando em segundo plano. Para acompanhar a subida em primeiro plano, use `caddy run` com as mesmas variáveis, como indica o cabeçalho do `api/Caddyfile`. O Caddy precisa do domínio já apontando para o IP da VPS para emitir o certificado.

## 7. Rodar bash api/deploy.sh

O `api/deploy.sh` executa a sequência de deploy: `git pull`, instalação das dependências, build da API, migrações do Prisma, reload dos processos no PM2 e export web do app (Documento Técnico 15.3).

```bash
cd /srv/podcast-editor
bash api/deploy.sh
```

O script aceita quatro variáveis opcionais, descritas no cabeçalho dele:

- `REPO_DIR`: raiz do repositório (padrão: a pasta acima de `api/`, ou seja `/srv/podcast-editor`).
- `DEPLOY_BRANCH`: branch a publicar (padrão: a branch atual do repositório). Use `DEPLOY_BRANCH=developer` para publicar a integração.
- `PM2_CONFIG`: caminho do `ecosystem.config.js` (padrão: `api/ecosystem.config.js`).
- `SKIP_APP`: com o valor `1`, pula a exportação da web do app.

Exemplo publicando a branch de integração:

```bash
DEPLOY_BRANCH=developer bash api/deploy.sh
```

## 8. Conferir os processos do PM2 e o site no domínio

Confira os dois processos definidos em `api/ecosystem.config.js` (`podcast-api` e `podcast-worker`), ambos no ar:

```bash
pm2 list
pm2 logs podcast-api
pm2 logs podcast-worker
```

Para os processos voltarem sozinhos depois de reiniciar a VPS:

```bash
pm2 save
pm2 startup
```

Confira a saúde da API e a resposta do site no domínio. O Caddy publica o `GET /health` da API:

```bash
curl -I https://editor.exemplo.com
curl https://editor.exemplo.com/health
curl https://editor.exemplo.com/docs
```

Site respondendo em HTTPS, `/health` retornando OK e os dois processos do PM2 no ar significam que o deploy terminou. O `api/Caddyfile` já desliga o buffer na rota de SSE (`GET /v1/projects/:id/events`), usada pelo progresso em tempo real (Documento Técnico 12).

## Operação

O backup diário do banco é feito por `api/scripts/backup.sh`, que gera um dump comprimido e mantém os 7 dias mais recentes (Documento Técnico 15.4). Agende a execução diária por fora, por exemplo em `/etc/cron.d`, apontando para o caminho absoluto do script.
