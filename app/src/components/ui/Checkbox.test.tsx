import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('mostra o label recebido', () => {
    render(<Checkbox checked={false} onChange={jest.fn()} label="Aceito os termos" />);

    expect(screen.getByText('Aceito os termos')).toBeTruthy();
  });

  it('chama onChange com o valor invertido ao ser pressionado quando está desmarcado', () => {
    const onChange = jest.fn();
    render(<Checkbox checked={false} onChange={onChange} label="Opção" />);

    fireEvent.press(screen.getByText('Opção'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('chama onChange com o valor invertido ao ser pressionado quando está marcado', () => {
    const onChange = jest.fn();
    render(<Checkbox checked onChange={onChange} label="Opção" />);

    fireEvent.press(screen.getByText('Opção'));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('não chama onChange quando está desabilitado', () => {
    const onChange = jest.fn();
    render(<Checkbox checked={false} onChange={onChange} label="Opção" disabled />);

    fireEvent.press(screen.getByText('Opção'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('não exige label para funcionar', () => {
    const onChange = jest.fn();
    const { toJSON } = render(<Checkbox checked={false} onChange={onChange} />);

    expect(toJSON()).toBeTruthy();
  });
});
