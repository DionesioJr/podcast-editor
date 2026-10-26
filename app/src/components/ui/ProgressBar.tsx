import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { usePalette } from '@src/hooks/use-palette';
import { theme } from '@src/constants/theme';

type ProgressVariant = 'primary' | 'success' | 'warning' | 'danger';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  progress: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  variant = 'primary',
  size = 'md',
  style,
}: ProgressBarProps) {
  const palette = usePalette();

  const variantColors: Record<ProgressVariant, string> = {
    primary: palette.primary,
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
  };

  const heights = {
    sm: 4,
    md: 8,
    lg: 12,
  };

  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const color = variantColors[variant];
  const height = heights[size];

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      height,
      borderRadius: height / 2,
      backgroundColor: palette.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: color,
      width: `${normalizedProgress}%`,
      borderRadius: height / 2,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.fill} />
    </View>
  );
}
