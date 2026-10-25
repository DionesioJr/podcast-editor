import * as fs from 'fs';
import * as path from 'path';

describe('Scripts de build do Prisma em package.json', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
  );

  it('o postinstall não chama "prisma generate" antes do schema estar compilado', () => {
    expect(packageJson.scripts.postinstall).not.toMatch(/\bprisma generate\b/);
  });

  it('prisma:build compila o schema antes de gerar o Prisma Client', () => {
    const comando: string = packageJson.scripts['prisma:build'];

    expect(comando).toMatch(/build-prisma/);
    expect(comando).toMatch(/\bprisma generate\b/);
    expect(comando.indexOf('build-prisma')).toBeLessThan(comando.indexOf('prisma generate'));
  });

  it('build executa prisma:build antes de compilar o Nest', () => {
    const comando: string = packageJson.scripts.build;

    expect(comando).toMatch(/prisma:build/);
    expect(comando).toMatch(/nest build/);
    expect(comando.indexOf('prisma:build')).toBeLessThan(comando.indexOf('nest build'));
  });
});
