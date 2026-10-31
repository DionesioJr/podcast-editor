import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert } from './Alert';
import { Button } from './Button';
import { getErrorMessage } from '@src/i18n';
import { getErrorActions, ErrorActionType } from '@src/i18n/error-actions';
import { theme } from '@src/constants/theme';

interface ErrorScreenProps {
  code: string;
  title?: string;
  onAction?: (type: ErrorActionType) => void;
}

export function ErrorScreen({ code, title, onAction }: ErrorScreenProps) {
  const message = getErrorMessage(code);
  const actions = getErrorActions(code);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Alert
          type="danger"
          title={title ?? 'Algo deu errado'}
          message={message}
        />
        {actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action) => (
              <Button
                key={action.type}
                label={action.label}
                onPress={() => onAction?.(action.type)}
                variant="primary"
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing[4],
  },
  content: {
    width: '100%',
    maxWidth: 480,
    gap: theme.spacing[4],
  },
  actions: {
    gap: theme.spacing[2],
  },
});
