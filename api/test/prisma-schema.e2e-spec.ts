import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

const RAIZ_DA_API = path.resolve(__dirname, '..');

describe('Schema Prisma modular (prova de compilação)', () => {
  it('base.prisma declara o generator e o datasource mysql', () => {
    const base = fs.readFileSync(path.join(RAIZ_DA_API, 'prisma/base.prisma'), 'utf8');

    expect(base).toMatch(/generator\s+client/);
    expect(base).toMatch(/provider\s*=\s*"mysql"/);
  });

  it('existe ao menos um schema de módulo em src/modules/*/prisma', () => {
    const arquivosDeModulo = globSync('src/modules/**/prisma/*.prisma', { cwd: RAIZ_DA_API });

    expect(arquivosDeModulo.length).toBeGreaterThan(0);
  });

  it('nenhum schema de módulo declara generator ou datasource (regra do schema modular)', () => {
    const arquivosDeModulo = globSync('src/modules/**/prisma/*.prisma', { cwd: RAIZ_DA_API });

    for (const arquivo of arquivosDeModulo) {
      const conteudo = fs.readFileSync(path.join(RAIZ_DA_API, arquivo), 'utf8');

      expect(conteudo).not.toMatch(/generator\s+client/);
      expect(conteudo).not.toMatch(/datasource\s+db/);
    }
  });

  it('o módulo projects declara o model projects', () => {
    const conteudo = fs.readFileSync(
      path.join(RAIZ_DA_API, 'src/modules/projects/prisma/projects.prisma'),
      'utf8',
    );

    expect(conteudo).toMatch(/model projects \{/);
  });

  it('schema.prisma compilado contém só um generator e um datasource', () => {
    const schemaCompilado = fs.readFileSync(path.join(RAIZ_DA_API, 'prisma/schema.prisma'), 'utf8');

    const ocorrenciasDeGenerator = schemaCompilado.match(/generator\s+client/g) ?? [];
    const ocorrenciasDeDatasource = schemaCompilado.match(/datasource\s+db/g) ?? [];

    expect(ocorrenciasDeGenerator).toHaveLength(1);
    expect(ocorrenciasDeDatasource).toHaveLength(1);
  });

  it('schema.prisma compilado contém o model projects vindo do módulo', () => {
    const schemaCompilado = fs.readFileSync(path.join(RAIZ_DA_API, 'prisma/schema.prisma'), 'utf8');

    expect(schemaCompilado).toMatch(/model projects \{/);
  });
});
