import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {
  AmbienteDeDeploy,
  CAMINHO_DEPLOY,
  RAIZ_DA_API,
  RAIZ_DO_REPO,
  TEM_ENV_DO_APP,
  ambienteLimpoDeploy,
  criarAmbienteDeDeploy,
  criarPastaTemporaria,
  limparPastasTemporarias,
} from './support/deploy-harness';
import { descreverComShellPosix } from './support/shell-harness';

let ambiente: AmbienteDeDeploy;

beforeEach(() => {
  ambiente = criarAmbienteDeDeploy();
});

afterAll(limparPastasTemporarias);

describe('deploy.sh do Podcast Editor', () => {
  it('existe, é bash e encerra na primeira falha', () => {
    expect(fs.existsSync(CAMINHO_DEPLOY)).toBe(true);

    const fonte = fs.readFileSync(CAMINHO_DEPLOY, 'utf8');

    expect(fonte.startsWith('#!/usr/bin/env bash')).toBe(true);
    expect(fonte).toMatch(/set -euo pipefail/);
    expect(fonte).toMatch(/--help/);
  });
});

descreverComShellPosix('deploy.sh: execução real com binários simulados', () => {
  it('responde ao --help sem exigir .env nem binários instalados', () => {
    const resultado = spawnSync('bash', [CAMINHO_DEPLOY, '--help'], {
      encoding: 'utf8',
      cwd: RAIZ_DO_REPO,
      env: ambienteLimpoDeploy(),
    });

    expect(resultado.status).toBe(0);
    expect(resultado.stdout ?? '').toContain('Uso: bash api/deploy.sh');
  });

  it('executa pull, build, migrações, PM2 e export web na ordem do Documento Técnico 15.3', () => {
    const resultado = ambiente.rodar({});

    expect(resultado.status).toBe(0);

    const etapas = [
      'pull --ff-only',
      'install --frozen-lockfile',
      'run build',
      'prisma migrate deploy',
      'startOrReload',
      'expo export -p web --output-dir dist',
    ];
    const posicoes = etapas.map((trecho) => ambiente.posicao(trecho));

    expect(posicoes).toEqual([...posicoes].sort((a, b) => a - b));
  });

  it('instala as dependências sem --prod, para o build ter as devDependencies', () => {
    const resultado = ambiente.rodar({});

    expect(resultado.status).toBe(0);

    const linhasPnpm = ambiente.lerLinhas().filter((linha) => linha.startsWith('pnpm|'));

    expect(linhasPnpm.length).toBeGreaterThanOrEqual(4);

    for (const linha of linhasPnpm) {
      expect(linha).not.toContain('--prod');
    }
  });

  it('pula a exportação web quando SKIP_APP=1', () => {
    const resultado = ambiente.rodar({ SKIP_APP: '1' });

    expect(resultado.status).toBe(0);

    const linhas = ambiente.lerLinhas();

    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('para o deploy quando o pull falha, sem compilar, migrar nem recarregar o PM2', () => {
    const resultado = ambiente.rodar({ FAKE_FAIL_ARGS: 'pull --ff-only' });

    expect(resultado.status).not.toBe(0);

    const linhas = ambiente.lerLinhas();

    expect(linhas.some((linha) => linha.includes('pull --ff-only'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('run build'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('prisma migrate deploy'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('para antes de compilar quando a instalação das dependências falha', () => {
    const resultado = ambiente.rodar({ FAKE_FAIL_ARGS: 'install --frozen-lockfile' });

    expect(resultado.status).not.toBe(0);

    const linhas = ambiente.lerLinhas();

    expect(linhas.some((linha) => linha.includes('install --frozen-lockfile'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('run build'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('prisma migrate deploy'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('para antes das migrações quando a compilação falha', () => {
    const resultado = ambiente.rodar({ FAKE_FAIL_ARGS: 'run build' });

    expect(resultado.status).not.toBe(0);

    const linhas = ambiente.lerLinhas();

    expect(linhas.some((linha) => linha.includes('run build'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('prisma migrate deploy'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('para antes de recarregar o PM2 quando as migrações falham', () => {
    const resultado = ambiente.rodar({ FAKE_FAIL_ARGS: 'prisma migrate deploy' });

    expect(resultado.status).not.toBe(0);

    const linhas = ambiente.lerLinhas();

    expect(linhas.some((linha) => linha.includes('run build'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('prisma migrate deploy'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(false);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('para antes de exportar o app quando o PM2 falha', () => {
    const resultado = ambiente.rodar({ FAKE_FAIL_ARGS: 'startOrReload' });

    expect(resultado.status).not.toBe(0);

    const linhas = ambiente.lerLinhas();

    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
  });

  it('sai com erro quando o export do app web falha', () => {
    const resultado = ambiente.rodar({ FAKE_FAIL_ARGS: 'expo export -p web' });

    expect(resultado.status).not.toBe(0);

    const linhas = ambiente.lerLinhas();

    expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(true);
    expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(true);
  });

  it('recusa rodar quando o arquivo do PM2 não existe, antes de qualquer passo', () => {
    const resultado = ambiente.rodar({
      PM2_CONFIG: path.join(ambiente.pasta, 'inexistente.config.js'),
    });

    expect(resultado.status).not.toBe(0);
    expect(resultado.stderr).toMatch(/Arquivo do PM2 não encontrado/);
    expect(ambiente.lerLinhas()).toEqual([]);
  });

  if (!TEM_ENV_DO_APP) {
    it('falha ao exportar o app quando falta EXPO_PUBLIC_API_URL', () => {
      const resultado = ambiente.rodar({}, ['EXPO_PUBLIC_API_URL']);

      expect(resultado.status).not.toBe(0);
      expect(resultado.stderr).toMatch(/Defina EXPO_PUBLIC_API_URL/);

      const linhas = ambiente.lerLinhas();

      expect(linhas.some((linha) => linha.includes('startOrReload'))).toBe(true);
      expect(linhas.some((linha) => linha.includes('expo export -p web'))).toBe(false);
    });
  }
});

descreverComShellPosix('deploy.sh: raiz do app web no arquivo do Caddy', () => {
  const RAIZ_WEB_PADRAO = path.join(RAIZ_DO_REPO, 'app', 'dist');

  function lerArquivoDoCaddy(): string {
    return fs.readFileSync(ambiente.arquivoCaddy, 'utf8');
  }

  it('cria o arquivo do Caddy com APP_WEB_ROOT igual à pasta que o próprio deploy exporta', () => {
    const resultado = ambiente.rodar({});

    expect(resultado.status).toBe(0);
    expect(fs.existsSync(ambiente.arquivoCaddy)).toBe(true);
    expect(lerArquivoDoCaddy()).toBe(`APP_WEB_ROOT=${RAIZ_WEB_PADRAO}\n`);
  });

  it('grava a raiz mesmo quando a exportação web é pulada com SKIP_APP=1', () => {
    const resultado = ambiente.rodar({ SKIP_APP: '1' });

    expect(resultado.status).toBe(0);
    expect(fs.existsSync(ambiente.arquivoCaddy)).toBe(true);
    expect(lerArquivoDoCaddy()).toBe(`APP_WEB_ROOT=${RAIZ_WEB_PADRAO}\n`);
  });

  it('preserva DOMAIN e API_UPSTREAM e substitui o APP_WEB_ROOT anterior', () => {
    fs.writeFileSync(
      ambiente.arquivoCaddy,
      'DOMAIN=editor.exemplo.com\nAPI_UPSTREAM=127.0.0.1:4000\nAPP_WEB_ROOT=/caminho/antigo\n',
    );

    const resultado = ambiente.rodar({});

    expect(resultado.status).toBe(0);

    const conteudo = lerArquivoDoCaddy();

    expect(conteudo).toContain('DOMAIN=editor.exemplo.com');
    expect(conteudo).toContain('API_UPSTREAM=127.0.0.1:4000');
    expect(conteudo).not.toContain('/caminho/antigo');
    expect(conteudo).toContain(`APP_WEB_ROOT=${RAIZ_WEB_PADRAO}`);
    expect(conteudo.match(/^APP_WEB_ROOT=/gm)).toHaveLength(1);
  });

  it('não acumula linhas APP_WEB_ROOT quando o deploy roda mais de uma vez', () => {
    expect(ambiente.rodar({}).status).toBe(0);
    expect(ambiente.rodar({}).status).toBe(0);

    expect(lerArquivoDoCaddy().match(/^APP_WEB_ROOT=/gm)).toHaveLength(1);
  });

  it('grava o caminho real do clone, e não /srv/podcast-editor, quando o repositório está em outra pasta', () => {
    const outroClone = criarPastaTemporaria('pde-repo-');
    const apiDoClone = path.join(outroClone, 'api');
    const appDoClone = path.join(outroClone, 'app');

    fs.mkdirSync(apiDoClone, { recursive: true });
    fs.mkdirSync(appDoClone, { recursive: true });
    fs.writeFileSync(
      path.join(apiDoClone, 'ecosystem.config.js'),
      'module.exports = { apps: [] };\n',
    );

    const arquivoDoClone = path.join(apiDoClone, '.env.caddy');
    const resultado = ambiente.rodar({
      REPO_DIR: outroClone,
      CADDY_ENV_FILE: arquivoDoClone,
    });

    expect(resultado.status).toBe(0);

    const conteudo = fs.readFileSync(arquivoDoClone, 'utf8');

    expect(conteudo).toBe(`APP_WEB_ROOT=${path.join(appDoClone, 'dist')}\n`);
    expect(conteudo).not.toContain('/srv/podcast-editor');
  });

  it('mantém a raiz padrão do Caddyfile no layout que o deploy assume em /srv/podcast-editor', () => {
    const fonteDoCaddy = fs.readFileSync(path.join(RAIZ_DA_API, 'Caddyfile'), 'utf8');
    const padrao = fonteDoCaddy.match(/\{\$APP_WEB_ROOT:([^}]+)\}/);

    expect(padrao?.[1]).toBe('/srv/podcast-editor/app/dist');
  });

  it('não grava a raiz do app web quando a exportação web falha', () => {
    const resultado = ambiente.rodar({ FAKE_FAIL_ARGS: 'expo export -p web' });

    expect(resultado.status).not.toBe(0);
    expect(fs.existsSync(ambiente.arquivoCaddy)).toBe(false);
  });

  it('falha sem anunciar sucesso quando não consegue gravar o arquivo do Caddy', () => {
    const caminhoImpossivel = path.join(ambiente.pasta, 'pasta-inexistente', '.env.caddy');
    const resultado = ambiente.rodar({ CADDY_ENV_FILE: caminhoImpossivel });

    expect(resultado.status).not.toBe(0);
    expect(resultado.stderr).toMatch(/Não foi possível gravar a raiz do app web/);
    expect(resultado.stdout).not.toContain('Deploy concluído');
    expect(fs.existsSync(caminhoImpossivel)).toBe(false);
  });
});
