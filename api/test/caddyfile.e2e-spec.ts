import * as fs from 'fs';
import * as path from 'path';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const CAMINHO_CADDYFILE = path.join(RAIZ_DA_API, 'Caddyfile');

function posicao(texto: string, trecho: string): number {
  const indice = texto.indexOf(trecho);

  if (indice === -1) {
    throw new Error(`Trecho não encontrado no Caddyfile: ${trecho}`);
  }

  return indice;
}

const fonte = fs.readFileSync(CAMINHO_CADDYFILE, 'utf8');

function bloco(inicio: string, fim: string): string {
  const de = posicao(fonte, inicio);
  const ate = posicao(fonte, fim);

  if (ate <= de) {
    throw new Error(`Bloco fora de ordem no Caddyfile: ${inicio}`);
  }

  return fonte.slice(de, ate);
}

const blocoSse = bloco('@sse path_regexp', 'handle /v1/*');
const blocoV1 = bloco('handle /v1/*', '@docs');
const blocoDocs = bloco('handle @docs', 'handle /health');
const blocoEstatico = fonte.slice(posicao(fonte, 'handle {'));

describe('Caddyfile do Podcast Editor (e2e)', () => {
  it('existe e aponta o upstream da API para um endereço configurável', () => {
    expect(fs.existsSync(CAMINHO_CADDYFILE)).toBe(true);
    expect(fonte).toContain('reverse_proxy {$API_UPSTREAM:127.0.0.1:3000}');
  });

  it('habilita HTTPS automático pelo domínio configurável', () => {
    expect(fonte).toContain('{$DOMAIN:localhost}');
  });

  it('documenta as variáveis DOMAIN, API_UPSTREAM e APP_WEB_ROOT', () => {
    expect(fonte).toMatch(/DOMAIN/);
    expect(fonte).toMatch(/API_UPSTREAM/);
    expect(fonte).toMatch(/APP_WEB_ROOT/);
  });
});

describe('Caddyfile: encaminhamento da API (e2e)', () => {
  it('encaminha /v1 para a API', () => {
    expect(blocoV1).toMatch(/reverse_proxy \{\$API_UPSTREAM:127\.0\.0\.1:3000\}/);
  });

  it('encaminha /docs, /docs/* e /docs-json para a API', () => {
    expect(fonte).toContain('@docs path /docs /docs/* /docs-json');
    expect(blocoDocs).toMatch(/reverse_proxy \{\$API_UPSTREAM:127\.0\.0\.1:3000\}/);
  });

  it('encaminha /health para a API', () => {
    const blocoHealth = bloco('handle /health', 'handle {');
    expect(blocoHealth).toMatch(/reverse_proxy \{\$API_UPSTREAM:127\.0\.0\.1:3000\}/);
  });

  it('não encaminha rotas de arquivo para a API', () => {
    expect(blocoV1).not.toMatch(/\/v1\/files/);
  });
});

describe('Caddyfile: fluxo SSE sem buffer (e2e)', () => {
  it('desliga o buffer na rota de eventos', () => {
    expect(blocoSse).toMatch(/flush_interval -1/);
  });

  it('casa /v1/projects/:id/events por regexp, pois o matcher path só aceita curinga no fim', () => {
    expect(fonte).toContain('@sse path_regexp ^/v1/projects/[^/]+/events$');
  });

  it('define a rota específica de eventos antes da rota genérica /v1', () => {
    expect(posicao(fonte, 'handle @sse')).toBeLessThan(
      posicao(fonte, 'handle /v1/*'),
    );
  });

  it('não liga o flush no bloco genérico /v1', () => {
    expect(blocoV1).not.toMatch(/flush_interval/);
  });
});

describe('Caddyfile: app web estático (e2e)', () => {
  it('serve o app exportado a partir de uma pasta configurável', () => {
    expect(blocoEstatico).toMatch(/root \* \{\$APP_WEB_ROOT:/);
  });

  it('serve arquivos estáticos', () => {
    expect(blocoEstatico).toMatch(/file_server/);
  });

  it('faz o fallback das rotas do app para o index.html', () => {
    expect(blocoEstatico).toMatch(/try_files/);
    expect(blocoEstatico).toContain('{path}');
    expect(blocoEstatico).toContain('/index.html');
  });

  it('comprime o conteúdo estático', () => {
    expect(blocoEstatico).toMatch(/encode zstd gzip/);
  });

  it('mantém o app como o último handle, para não capturar as rotas da API', () => {
    expect(posicao(fonte, 'handle /v1/*')).toBeLessThan(
      posicao(fonte, 'handle {'),
    );
  });
});
