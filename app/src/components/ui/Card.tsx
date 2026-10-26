import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { usePalette } from '@src/hooks/use-palette';
import { theme } from '@src/constants/theme';

type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardPadding = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'outlined',
  padding = 'md',
  style,
}: CardProps) {
  const palette = usePalette();

  const paddingSizes: Record<CardPadding, number> = {
    sm: theme.spacing[3],
    md: theme.spacing[4],
    lg: theme.spacing[6],
  };

  type VariantStyle = {
    backgroundColor: string;
    borderWidth: number;
    borderColor: string;
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };

  const variantStyles: Record<CardVariant, VariantStyle> = {
    elevated: {
      backgroundColor: palette.white,
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: palette.dark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    outlined: {
      backgroundColor: palette.white,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    filled: {
      backgroundColor: palette.light,
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  };

  const currentVariant = variantStyles[variant];
  const currentPadding = paddingSizes[padding];

  const styles = useMemo(() => StyleSheet.create({
    card: {
      borderRadius: theme.radius.base,
      padding: currentPadding,
      backgroundColor: currentVariant.backgroundColor,
      borderWidth: currentVariant.borderWidth,
      borderColor: currentVariant.borderColor,
      shadowColor: currentVariant.shadowColor,
      shadowOffset: currentVariant.shadowOffset,
      shadowOpacity: currentVariant.shadowOpacity,
      shadowRadius: currentVariant.shadowRadius,
      elevation: currentVariant.elevation,
    },
  }), [currentPadding, currentVariant]);

  return <View style={[styles.card, style]}>{children}</View>;
}
