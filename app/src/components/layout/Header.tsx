import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { usePalette } from '@src/hooks/use-palette';
import { theme } from '@src/constants/theme';

interface HeaderProps {
  appName?: string;
  fileName?: string;
  showFileName?: boolean;
  onDiscardPress?: () => void;
  style?: ViewStyle;
}

export function Header({
  appName = 'Editor',
  fileName,
  showFileName = false,
  onDiscardPress,
  style,
}: HeaderProps) {
  const palette = usePalette();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      paddingHorizontal: theme.spacing[7],
      paddingVertical: theme.spacing[4],
      backgroundColor: palette.white,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      gap: theme.spacing[4],
    },
    logoSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      flexShrink: 0,
    },
    logoBg: {
      width: 30,
      height: 30,
      borderRadius: theme.radius.sm,
      backgroundColor: palette.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    appNameText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: '700',
      color: palette.text.primary,
      fontFamily: theme.typography.fontFamily.display,
      letterSpacing: -0.02,
    } as TextStyle,
    separator: {
      width: 1,
      height: 22,
      backgroundColor: palette.border,
      flexShrink: 0,
    },
    fileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
      minWidth: 120,
      flex: 0,
    },
    fileName: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: '600',
      color: palette.text.primary,
      fontFamily: theme.typography.fontFamily.base,
      maxWidth: 150,
    } as TextStyle,
    spacer: {
      flex: 1,
    },
    actionSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
    },
    expiresButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      backgroundColor: palette.light,
      borderRadius: theme.radius.pill,
    },
    expiresText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      color: palette.text.secondary,
      fontFamily: theme.typography.fontFamily.base,
    } as TextStyle,
    discardButton: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: theme.radius.base,
      backgroundColor: 'transparent',
    },
    discardText: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      color: palette.text.secondary,
      fontFamily: theme.typography.fontFamily.base,
    } as TextStyle,
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.logoSection}>
        <View style={styles.logoBg}>
          <Text style={{ color: palette.white, fontSize: theme.typography.fontSize.md, fontWeight: '700' } as TextStyle}>♫</Text>
        </View>
        <Text style={styles.appNameText}>{appName}</Text>
      </View>

      {showFileName && fileName && (
        <>
          <View style={styles.separator} />
          <View style={styles.fileSection}>
            <Text style={styles.fileName} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
        </>
      )}

      {showFileName && (
        <>
          <View style={styles.spacer} />
          <View style={styles.actionSection}>
            <View style={styles.expiresButton}>
              <Text style={styles.expiresText}>Expira em 23 h</Text>
            </View>
            <Pressable
              onPress={onDiscardPress}
              style={({ hovered, pressed }) => [
                styles.discardButton,
                hovered && { opacity: 0.88 },
                pressed && { opacity: 0.72 },
              ]}
            >
              <Text style={styles.discardText}>Descartar</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
