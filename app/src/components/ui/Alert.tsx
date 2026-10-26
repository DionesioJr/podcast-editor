import React, { useMemo } from 'react';
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

  const styles = useMemo(() => {
    const typeConfig = theme.colors.alert[type];
    const borderColor = {
      info: palette.info,
      warning: palette.warning,
      danger: palette.danger,
      success: palette.success,
    }[type];

    return StyleSheet.create({
      container: {
        borderRadius: theme.radius.base,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        backgroundColor: typeConfig.bg,
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
        color: typeConfig.text,
        fontFamily: theme.typography.fontFamily.base,
      },
      message: {
        fontSize: theme.typography.fontSize.sm,
        color: typeConfig.text,
        fontFamily: theme.typography.fontFamily.base,
        lineHeight: theme.typography.lineHeight * theme.typography.fontSize.sm,
      },
    });
  }, [type, palette]);

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
