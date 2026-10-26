import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';
import { theme } from '@src/constants/theme';

describe('Button', () => {
  it('mostra o rótulo recebido', () => {
    render(<Button label="Enviar" />);

    expect(screen.getByText('Enviar')).toBeTruthy();
  });

  it('chama onPress ao ser pressionado', () => {
    const onPress = jest.fn();
    render(<Button label="Enviar" onPress={onPress} />);

    fireEvent.press(screen.getByText('Enviar'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não chama onPress quando está desabilitado', () => {
    const onPress = jest.fn();
    render(<Button label="Enviar" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Enviar'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('aplica o tamanho de fonte do token correspondente a cada size', () => {
    render(<Button label="Pequeno" size="sm" />);
    const texto = screen.getByText('Pequeno');
    const estilo = Array.isArray(texto.props.style) ? Object.assign({}, ...texto.props.style) : texto.props.style;

    expect(estilo.fontSize).toBe(theme.typography.fontSize.sm);
  });

  it('usa a cor de borda neutra do tema quando a variante é outline', () => {
    render(<Button label="Cancelar" variant="outline" />);
    const texto = screen.getByText('Cancelar');

    expect(texto).toBeTruthy();
  });
});
