const config = require('./metro.config');

describe('metro.config.js resolver.blockList', () => {
  const blockList = config.resolver.blockList;

  it('bloqueia arquivos .test.ts dentro de app/app/', () => {
    const filename = 'app/app/exemplo.test.ts';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('bloqueia arquivos .test.tsx dentro de app/app/', () => {
    const filename = 'app/app/exemplo.test.tsx';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('bloqueia arquivos .test.js dentro de app/app/', () => {
    const filename = 'app/app/exemplo.test.js';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('bloqueia arquivos .test.jsx dentro de app/app/', () => {
    const filename = 'app/app/exemplo.test.jsx';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('bloqueia arquivos .spec.ts dentro de app/app/', () => {
    const filename = 'app/app/exemplo.spec.ts';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('bloqueia arquivos .spec.tsx dentro de app/app/', () => {
    const filename = 'app/app/exemplo.spec.tsx';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('bloqueia arquivos .spec.js dentro de app/app/', () => {
    const filename = 'app/app/exemplo.spec.js';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('bloqueia arquivos .spec.jsx dentro de app/app/', () => {
    const filename = 'app/app/exemplo.spec.jsx';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(true);
  });

  it('não bloqueia arquivo index.tsx dentro de app/app/', () => {
    const filename = 'app/app/index.tsx';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(false);
  });

  it('não bloqueia arquivo _layout.tsx dentro de app/app/', () => {
    const filename = 'app/app/_layout.tsx';
    const isBlocked = blockList.some((pattern) => pattern.test(filename));

    expect(isBlocked).toBe(false);
  });

  it('mantém os aliases @ e @src resolvendo no Metro', () => {
    expect(config.resolver.extraNodeModules).toHaveProperty('@');
    expect(config.resolver.extraNodeModules).toHaveProperty('@src');
  });
});
