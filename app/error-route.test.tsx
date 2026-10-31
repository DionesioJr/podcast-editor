import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const replaceMock = jest.fn();
const backMock = jest.fn();
const canGoBackMock = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

import { useLocalSearchParams, useRouter } from 'expo-router';
import ErrorRoute from './app/error';

const useLocalSearchParamsMock = useLocalSearchParams as unknown as jest.Mock;
const useRouterMock = useRouter as unknown as jest.Mock;

function prenderRouter(canGoBack: boolean) {
  canGoBackMock.mockReturnValue(canGoBack);
  useRouterMock.mockReturnValue({
    replace: replaceMock,
    back: backMock,
    canGoBack: canGoBackMock,
  });
}

describe('Rota de erro /error (PDE-101)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prenderRouter(true);
  });

  it('mostra a mensagem do code recebido na URL', () => {
    useLocalSearchParamsMock.mockReturnValue({ code: 'PROJECT_EXPIRED' });

    render(<ErrorRoute />);

    expect(
      screen.getByText(
        'Este projeto expirou e foi apagado para proteger sua privacidade.',
      ),
    ).toBeTruthy();
  });

  it('usa SERVER_ERROR quando a URL não traz code', () => {
    useLocalSearchParamsMock.mockReturnValue({});

    render(<ErrorRoute />);

    expect(
      screen.getByText('Erro no servidor. Tente novamente mais tarde.'),
    ).toBeTruthy();
  });

  it('mostra o title recebido na URL', () => {
    useLocalSearchParamsMock.mockReturnValue({
      code: 'SERVER_ERROR',
      title: 'Falha no servidor',
    });

    render(<ErrorRoute />);

    expect(screen.getByText('Falha no servidor')).toBeTruthy();
  });

  it('leva para a tela inicial na ação new_project', () => {
    useLocalSearchParamsMock.mockReturnValue({ code: 'PROJECT_EXPIRED' });

    render(<ErrorRoute />);
    fireEvent.press(screen.getByText('Começar novo projeto'));

    expect(replaceMock).toHaveBeenCalledWith('/');
    expect(backMock).not.toHaveBeenCalled();
    expect(canGoBackMock).not.toHaveBeenCalled();
  });

  it('volta na ação de tentar novamente quando há histórico', () => {
    prenderRouter(true);
    useLocalSearchParamsMock.mockReturnValue({ code: 'TRANSCRIPTION_FAILED' });

    render(<ErrorRoute />);
    fireEvent.press(screen.getByText('Tentar novamente'));

    expect(canGoBackMock).toHaveBeenCalledTimes(1);
    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('cai na tela inicial quando não há histórico para voltar', () => {
    prenderRouter(false);
    useLocalSearchParamsMock.mockReturnValue({ code: 'TRANSCRIPTION_FAILED' });

    render(<ErrorRoute />);
    fireEvent.press(screen.getByText('Tentar novamente'));

    expect(backMock).not.toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith('/');
  });

  it('renderiza todos os botões das ações do code da URL', () => {
    useLocalSearchParamsMock.mockReturnValue({
      code: 'UPLOAD_CONNECTION_LOST',
    });

    render(<ErrorRoute />);

    expect(screen.getByText('Aguardar')).toBeTruthy();
    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });

  it('não chama replace nem back para code desconhecido sem ação', () => {
    useLocalSearchParamsMock.mockReturnValue({ code: 'CODIGO_QUE_NAO_EXISTE' });

    render(<ErrorRoute />);

    expect(screen.getByText('Erro desconhecido.')).toBeTruthy();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(backMock).not.toHaveBeenCalled();
  });

  it.each(['toString', 'constructor', 'valueOf', '__proto__'])(
    'trata o code herdado %s sem quebrar a tela',
    (code) => {
      useLocalSearchParamsMock.mockReturnValue({ code });

      render(<ErrorRoute />);

      expect(screen.getByText('Erro desconhecido.')).toBeTruthy();
      expect(screen.queryByText('Tentar novamente')).toBeNull();
      expect(screen.queryByText('Escolher outro arquivo')).toBeNull();
    },
  );
});
