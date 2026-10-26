import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import {
  CoreProvider,
  useColorScheme,
  useTheme,
} from './CoreProvider';
import { theme } from '@src/constants/theme';

describe('CoreProvider (PDE-8)', () => {
  it('renderiza os filhos normalmente', () => {
    render(
      <CoreProvider>
        <Text>conteúdo filho</Text>
      </CoreProvider>,
    );

    expect(screen.getByText('conteúdo filho')).toBeTruthy();
  });

  it('renderiza o componente de Toast junto com os filhos', () => {
    const { UNSAFE_getByType } = render(
      <CoreProvider>
        <Text>conteúdo filho</Text>
      </CoreProvider>,
    );

    expect(UNSAFE_getByType(Toast)).toBeTruthy();
  });

  it('expõe o colorScheme padrão "light" via useColorScheme', () => {
    let valorCapturado: { colorScheme: string } | undefined;

    function Sonda() {
      valorCapturado = useColorScheme();
      return null;
    }

    render(
      <CoreProvider>
        <Sonda />
      </CoreProvider>,
    );

    expect(valorCapturado?.colorScheme).toBe('light');
  });

  it('expõe o tema do design system via useTheme', () => {
    let valorCapturado: typeof theme | undefined;

    function Sonda() {
      valorCapturado = useTheme();
      return null;
    }

    render(
      <CoreProvider>
        <Sonda />
      </CoreProvider>,
    );

    expect(valorCapturado).toEqual(theme);
  });

  it('useColorScheme fora do CoreProvider cai no valor padrão sem lançar erro', () => {
    let valorCapturado: { colorScheme: string } | undefined;

    function Sonda() {
      valorCapturado = useColorScheme();
      return null;
    }

    expect(() => render(<Sonda />)).not.toThrow();
    expect(valorCapturado?.colorScheme).toBe('light');
  });
});
