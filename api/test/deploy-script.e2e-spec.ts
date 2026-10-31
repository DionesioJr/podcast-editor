import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import {
  AmbienteDeDeploy,
  CAMINHO_DEPLOY,
  RAIZ_DO_REPO,
  TEM_ENV_DO_APP,
  ambienteLimpoDeploy,
  criarAmbienteDeDeploy,
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
