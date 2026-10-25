import fs from 'fs';
import path from 'path';

import RootLayout from './_layout';
import Index from './index';

const PASTA_ROTAS = __dirname;

function listarArquivosDeRota(): string[] {
  return fs
    .readdirSync(PASTA_ROTAS)
    .filter((nome) => /\.(ts|tsx)$/.test(nome))
    .filter((nome) => !/\.test\.(ts|tsx)$/.test(nome));
}

describe('Rotas do Expo Router (PDE-6)', () => {
  it('a rota inicial exporta um componente', () => {
    expect(typeof Index).toBe('function');
  });

  it('o layout raiz exporta um componente', () => {
    expect(typeof RootLayout).toBe('function');
  });

  it('nenhuma rota importa lógica de negócio de src/modules', () => {
    const padraoProibido = /from\s+['"](?:@src\/modules|@\/src\/modules|\.{1,2}\/.*src\/modules)/;

    for (const arquivo of listarArquivosDeRota()) {
      const conteudo = fs.readFileSync(path.join(PASTA_ROTAS, arquivo), 'utf-8');
      expect(padraoProibido.test(conteudo)).toBe(false);
    }
  });
});
