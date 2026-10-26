import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { usePalette } from '@src/hooks/use-palette';
import { useBreakpoint } from '@src/hooks/use-breakpoint';
import { theme } from '@src/constants/theme';

interface EditorContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  style?: ViewStyle;
}

export function EditorContainer({
  children,
  header,
  style,
}: EditorContainerProps) {
  const palette = usePalette();
  const { isMobile } = useBreakpoint();

  const horizontalPadding = isMobile ? theme.spacing[4] : theme.spacing[7];
  const verticalPadding = theme.spacing[6];

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: palette.background,
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: palette.background,
    },
    header: {
      flexShrink: 0,
      zIndex: 20,
    },
    content: {
      flex: 1,
      paddingHorizontal: horizontalPadding,
      paddingVertical: verticalPadding,
    },
  });

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.container}>
        {header && <View style={styles.header}>{header}</View>}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}
