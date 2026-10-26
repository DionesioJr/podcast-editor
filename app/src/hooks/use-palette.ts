import { useColorScheme } from 'react-native';
import { colors } from '@src/constants/theme';

export interface Palette {
  primary: string;
  primaryHover: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  accent: string;
  light: string;
  dark: string;
  background: string;
  border: string;
  white: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export function usePalette(scheme?: 'light' | 'dark'): Palette {
  const colorScheme = useColorScheme();
  const activeScheme = scheme || colorScheme || 'light';

  if (activeScheme === 'dark') {
    return {
      ...colors,
      background: colors.dark,
      text: {
        primary: colors.light,
        secondary: colors.text.tertiary,
        tertiary: colors.text.secondary,
      },
    } as Palette;
  }

  return colors as Palette;
}
