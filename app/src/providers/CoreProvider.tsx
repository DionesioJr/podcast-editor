import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface CoreProviderProps {
  children: React.ReactNode;
}

export function CoreProvider({ children }: CoreProviderProps) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
