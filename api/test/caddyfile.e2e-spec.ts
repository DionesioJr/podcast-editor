import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const RAIZ_DA_API = path.resolve(__dirname, '..');
const CAMINHO_CADDYFILE = path.join(RAIZ_DA_API, 'Caddyfile');
const CAMINHO_DEPLOY = path.join(RAIZ_DA_API, 'deploy.sh');

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

  it('não usa o matcher path com curinga no meio do caminho, que o Caddy não aceita', () => {
    expect(fonte).not.toMatch(/path\s+\/v1\/projects\/\*/);
  });

  it('casa os caminhos reais de eventos e recusa os caminhos parecidos', () => {
    const definicao = fonte.match(/@sse\s+path_regexp\s+(\S+)/);

    if (!definicao) {
      throw new Error('Matcher @sse com path_regexp não encontrado no Caddyfile');
    }

    const padrao = new RegExp(definicao[1]);

    expect(padrao.test('/v1/projects/abc/events')).toBe(true);
    expect(padrao.test('/v1/projects/123e4567-e89b/events')).toBe(true);
    expect(padrao.test('/v1/projects/abc/events/extra')).toBe(false);
    expect(padrao.test('/v1/projects/abc/events2')).toBe(false);
    expect(padrao.test('/v1/projects/events')).toBe(false);
    expect(padrao.test('/v1/other/abc/events')).toBe(false);
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

  it('aponta para app/dist, o mesmo destino que o deploy.sh exporta', () => {
    const deploy = fs.readFileSync(CAMINHO_DEPLOY, 'utf8');

    expect(deploy).toMatch(/APP_DIR="\$REPO_DIR\/app"/);
    expect(deploy).toMatch(/expo export -p web --output-dir dist/);
    expect(blocoEstatico).toMatch(/\{\$APP_WEB_ROOT:[^}]*\/app\/dist\}/);
  });
});

interface ResultadoDeComando {
  status: number | null;
  stdout: string;
  stderr: string;
}

function temCaddy(): boolean {
  const resultado = spawnSync('caddy', ['version'], { encoding: 'utf8' });

  return resultado.error === undefined && resultado.status === 0;
}

const CADDY_DISPONIVEL = temCaddy();

// Quando o binário do Caddy não existe, a checagem de sintaxe é pulada com
// aviso: o ambiente de testes não instala o Caddy, a VPS sim.
function descreverComCaddy(nome: string, definir: () => void): void {
  if (CADDY_DISPONIVEL) {
    describe(nome, definir);
  } else {
    describe.skip(`${nome} (pulado: o binário caddy não está instalado neste ambiente)`, definir);
  }
}

function validarCaddy(caminho: string): ResultadoDeComando {
  const resultado = spawnSync('caddy', ['validate', '--config', caminho], {
    encoding: 'utf8',
    env: {
      ...process.env,
      DOMAIN: 'localhost',
      API_UPSTREAM: '127.0.0.1:3000',
      APP_WEB_ROOT: path.resolve(RAIZ_DA_API, '..', 'app', 'dist'),
    },
  });

  return {
    status: resultado.status,
    stdout: resultado.stdout ?? '',
    stderr: resultado.stderr ?? '',
  };
}

descreverComCaddy('Caddyfile: validação com o binário caddy (execução real)', () => {
  it('é aceito pelo caddy validate', () => {
    const resultado = validarCaddy(CAMINHO_CADDYFILE);

    if (resultado.status !== 0) {
      throw new Error(
        `caddy validate reprovou api/Caddyfile:\n${resultado.stdout}\n${resultado.stderr}`,
      );
    }
  });

  it('o caddy validate reprova o matcher antigo com curinga no meio do caminho', () => {
    const caminhoInvalido = path.join(
      os.tmpdir(),
      `Caddyfile.invalido.${process.pid}.${Date.now()}`,
    );
    const conteudoInvalido = fonte.replace(
      '@sse path_regexp ^/v1/projects/[^/]+/events$',
      '@sse path /v1/projects/*/events',
    );

    expect(conteudoInvalido).not.toBe(fonte);
    fs.writeFileSync(caminhoInvalido, conteudoInvalido);

    try {
      const resultado = validarCaddy(caminhoInvalido);

      expect(resultado.status).not.toBe(0);
    } finally {
      fs.rmSync(caminhoInvalido, { force: true });
    }
  });
});
