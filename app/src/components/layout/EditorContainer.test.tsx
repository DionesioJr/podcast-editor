import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, Dimensions } from 'react-native';
import { EditorContainer } from './EditorContainer';
import { theme } from '@src/constants/theme';

function definirLarguraDaJanela(width: number) {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height: 800, scale: 1, fontScale: 1 });
}

describe('EditorContainer', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renderiza o conteúdo filho', () => {
    render(
      <EditorContainer>
        <Text>Conteúdo</Text>
      </EditorContainer>,
    );

    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });

  it('renderiza o cabeçalho quando informado', () => {
    render(
      <EditorContainer header={<Text>Cabeçalho</Text>}>
        <Text>Conteúdo</Text>
      </EditorContainer>,
    );

    expect(screen.getByText('Cabeçalho')).toBeTruthy();
  });

  it('não renderiza a área de cabeçalho quando header não é informado', () => {
    render(
      <EditorContainer>
        <Text>Conteúdo</Text>
      </EditorContainer>,
    );

    expect(screen.queryByText('Cabeçalho')).toBeNull();
  });

  it('usa o espaçamento mobile do token quando a largura da tela é estreita', () => {
    definirLarguraDaJanela(400);

    const { toJSON } = render(
      <EditorContainer>
        <Text>Conteúdo</Text>
      </EditorContainer>,
    );
    const arvore = toJSON();
    const conteudo = arvore.children[0].children[0];
    const estilo = Array.isArray(conteudo.props.style)
      ? Object.assign({}, ...conteudo.props.style)
      : conteudo.props.style;

    expect(estilo.paddingHorizontal).toBe(theme.spacing[4]);
  });

  it('usa o espaçamento de tela larga do token quando a largura ultrapassa o breakpoint mobile', () => {
    definirLarguraDaJanela(1024);

    const { toJSON } = render(
      <EditorContainer>
        <Text>Conteúdo</Text>
      </EditorContainer>,
    );
    const arvore = toJSON();
    const conteudo = arvore.children[0].children[0];
    const estilo = Array.isArray(conteudo.props.style)
      ? Object.assign({}, ...conteudo.props.style)
      : conteudo.props.style;

    expect(estilo.paddingHorizontal).toBe(theme.spacing[7]);
  });
});
