import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { breakpoints } from '@src/constants/theme';

export interface Breakpoint {
  isMobile: boolean;
  isNarrow: boolean;
  width: number;
  height: number;
}

export function useBreakpoint(): Breakpoint {
  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window');
    return {
      width: window.width,
      height: window.height,
    };
  });

  useEffect(() => {
    const handleChange = (newDimensions: { window: { width: number; height: number } }) => {
      setDimensions({
        width: newDimensions.window.width,
        height: newDimensions.window.height,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    isMobile: dimensions.width <= breakpoints.mobile,
    isNarrow: dimensions.width <= breakpoints.tablet,
    width: dimensions.width,
    height: dimensions.height,
  };
}

export function useIsMobile(): boolean {
  const { isMobile } = useBreakpoint();
  return isMobile;
}

export function useIsNarrow(): boolean {
  const { isNarrow } = useBreakpoint();
  return isNarrow;
}
