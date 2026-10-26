import React, { createContext, useContext } from 'react';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import i18next from 'i18next';
import { theme } from '@src/constants/theme';
import '@src/i18n';

type ColorScheme = 'light' | 'dark';

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
}

const ColorSchemeContext = createContext<ColorSchemeContextType>({
  colorScheme: 'light',
});

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}

const ThemeContext = createContext(theme);

export function useTheme() {
  return useContext(ThemeContext);
}

const queryClient = new QueryClient();

interface CoreProviderProps {
  children: React.ReactNode;
}

export function CoreProvider({ children }: CoreProviderProps) {
  return (
    <I18nextProvider i18n={i18next}>
      <QueryClientProvider client={queryClient}>
        <ColorSchemeContext.Provider value={{ colorScheme: 'light' }}>
          <SafeAreaProvider>
            <ThemeContext.Provider value={theme}>
              <>
                {children}
                <Toast />
              </>
            </ThemeContext.Provider>
          </SafeAreaProvider>
        </ColorSchemeContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
