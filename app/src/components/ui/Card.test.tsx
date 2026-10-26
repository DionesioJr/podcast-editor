import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from './Card';
import { theme } from '@src/constants/theme';

describe('Card', () => {
  it('renderiza o conteúdo filho', () => {
    render(
      <Card>
        <Text>Conteúdo do card</Text>
      </Card>,
    );

    expect(screen.getByText('Conteúdo do card')).toBeTruthy();
  });

  it('usa a variante outlined por padrão, com borda do token do tema', () => {
    const { toJSON } = render(
      <Card>
        <Text>Padrão</Text>
      </Card>,
    );
    const arvore = toJSON();
    const estilo = Array.isArray(arvore.props.style) ? Object.assign({}, ...arvore.props.style) : arvore.props.style;

    expect(estilo.borderWidth).toBe(1);
  });

  it('remove a borda quando a variante é elevated', () => {
    const { toJSON } = render(
      <Card variant="elevated">
        <Text>Elevado</Text>
      </Card>,
    );
    const arvore = toJSON();
    const estilo = Array.isArray(arvore.props.style) ? Object.assign({}, ...arvore.props.style) : arvore.props.style;

    expect(estilo.borderWidth).toBe(0);
    expect(estilo.elevation).toBe(4);
  });

  it('usa o padding do token lg quando padding é lg', () => {
    const { toJSON } = render(
      <Card padding="lg">
        <Text>Grande</Text>
      </Card>,
    );
    const arvore = toJSON();
    const estilo = Array.isArray(arvore.props.style) ? Object.assign({}, ...arvore.props.style) : arvore.props.style;

    expect(estilo.padding).toBe(theme.spacing[6]);
  });
});
