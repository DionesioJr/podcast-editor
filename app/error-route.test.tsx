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

// Um code por tipo. Como os mapas são tipados como Record<ErrorActionType, ...>,
// um 14º tipo em app/src/i18n/error-actions.ts quebra este arquivo em
// compilação, em vez de deixar a suíte passar sem cobrir o destino do tipo novo.
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

// Destino esperado de cada tipo. null marca o fallback de voltar declarado no
// mapa de produção de app/app/error.tsx. Tipar como Record garante que os 13
// tipos da união estão declarados aqui, com a rota ou com o fallback.
const ROUTE_FOR_ACTION: Record<ErrorActionType, string | null> = {
  choose_file: null,
  wait: null,
  retry: null,
  continue: null,
  discard: null,
  retry_later: null,
  continue_manually: null,
  rewrite: null,
  adjust: `/p/${PROJECT_ID}`,
  go_to_review: `/p/${PROJECT_ID}/review`,
  select_format: `/p/${PROJECT_ID}/export`,
  download: `/p/${PROJECT_ID}/export`,
  new_project: '/',
};

const ALL_ACTIONS = Object.keys(ROUTE_FOR_ACTION) as ErrorActionType[];
const ROUTE_ACTIONS = ALL_ACTIONS.filter(
  (type) => ROUTE_FOR_ACTION[type] !== null,
);
const FALLBACK_ACTIONS = ALL_ACTIONS.filter(
  (type) => ROUTE_FOR_ACTION[type] === null,
);
const PROJECT_ACTIONS: ErrorActionType[] = [
  'adjust',
  'go_to_review',
  'select_format',
  'download',
];

// Tipos realmente usados por error-actions.ts em tempo de execução. Comparar
// com ALL_ACTIONS ancora a cobertura na fonte, não numa lista escrita à mão.
const SOURCE_ACTIONS = Array.from(
  new Set(
    Object.values(ERROR_ACTIONS).flatMap((actions) =>
      actions.map((action) => action.type),
    ),
  ),
).sort();

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

function preparar(
  type: ErrorActionType,
  opcoes: { canGoBack: boolean; projectId?: string },
) {
  prenderRouter(opcoes.canGoBack);
  abrirErro(CODE_FOR_ACTION[type], opcoes.projectId);
}

function acaoDoTipo(type: ErrorActionType) {
  const code = CODE_FOR_ACTION[type];
  const action = ERROR_ACTIONS[code]?.find((item) => item.type === type);

  if (!action) {
    throw new Error(`O code ${code} não oferece a ação do tipo ${type}.`);
  }

  return action;
}

function pressionar(type: ErrorActionType) {
  fireEvent.press(screen.getByText(acaoDoTipo(type).label));
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

  it('cobre exatamente os tipos que error-actions.ts usa', () => {
    expect(SOURCE_ACTIONS).toEqual([...ALL_ACTIONS].sort());
  });

  it.each(ALL_ACTIONS)(
    'o code declarado para %s realmente oferece esse tipo',
    (type) => {
      const code = CODE_FOR_ACTION[type];

      expect(ERROR_ACTIONS[code]).toBeDefined();
      expect(ERROR_ACTIONS[code].some((action) => action.type === type)).toBe(
        true,
      );
      expect(acaoDoTipo(type).type).toBe(type);
    },
  );

  it.each(ALL_ACTIONS)('leva %s para o destino declarado no mapa', (type) => {
    preparar(type, { canGoBack: true, projectId: PROJECT_ID });

    pressionar(type);

    const route = ROUTE_FOR_ACTION[type];

    if (route) {
      expect(replaceMock).toHaveBeenCalledWith(route);
      expect(backMock).not.toHaveBeenCalled();
      expect(canGoBackMock).not.toHaveBeenCalled();
      return;
    }

    expect(backMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it.each(ROUTE_ACTIONS)(
    'não deixa %s cair em router.back genérico',
    (type) => {
      preparar(type, { canGoBack: true, projectId: PROJECT_ID });

      pressionar(type);

      expect(backMock).not.toHaveBeenCalled();
    },
  );

  it.each(FALLBACK_ACTIONS)(
    'usa a tela inicial como fallback de %s quando não há histórico',
    (type) => {
      preparar(type, { canGoBack: false, projectId: PROJECT_ID });

      pressionar(type);

      expect(backMock).not.toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/');
    },
  );

  it.each(PROJECT_ACTIONS)(
    'usa o fallback declarado de %s quando a URL não traz projectId',
    (type) => {
      preparar(type, { canGoBack: false });

      pressionar(type);

      expect(replaceMock).not.toHaveBeenCalledWith(
        expect.stringContaining('undefined'),
      );
      expect(replaceMock).toHaveBeenCalledWith('/');
      expect(backMock).not.toHaveBeenCalled();
    },
  );

  it('leva new_project para a tela inicial mesmo com histórico', () => {
    preparar('new_project', { canGoBack: true });

    pressionar('new_project');

    expect(replaceMock).toHaveBeenCalledWith('/');
    expect(backMock).not.toHaveBeenCalled();
    expect(canGoBackMock).not.toHaveBeenCalled();
  });

  it('leva new_project para a tela inicial mesmo sem histórico', () => {
    preparar('new_project', { canGoBack: false });

    pressionar('new_project');

    expect(replaceMock).toHaveBeenCalledWith('/');
    expect(backMock).not.toHaveBeenCalled();
  });
});
