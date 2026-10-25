import { renderHook, act } from '@testing-library/react-native';
import { Dimensions, type EmitterSubscription } from 'react-native';
import { useBreakpoint, useIsMobile, useIsNarrow } from './use-breakpoint';

function criarSubscriptionFalsa(remove: () => void): EmitterSubscription {
  return { remove } as unknown as EmitterSubscription;
}

describe('useBreakpoint (PDE-7)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('considera mobile uma largura bem menor que o limite de 560px', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isNarrow).toBe(true);
    expect(result.current.width).toBe(400);
    expect(result.current.height).toBe(800);
  });

  it('considera exatamente 560px como mobile (limite inclusivo)', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 560, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(true);
  });

  it('não considera mobile uma largura de tablet, mas considera narrow', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 700, height: 1000, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isNarrow).toBe(true);
  });

  it('considera exatamente 840px como narrow (limite inclusivo)', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 840, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isNarrow).toBe(true);
  });

  it('não considera mobile nem narrow uma largura de desktop acima de 840px', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isNarrow).toBe(false);
  });

  it('atualiza as dimensões quando o evento de mudança é disparado', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });
    let handler: ((event: { window: { width: number; height: number } }) => void) | undefined;
    jest.spyOn(Dimensions, 'addEventListener').mockImplementation((_event, callback) => {
      handler = callback as typeof handler;
      return criarSubscriptionFalsa(jest.fn());
    });

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.isMobile).toBe(false);

    act(() => {
      handler?.({ window: { width: 400, height: 900 } });
    });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.width).toBe(400);
    expect(result.current.height).toBe(900);
  });

  it('remove o listener de dimensão ao desmontar', () => {
    const remove = jest.fn();
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });
    jest.spyOn(Dimensions, 'addEventListener').mockReturnValue(criarSubscriptionFalsa(remove));

    const { unmount } = renderHook(() => useBreakpoint());
    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe('useIsMobile (PDE-7)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('expõe só o booleano isMobile', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('retorna false para largura de desktop', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });
});

describe('useIsNarrow (PDE-7)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('expõe só o booleano isNarrow', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 700, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useIsNarrow());

    expect(result.current).toBe(true);
  });

  it('retorna false para largura de desktop', () => {
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1200, height: 800, scale: 1, fontScale: 1 });

    const { result } = renderHook(() => useIsNarrow());

    expect(result.current).toBe(false);
  });
});
