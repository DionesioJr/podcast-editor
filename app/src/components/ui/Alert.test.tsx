import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Alert } from './Alert';
import { theme } from '@src/constants/theme';

describe('Alert', () => {
  it('mostra a mensagem recebida', () => {
    render(<Alert message="Algo deu errado" />);

    expect(screen.getByText('Algo deu errado')).toBeTruthy();
  });

  it('mostra o título quando informado', () => {
    render(<Alert title="Atenção" message="Verifique o arquivo" />);

    expect(screen.getByText('Atenção')).toBeTruthy();
  });

  it('não mostra título quando não é informado', () => {
    render(<Alert message="Sem título" />);

    expect(screen.queryByText('Atenção')).toBeNull();
  });

  it('mostra o ícone quando informado', () => {
    render(<Alert message="Com ícone" icon={<Text>icone</Text>} />);

    expect(screen.getByText('icone')).toBeTruthy();
  });

  it('usa a cor de texto do token de alerta de acordo com o tipo', () => {
    render(<Alert type="danger" message="Erro crítico" />);
    const mensagem = screen.getByText('Erro crítico');
    const estilo = Array.isArray(mensagem.props.style)
      ? Object.assign({}, ...mensagem.props.style)
      : mensagem.props.style;

    expect(estilo.color).toBe(theme.colors.alert.danger.text);
  });

  it('usa o tipo info como padrão quando type não é informado', () => {
    render(<Alert message="Padrão" />);
    const mensagem = screen.getByText('Padrão');
    const estilo = Array.isArray(mensagem.props.style)
      ? Object.assign({}, ...mensagem.props.style)
      : mensagem.props.style;

    expect(estilo.color).toBe(theme.colors.alert.info.text);
  });
});
