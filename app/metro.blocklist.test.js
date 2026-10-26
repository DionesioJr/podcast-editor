const config = require('./metro.config');

const blockList = config.resolver.blockList;

function estaBloqueado(filename) {
  return blockList.some((pattern) => pattern.test(filename));
}

describe('resolver.blockList do Metro (PDE-108): casos de borda', () => {
  it('é um array composto só por expressões regulares', () => {
    expect(Array.isArray(blockList)).toBe(true);
    expect(blockList.length).toBeGreaterThan(0);

    for (const pattern of blockList) {
      expect(pattern).toBeInstanceOf(RegExp);
    }
  });

  it('bloqueia arquivo de teste em subpasta aninhada dentro de app/app/', () => {
    expect(estaBloqueado('app/app/auth/login.test.tsx')).toBe(true);
    expect(estaBloqueado('app/app/(tabs)/editor/clipe.spec.ts')).toBe(true);
  });

  it('bloqueia caminho absoluto com separador do Windows', () => {
    expect(estaBloqueado('C:\\projeto\\app\\app\\exemplo.test.tsx')).toBe(true);
  });

  it('não bloqueia arquivo cujo nome só contém a palavra "test" sem o padrão de extensão', () => {
    expect(estaBloqueado('app/app/testes-de-upload.tsx')).toBe(false);
    expect(estaBloqueado('app/app/atestado.ts')).toBe(false);
    expect(estaBloqueado('app/app/contestacao.tsx')).toBe(false);
  });

  it('não bloqueia arquivo cujo nome só contém a palavra "spec" sem o padrão de extensão', () => {
    expect(estaBloqueado('app/app/especificacao.tsx')).toBe(false);
    expect(estaBloqueado('app/app/inspecao.ts')).toBe(false);
  });

  it('não bloqueia arquivo com extensão diferente de .test. ou .spec. mesmo contendo um ponto antes', () => {
    expect(estaBloqueado('app/app/upload.testing.tsx')).toBe(false);
    expect(estaBloqueado('app/app/upload.e2e.tsx')).toBe(false);
    expect(estaBloqueado('app/app/upload.stories.tsx')).toBe(false);
  });

  it('bloqueia os 8 padrões de teste e spec combinando .test/.spec com js/jsx/ts/tsx', () => {
    const extensoes = ['test.ts', 'test.tsx', 'test.js', 'test.jsx', 'spec.ts', 'spec.tsx', 'spec.js', 'spec.jsx'];

    for (const extensao of extensoes) {
      expect(estaBloqueado(`app/app/exemplo.${extensao}`)).toBe(true);
    }
  });

  it('não bloqueia rotas legítimas do Expo Router dentro de app/app/', () => {
    expect(estaBloqueado('app/app/index.tsx')).toBe(false);
    expect(estaBloqueado('app/app/_layout.tsx')).toBe(false);
    expect(estaBloqueado('app/app/[id].tsx')).toBe(false);
    expect(estaBloqueado('app/app/(tabs)/editor.tsx')).toBe(false);
  });
});
