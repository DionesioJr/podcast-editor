import { Slot } from 'expo-router';
import { CoreProvider } from '@src/providers/CoreProvider';

export default function RootLayout() {
  return (
    <CoreProvider>
      <Slot />
    </CoreProvider>
  );
}
