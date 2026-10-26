import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Header } from './Header';

describe('Header', () => {
  it('mostra o nome do app recebido', () => {
    render(<Header appName="Podcast Editor" />);

    expect(screen.getByText('Podcast Editor')).toBeTruthy();
  });

  it('não mostra nome de arquivo nem ações quando showFileName é falso', () => {
    render(<Header appName="Editor" fileName="aula.mp4" showFileName={false} />);

    expect(screen.queryByText('aula.mp4')).toBeNull();
    expect(screen.queryByText('Descartar')).toBeNull();
  });

  it('mostra o nome do arquivo e as ações quando showFileName é verdadeiro', () => {
    render(<Header appName="Editor" fileName="aula.mp4" showFileName />);

    expect(screen.getByText('aula.mp4')).toBeTruthy();
    expect(screen.getByText('Descartar')).toBeTruthy();
  });

  it('não mostra o nome do arquivo quando showFileName é verdadeiro mas fileName não foi informado', () => {
    render(<Header appName="Editor" showFileName />);

    expect(screen.queryByText('aula.mp4')).toBeNull();
    expect(screen.getByText('Descartar')).toBeTruthy();
  });

  it('chama onDiscardPress ao pressionar Descartar', () => {
    const onDiscardPress = jest.fn();
    render(<Header fileName="aula.mp4" showFileName onDiscardPress={onDiscardPress} />);

    fireEvent.press(screen.getByText('Descartar'));

    expect(onDiscardPress).toHaveBeenCalledTimes(1);
  });

  it('usa "Editor" como nome padrão do app quando appName não é informado', () => {
    render(<Header />);

    expect(screen.getByText('Editor')).toBeTruthy();
  });
});
