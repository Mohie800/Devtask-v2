import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AppText } from './AppText';

export function Input({ label, style, ...props }: TextInputProps & { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <AppText variant="metaMedium" color={theme.colors.textSecondary}>{label}</AppText> : null}
      <TextInput
        placeholderTextColor={theme.colors.textTertiary}
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderSubtle,
            color: theme.colors.textPrimary,
            borderRadius: theme.radii.md
          },
          style
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16
  }
});
