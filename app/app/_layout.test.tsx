import React from 'react';
import { render } from '@testing-library/react-native';

const CoreProviderMock = jest.fn(({ children }: { children: React.ReactNode }) => (
  <>{children}</>
));

jest.mock('@src/providers/CoreProvider', () => ({
  CoreProvider: (props: { children: React.ReactNode }) => CoreProviderMock(props),
}));

jest.mock('expo-router', () => ({
  Slot: () => null,
}));

import RootLayout from './_layout';

describe('RootLayout (PDE-8)', () => {
  beforeEach(() => {
    CoreProviderMock.mockClear();
  });

  it('envolve o app no CoreProvider', () => {
    render(<RootLayout />);

    expect(CoreProviderMock).toHaveBeenCalledTimes(1);
  });
});
