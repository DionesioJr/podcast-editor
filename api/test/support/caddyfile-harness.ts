import * as fs from 'fs';
import * as path from 'path';

export const RAIZ_DA_API = path.resolve(__dirname, '..', '..');
export const CAMINHO_CADDYFILE = path.join(RAIZ_DA_API, 'Caddyfile');

export const NOME_DO_SNIPPET = 'api_upstream';
export const UPSTREAM_LITERAL = 'reverse_proxy {$API_UPSTREAM:127.0.0.1:3000}';
export const IMPORT_DO_SNIPPET = `import ${NOME_DO_SNIPPET}`;
export const FLUSH_SEM_BUFFER = 'flush_interval -1';

export const HANDLES_DA_API = ['v1', 'v1/*', '@docs', '/health'] as const;

export type NomeDeHandleDaApi = (typeof HANDLES_DA_API)[number];

export interface BlocosDoCaddyfile {
  snippet?: string;
  sse?: string;
  v1?: string;
  v1Curinga?: string;
  docs?: string;
  health?: string;
  web?: string;
}

export function lerFonteDoCaddyfile(): string {
  return fs.readFileSync(CAMINHO_CADDYFILE, 'utf8');
}

function lerBloco(fonte: string, inicio: string, fim?: string): string | undefined {
  const de = fonte.indexOf(inicio);

  if (de === -1) {
    return undefined;
  }

  if (fim === undefined) {
    return fonte.slice(de);
  }

  const ate = fonte.indexOf(fim, de + inicio.length);

  if (ate === -1) {
    return undefined;
  }

  return fonte.slice(de, ate);
}

export function separarBlocos(fonte: string): BlocosDoCaddyfile {
  return {
    snippet: lerBloco(fonte, '(api_upstream)', '{$DOMAIN:localhost}'),
    sse: lerBloco(fonte, 'handle @sse', 'handle /v1 {'),
    v1: lerBloco(fonte, 'handle /v1 {', 'handle /v1/*'),
    v1Curinga: lerBloco(fonte, 'handle /v1/*', '@docs'),
    docs: lerBloco(fonte, 'handle @docs', 'handle /health'),
    health: lerBloco(fonte, 'handle /health', 'handle {'),
    web: lerBloco(fonte, 'handle {'),
  };
}

export function blocosDosHandlesDaApi(
  blocos: BlocosDoCaddyfile,
): Record<NomeDeHandleDaApi, string | undefined> {
  return {
    v1: blocos.v1,
    'v1/*': blocos.v1Curinga,
    '@docs': blocos.docs,
    '/health': blocos.health,
  };
}

export function ocorrencias(fonte: string, trecho: string): number {
  return fonte.split(trecho).length - 1;
}

export function snippetAntesDoUso(fonte: string): boolean {
  const snippet = fonte.indexOf('(api_upstream)');
  const primeiroImport = fonte.indexOf(IMPORT_DO_SNIPPET);

  return snippet !== -1 && primeiroImport !== -1 && snippet < primeiroImport;
}

export function problemasDoUpstreamReutilizavel(fonte: string): string[] {
  const blocos = separarBlocos(fonte);
  const problemas: string[] = [];

  if (blocos.snippet === undefined) {
    problemas.push('snippet (api_upstream) não definido');
  } else {
    if (!blocos.snippet.includes(UPSTREAM_LITERAL)) {
      problemas.push('snippet (api_upstream) não aponta para o upstream da API');
    }

    if (blocos.snippet.includes('flush_interval')) {
      problemas.push(
        'snippet (api_upstream) carrega flush_interval, que deve ficar só no handle @sse',
      );
    }
  }

  if (!snippetAntesDoUso(fonte)) {
    problemas.push('snippet (api_upstream) não é definido antes do primeiro import');
  }

  for (const [nome, bloco] of Object.entries(blocosDosHandlesDaApi(blocos))) {
    if (bloco === undefined) {
      problemas.push(`handle ${nome} não encontrado no Caddyfile`);
      continue;
    }

    if (!bloco.includes(IMPORT_DO_SNIPPET)) {
      problemas.push(`handle ${nome} não importa o snippet do upstream`);
    }

    if (bloco.includes('reverse_proxy')) {
      problemas.push(
        `handle ${nome} repete o reverse_proxy literal em vez de usar o snippet`,
      );
    }
  }

  if (blocos.sse === undefined) {
    problemas.push('handle @sse não encontrado no Caddyfile');
  } else {
    if (!blocos.sse.includes(FLUSH_SEM_BUFFER)) {
      problemas.push('handle @sse perdeu o flush_interval -1 (streaming sem buffer)');
    }

    if (
      !blocos.sse.includes(IMPORT_DO_SNIPPET) &&
      !blocos.sse.includes(UPSTREAM_LITERAL)
    ) {
      problemas.push('handle @sse não encaminha para o upstream da API');
    }
  }

  const totalDeFlush = ocorrencias(fonte, FLUSH_SEM_BUFFER);

  if (totalDeFlush !== 1) {
    problemas.push(
      `flush_interval -1 aparece ${totalDeFlush} vez(es); deve ficar só no handle @sse`,
    );
  }

  return problemas;
}
