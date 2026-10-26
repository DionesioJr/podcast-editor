import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { usePalette } from '@src/hooks/use-palette';
import { theme } from '@src/constants/theme';

type AlertType = 'info' | 'warning' | 'danger' | 'success';

interface AlertProps {
  type?: AlertType;
  title?: string;
  message: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Alert({
  type = 'info',
  title,
  message,
  icon,
  style,
}: AlertProps) {
  const palette = usePalette();

  const typeConfig: Record<AlertType, { bg: string; border: string; text: string }> = {
    info: { bg: '#E0F2FE', border: palette.info, text: '#075985' },
    warning: { bg: '#FEF3C7', border: palette.warning, text: '#92400E' },
    danger: { bg: '#FEE2E2', border: palette.danger, text: '#7F1D1D' },
    success: { bg: '#DCFCE7', border: palette.success, text: '#15803D' },
  };

  const config = typeConfig[type];

  const styles = StyleSheet.create({
    container: {
      borderRadius: theme.radius.base,
      borderLeftWidth: 4,
      borderLeftColor: config.border,
      backgroundColor: config.bg,
      padding: theme.spacing[4],
      flexDirection: 'row',
      gap: theme.spacing[3],
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    content: {
      flex: 1,
      gap: theme.spacing[1],
    },
    title: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      color: config.text,
      fontFamily: theme.typography.fontFamily.base,
    },
    message: {
      fontSize: theme.typography.fontSize.sm,
      color: config.text,
      fontFamily: theme.typography.fontFamily.base,
      lineHeight: theme.typography.lineHeight * theme.typography.fontSize.sm,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}
