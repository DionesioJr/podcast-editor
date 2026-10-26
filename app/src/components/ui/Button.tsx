import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { usePalette } from '@src/hooks/use-palette';
import { theme } from '@src/constants/theme';

type ButtonVariant = 'primary' | 'outline' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: ButtonProps) {
  const palette = usePalette();

  const sizes: Record<ButtonSize, { padding: number; fontSize: number }> = {
    sm: { padding: theme.spacing[2], fontSize: theme.typography.fontSize.sm },
    md: { padding: theme.spacing[3], fontSize: theme.typography.fontSize.base },
    lg: { padding: theme.spacing[4], fontSize: theme.typography.fontSize.md },
  };

  const variantStyles: Record<ButtonVariant, { backgroundColor: string; borderColor: string }> = {
    primary: {
      backgroundColor: disabled ? palette.border : palette.primary,
      borderColor: disabled ? palette.border : palette.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: palette.border,
    },
    secondary: {
      backgroundColor: palette.light,
      borderColor: palette.light,
    },
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: disabled ? palette.text.tertiary : palette.white,
    outline: disabled ? palette.text.tertiary : palette.text.primary,
    secondary: disabled ? palette.text.tertiary : palette.text.primary,
  };

  const currentSize = sizes[size];
  const currentVariant = variantStyles[variant];

  const styles = StyleSheet.create({
    button: {
      paddingHorizontal: currentSize.padding,
      paddingVertical: currentSize.padding,
      borderRadius: theme.radius.base,
      borderWidth: 1,
      borderColor: currentVariant.borderColor,
      backgroundColor: currentVariant.backgroundColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: currentSize.fontSize,
      fontWeight: '600',
      color: textColors[variant],
      fontFamily: theme.typography.fontFamily.base,
    } as TextStyle,
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.button,
        !disabled && pressed && { opacity: 0.72 },
        !disabled && hovered && { opacity: 0.88 },
        style,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}
