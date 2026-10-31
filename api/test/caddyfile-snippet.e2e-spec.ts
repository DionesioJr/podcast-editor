import {
  FLUSH_SEM_BUFFER,
  HANDLES_DA_API,
  IMPORT_DO_SNIPPET,
  UPSTREAM_LITERAL,
  blocosDosHandlesDaApi,
  lerFonteDoCaddyfile,
  ocorrencias,
  problemasDoUpstreamReutilizavel,
  separarBlocos,
  snippetAntesDoUso,
} from './support/caddyfile-harness';

const fonte = lerFonteDoCaddyfile();

function acusarProblema(origem: string, esperado: string): void {
  expect(problemasDoUpstreamReutilizavel(origem)).toContain(esperado);
}

describe('Caddyfile: snippet de upstream reutilizável (PDE-121) (e2e)', () => {
  it('define um único snippet (api_upstream) antes do primeiro import', () => {
    const blocos = separarBlocos(fonte);

    expect(blocos.snippet).toBeDefined();
    expect(blocos.snippet).toContain(UPSTREAM_LITERAL);
    expect(ocorrencias(fonte, '(api_upstream)')).toBe(1);
    expect(snippetAntesDoUso(fonte)).toBe(true);
  });

  it('não deixa o flush_interval -1 dentro do snippet reutilizável', () => {
    expect(separarBlocos(fonte).snippet).not.toMatch(/flush_interval/);
  });

  it('importa o snippet nos quatro handles da API sem repetir o reverse_proxy literal', () => {
    const porHandle = blocosDosHandlesDaApi(separarBlocos(fonte));

    for (const nome of HANDLES_DA_API) {
      const blocoDoHandle = porHandle[nome];

      expect(blocoDoHandle).toBeDefined();
      expect(blocoDoHandle).toContain(IMPORT_DO_SNIPPET);
      expect(blocoDoHandle).not.toContain('reverse_proxy');
    }
  });

  it('mantém o flush_interval -1 exclusivamente no handle @sse', () => {
    expect(separarBlocos(fonte).sse).toContain(FLUSH_SEM_BUFFER);
    expect(ocorrencias(fonte, FLUSH_SEM_BUFFER)).toBe(1);
  });

  it('não acusa nenhum problema no Caddyfile entregue', () => {
    expect(problemasDoUpstreamReutilizavel(fonte)).toEqual([]);
  });
});

describe('Caddyfile: o verificador detecta regressões no snippet (PDE-121) (e2e)', () => {
  it('acusa o snippet ausente', () => {
    const mutado = fonte.replace(/\(api_upstream\)\s*\{[\s\S]*?\n\}/, '');

    expect(mutado).not.toBe(fonte);
    acusarProblema(mutado, 'snippet (api_upstream) não definido');
  });

  it('acusa o snippet definido depois do primeiro import', () => {
    const foraDeOrdem = [
      'handle /v1 {',
      `\t${IMPORT_DO_SNIPPET}`,
      '}',
      '',
      '(api_upstream) {',
      `\t${UPSTREAM_LITERAL}`,
      '}',
      '',
      '{$DOMAIN:localhost} {',
      '}',
    ].join('\n');

    expect(snippetAntesDoUso(foraDeOrdem)).toBe(false);
    acusarProblema(
      foraDeOrdem,
      'snippet (api_upstream) não é definido antes do primeiro import',
    );
  });

  it('acusa o flush_interval -1 vazando para dentro do snippet', () => {
    const mutado = fonte.replace(
      '(api_upstream) {',
      `(api_upstream) {\n\t${FLUSH_SEM_BUFFER}`,
    );

    expect(mutado).not.toBe(fonte);
    acusarProblema(
      mutado,
      'snippet (api_upstream) carrega flush_interval, que deve ficar só no handle @sse',
    );
  });

  it('acusa um handle que volta a repetir o reverse_proxy literal', () => {
    const ultimoImport = fonte.lastIndexOf(IMPORT_DO_SNIPPET);
    const mutado =
      fonte.slice(0, ultimoImport) +
      UPSTREAM_LITERAL +
      fonte.slice(ultimoImport + IMPORT_DO_SNIPPET.length);

    expect(mutado).not.toBe(fonte);
    acusarProblema(mutado, 'handle /health não importa o snippet do upstream');
    acusarProblema(
      mutado,
      'handle /health repete o reverse_proxy literal em vez de usar o snippet',
    );
  });

  it('acusa o flush_interval -1 fora do handle @sse', () => {
    const mutado = fonte.replace(
      IMPORT_DO_SNIPPET,
      `${IMPORT_DO_SNIPPET}\n\t\t${FLUSH_SEM_BUFFER}`,
    );

    expect(mutado).not.toBe(fonte);
    acusarProblema(mutado, 'flush_interval -1 aparece 2 vez(es)');
  });

  it('acusa o handle @sse sem o flush_interval -1', () => {
    const mutado = fonte.replace(FLUSH_SEM_BUFFER, '');

    expect(mutado).not.toBe(fonte);
    acusarProblema(
      mutado,
      'handle @sse perdeu o flush_interval -1 (streaming sem buffer)',
    );
  });

  it('acusa os quatro handles quando nenhum importa o snippet', () => {
    const mutado = fonte.replace(
      new RegExp(IMPORT_DO_SNIPPET, 'g'),
      UPSTREAM_LITERAL,
    );
    const problemas = problemasDoUpstreamReutilizavel(mutado).filter((problema) =>
      problema.endsWith('não importa o snippet do upstream'),
    );

    expect(mutado).not.toBe(fonte);
    expect(problemas).toHaveLength(HANDLES_DA_API.length);
  });
});
