import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ERROR_ACTIONS, ErrorActionType } from '@src/i18n/error-actions';

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

const PROJECT_ID = 'projeto-1';

const ALL_ACTIONS: ErrorActionType[] = [
  'choose_file',
  'wait',
  'retry',
  'continue',
  'discard',
  'retry_later',
  'continue_manually',
  'rewrite',
  'adjust',
  'go_to_review',
  'select_format',
  'download',
  'new_project',
];

const CODE_FOR_ACTION: Record<ErrorActionType, string> = {
  choose_file: 'INVALID_FILE_FORMAT',
  wait: 'UPLOAD_CONNECTION_LOST',
  retry: 'TRANSCRIPTION_FAILED',
  continue: 'NO_SPEECH_DETECTED',
  discard: 'LOW_QUALITY_TRANSCRIPTION',
  retry_later: 'AI_UNAVAILABLE',
  continue_manually: 'AI_ANALYSIS_LIMIT_EXCEEDED',
  rewrite: 'AI_OUT_OF_SCOPE',
  adjust: 'INVALID_TARGET_DURATION',
  go_to_review: 'VIDEO_TOO_SHORT',
  select_format: 'NO_FORMAT_SELECTED',
  download: 'EXPORT_LIMIT_EXCEEDED',
  new_project: 'PROJECT_EXPIRED',
};

const ROUTE_FOR_ACTION: Partial<Record<ErrorActionType, string>> = {
  adjust: `/p/${PROJECT_ID}`,
  go_to_review: `/p/${PROJECT_ID}/review`,
  select_format: `/p/${PROJECT_ID}/export`,
  download: `/p/${PROJECT_ID}/export`,
  new_project: '/',
};

function prenderRouter(canGoBack: boolean) {
  canGoBackMock.mockReturnValue(canGoBack);
  useRouterMock.mockReturnValue({
    replace: replaceMock,
    back: backMock,
    canGoBack: canGoBackMock,
  });
}

function abrirErro(code: string, projectId?: string) {
  useLocalSearchParamsMock.mockReturnValue({ code, projectId });
  render(<ErrorRoute />);
}

function pressionar(type: ErrorActionType) {
  const action = ERROR_ACTIONS[CODE_FOR_ACTION[type]].find(
    (item) => item.type === type,
  );

  if (!action) throw new Error(`Sem ação do tipo ${type} em CODE_FOR_ACTION.`);

  fireEvent.press(screen.getByText(action.label));
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

describe('Mapa de ErrorActionType para rota (PDE-123)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prenderRouter(true);
  });

  it('cobre os 13 tipos de ação da tela de erro', () => {
    expect(Object.keys(CODE_FOR_ACTION).sort()).toEqual([...ALL_ACTIONS].sort());
  });

  it.each(ALL_ACTIONS)('leva %s para o destino declarado no mapa', (type) => {
    abrirErro(CODE_FOR_ACTION[type], PROJECT_ID);

    pressionar(type);

    const route = ROUTE_FOR_ACTION[type];

    if (route) {
      expect(replaceMock).toHaveBeenCalledWith(route);
      expect(backMock).not.toHaveBeenCalled();
      expect(canGoBackMock).not.toHaveBeenCalled();
      return;
    }

    expect(canGoBackMock).toHaveBeenCalledTimes(1);
    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it.each(ALL_ACTIONS.filter((type) => !ROUTE_FOR_ACTION[type]))(
    'usa a tela inicial como fallback de %s quando não há histórico',
    (type) => {
      prenderRouter(false);
      abrirErro(CODE_FOR_ACTION[type], PROJECT_ID);

      pressionar(type);

      expect(backMock).not.toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/');
    },
  );

  it.each(['adjust', 'go_to_review', 'select_format', 'download'] as const)(
    'usa o fallback declarado de %s quando a URL não traz projectId',
    (type) => {
      prenderRouter(false);
      abrirErro(CODE_FOR_ACTION[type]);

      pressionar(type);

      expect(replaceMock).not.toHaveBeenCalledWith(
        expect.stringContaining('undefined'),
      );
      expect(replaceMock).toHaveBeenCalledWith('/');
      expect(backMock).not.toHaveBeenCalled();
    },
  );

  it('leva a ação new_project para a tela inicial mesmo com histórico', () => {
    prenderRouter(true);
    abrirErro('PROJECT_EXPIRED');

    pressionar('new_project');

    expect(replaceMock).toHaveBeenCalledWith('/');
    expect(backMock).not.toHaveBeenCalled();
    expect(canGoBackMock).not.toHaveBeenCalled();
  });
});
