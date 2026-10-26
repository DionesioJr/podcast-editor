import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { usePalette } from '@src/hooks/use-palette';
import { theme } from '@src/constants/theme';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  style,
}: CheckboxProps) {
  const palette = usePalette();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: theme.radius.sm,
      borderWidth: 2,
      borderColor: checked ? palette.primary : palette.border,
      backgroundColor: checked ? palette.primary : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    checkmark: {
      width: 12,
      height: 12,
      borderTopWidth: 2,
      borderRightWidth: 2,
      borderColor: palette.white,
      transform: [{ rotate: '45deg' }],
      marginLeft: 1,
      marginTop: -1,
    },
    label: {
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily.base,
      color: disabled ? palette.text.tertiary : palette.text.primary,
      fontWeight: '500',
    } as TextStyle,
  });

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={({ hovered, pressed }) => [
        styles.container,
        !disabled && hovered && { opacity: 0.88 },
        !disabled && pressed && { opacity: 0.72 },
        style,
      ]}
    >
      <View style={styles.checkbox}>
        {checked && <View style={styles.checkmark} />}
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}
