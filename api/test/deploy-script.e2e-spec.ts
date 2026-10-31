import * as fs from 'fs';
import * as path from 'path';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const CAMINHO_DEPLOY = path.join(RAIZ_DA_API, 'deploy.sh');

function posicao(texto: string, trecho: string): number {
  const indice = texto.indexOf(trecho);

  if (indice === -1) {
    throw new Error(`Trecho não encontrado no deploy.sh: ${trecho}`);
  }

  return indice;
}

const fonte = fs.readFileSync(CAMINHO_DEPLOY, 'utf8');
// O cabeçalho de uso também cita os passos; a ordem real fica no corpo do script.
const corpo = fonte.slice(posicao(fonte, 'SCRIPT_DIR='));

describe('deploy.sh do Podcast Editor (e2e)', () => {
  it('existe e é declarado como script bash', () => {
    expect(fs.existsSync(CAMINHO_DEPLOY)).toBe(true);
    expect(fonte.startsWith('#!/usr/bin/env bash')).toBe(true);
  });

  it('encerra na primeira falha e não segue com o deploy pela metade', () => {
    expect(fonte).toMatch(/set -euo pipefail/);
  });
});

describe('deploy.sh: pré-requisitos e uso (e2e)', () => {
  it('explica os pré-requisitos da VPS e o uso com --help', () => {
    expect(fonte).toMatch(/--help/);
    expect(fonte).toMatch(/Pré-requisitos da VPS/);
    expect(fonte).toMatch(/Uso: bash api\/deploy\.sh/);
  });

  it('responde ao --help antes de carregar qualquer arquivo .env', () => {
    expect(posicao(fonte, '--help')).toBeLessThan(posicao(fonte, 'load_env'));
  });

  it.each(['git', 'pnpm', 'pm2'])('recusa rodar sem o %s no PATH', (binario) => {
    expect(fonte).toContain(`command -v ${binario}`);
  });

  it('falha com mensagem clara quando a pasta da API não existe', () => {
    expect(fonte).toMatch(/\[\[ -d "\$API_DIR" \]\] \|\| fail/);
  });

  it('falha com mensagem clara quando o arquivo do PM2 não existe', () => {
    expect(fonte).toMatch(/\[\[ -f "\$PM2_CONFIG" \]\] \|\| fail/);
  });
});

describe('deploy.sh: passos do deploy (e2e)', () => {
  it('atualiza o código com avanço rápido, sem merge automático', () => {
    expect(corpo).toMatch(/git -C "\$REPO_DIR" pull --ff-only/);
  });

  it('busca e troca de branch quando DEPLOY_BRANCH é definida', () => {
    expect(corpo).toMatch(/DEPLOY_BRANCH/);
    expect(corpo).toMatch(/git -C "\$REPO_DIR" fetch --prune origin/);
    expect(corpo).toMatch(/git -C "\$REPO_DIR" checkout "\$DEPLOY_BRANCH"/);
  });

  it('instala as dependências com o lockfile congelado', () => {
    expect(corpo).toMatch(/pnpm --dir "\$API_DIR" install --frozen-lockfile/);
  });

  it('compila a API antes de aplicar as migrações', () => {
    expect(posicao(corpo, 'run build')).toBeLessThan(
      posicao(corpo, 'prisma migrate deploy'),
    );
  });

  it('aplica as migrações do Prisma com migrate deploy', () => {
    expect(corpo).toMatch(/pnpm --dir "\$API_DIR" exec prisma migrate deploy/);
  });

  it('recarrega o PM2 com startOrReload, que também sobe no primeiro deploy', () => {
    expect(corpo).toMatch(/pm2 startOrReload "\$PM2_CONFIG" --update-env/);
  });

  it('compila antes de recarregar e recarrega antes de migrar o código já compilado', () => {
    expect(posicao(corpo, 'run build')).toBeLessThan(
      posicao(corpo, 'pm2 startOrReload'),
    );
    expect(posicao(corpo, 'prisma migrate deploy')).toBeLessThan(
      posicao(corpo, 'pm2 startOrReload'),
    );
  });

  it('exporta o app web para a pasta dist do app', () => {
    expect(corpo).toMatch(/APP_DIR="\$REPO_DIR\/app"/);
    expect(corpo).toMatch(/expo export -p web --output-dir dist/);
  });

  it('força NODE_ENV=production depois de carregar o .env, para o PM2 não subir em desenvolvimento', () => {
    expect(corpo).toMatch(/export NODE_ENV=production/);
    expect(posicao(corpo, 'export NODE_ENV=production')).toBeGreaterThan(
      posicao(corpo, 'load_env "$API_DIR/.env"'),
    );
    expect(posicao(corpo, 'export NODE_ENV=production')).toBeLessThan(
      posicao(corpo, 'pm2 startOrReload'),
    );
  });

  it('respeita a ordem do Documento Técnico 15.3: pull, build, migrações, PM2 e web', () => {
    const etapas = [
      'git -C "$REPO_DIR" pull --ff-only',
      'run build',
      'prisma migrate deploy',
      'pm2 startOrReload',
      'expo export -p web',
    ].map((trecho) => posicao(corpo, trecho));

    expect(etapas).toEqual([...etapas].sort((a, b) => a - b));
  });
});

describe('deploy.sh: caminhos infelizes e de borda (e2e)', () => {
  it('falha ao exportar o app quando falta EXPO_PUBLIC_API_URL', () => {
    expect(corpo).toMatch(/EXPO_PUBLIC_API_URL/);
    expect(corpo).toMatch(/Defina EXPO_PUBLIC_API_URL/);
    expect(corpo).toMatch(/fail "Defina EXPO_PUBLIC_API_URL/);
  });

  it('valida o EXPO_PUBLIC_API_URL antes de instalar e exportar o app', () => {
    expect(posicao(corpo, 'Defina EXPO_PUBLIC_API_URL')).toBeLessThan(
      posicao(corpo, 'expo export -p web'),
    );
  });

  it('permite pular a exportação do app com SKIP_APP=1', () => {
    expect(corpo).toMatch(/SKIP_APP/);
    expect(corpo).toMatch(/Exportação do app web ignorada/);
  });

  it('só instala o cron do backup quando roda como root', () => {
    expect(corpo).toMatch(/id -u/);
    expect(corpo).toContain('/etc/cron.d');
  });

  it('avisa em vez de abortar quando não pode instalar o cron', () => {
    expect(corpo).toMatch(/Aviso: sem permissão de root/);
  });

  it('permite pular a instalação do cron com SKIP_CRON=1', () => {
    expect(corpo).toMatch(/SKIP_CRON/);
  });
});
