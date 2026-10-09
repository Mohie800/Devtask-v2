import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AppText } from './AppText';
import { Button } from './Button';

export function EmptyState({
  title,
  message,
  actionTitle,
  onAction
}: {
  title: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderSubtle }]}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" color={theme.colors.textSecondary} style={styles.message}>{message}</AppText>
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    gap: 12,
    alignItems: 'flex-start'
  },
  message: { maxWidth: 320 }
});
