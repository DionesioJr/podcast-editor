import fs from 'fs';
import path from 'path';

import { renderRouter, screen } from 'expo-router/testing-library';

const PASTA_ROTAS = path.join(__dirname, 'app');

describe('Rota inicial (PDE-6)', () => {
  it('mostra o texto da tela inicial e resolve a rota "/" ao abrir o app', async () => {
    const router = renderRouter('./app', { initialUrl: '/' });

    expect(await screen.findByText('Podcast Editor')).toBeTruthy();
    expect(router.getPathname()).toBe('/');
  });
});

describe('Entrypoints de rota (PDE-6)', () => {
  it('nenhuma rota importa lógica de negócio de src/modules', () => {
    const padraoProibido = /from\s+['"](?:@src\/modules|@\/src\/modules|\.{1,2}\/.*src\/modules)/;
    const arquivos = fs.readdirSync(PASTA_ROTAS).filter((nome) => /\.(ts|tsx)$/.test(nome));

    for (const arquivo of arquivos) {
      const conteudo = fs.readFileSync(path.join(PASTA_ROTAS, arquivo), 'utf-8');
      expect(padraoProibido.test(conteudo)).toBe(false);
    }
  });

  it('o layout raiz só repassa a rota ativa (Slot), sem lógica própria', () => {
    const conteudo = fs.readFileSync(path.join(PASTA_ROTAS, '_layout.tsx'), 'utf-8');

    expect(conteudo).toMatch(/<Slot\s*\/>/);
    expect(conteudo).not.toMatch(/use(State|Effect|Memo|Callback)/);
  });

  it('não existe arquivo de teste dentro da pasta de rotas (o Expo Router trataria o arquivo como uma rota real)', () => {
    const arquivos = fs.readdirSync(PASTA_ROTAS);
    const arquivoDeTeste = arquivos.filter((nome) => /\.(test|spec)\.[tj]sx?$/.test(nome));

    expect(arquivoDeTeste).toEqual([]);
  });
});
