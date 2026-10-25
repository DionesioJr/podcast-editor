import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import { usePalette } from './use-palette';
import { colors } from '@src/constants/theme';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  return {
    ...actual,
    useColorScheme: jest.fn(),
  };
});

describe('usePalette (PDE-7)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('usa a paleta clara quando o esquema do sistema é light', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const { result } = renderHook(() => usePalette());

    expect(result.current.background).toBe(colors.background);
    expect(result.current.text.primary).toBe(colors.text.primary);
    expect(result.current.text.secondary).toBe(colors.text.secondary);
    expect(result.current.text.tertiary).toBe(colors.text.tertiary);
  });

  it('cai na paleta clara quando o sistema não informa esquema', () => {
    (useColorScheme as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => usePalette());

    expect(result.current.background).toBe(colors.background);
    expect(result.current.text.primary).toBe(colors.text.primary);
  });

  it('inverte background e texto quando o esquema do sistema é dark', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() => usePalette());

    expect(result.current.background).toBe(colors.dark);
    expect(result.current.text.primary).toBe(colors.light);
    expect(result.current.text.secondary).toBe(colors.text.tertiary);
    expect(result.current.text.tertiary).toBe(colors.text.secondary);
  });

  it('mantém as cores de marca iguais nos dois temas', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() => usePalette());

    expect(result.current.primary).toBe(colors.primary);
    expect(result.current.accent).toBe(colors.accent);
    expect(result.current.danger).toBe(colors.danger);
  });

  it('respeita o parâmetro scheme explícito mesmo quando o sistema diverge', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const { result } = renderHook(() => usePalette('dark'));

    expect(result.current.background).toBe(colors.dark);
    expect(result.current.text.primary).toBe(colors.light);
  });

  it('respeita o parâmetro scheme explícito light mesmo quando o sistema é dark', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const { result } = renderHook(() => usePalette('light'));

    expect(result.current.background).toBe(colors.background);
    expect(result.current.text.primary).toBe(colors.text.primary);
  });
});
