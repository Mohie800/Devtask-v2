import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AppText } from './AppText';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const stylesByVariant = {
    primary: { backgroundColor: theme.colors.accent, color: '#FFFFFF', borderColor: theme.colors.accent },
    secondary: { backgroundColor: theme.colors.surface, color: theme.colors.textPrimary, borderColor: theme.colors.borderSubtle },
    danger: { backgroundColor: theme.colors.overdueSoft, color: theme.colors.overdue, borderColor: theme.colors.overdue },
    ghost: { backgroundColor: 'transparent', color: theme.colors.accent, borderColor: 'transparent' }
  }[variant];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: stylesByVariant.backgroundColor,
          borderColor: stylesByVariant.borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1
        }
      ]}
    >
      {loading ? <ActivityIndicator color={stylesByVariant.color} /> : <AppText variant="bodyMedium" color={stylesByVariant.color}>{title}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  }
});
