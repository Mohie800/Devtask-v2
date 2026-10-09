import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

type Variant = 'screenTitle' | 'title' | 'section' | 'body' | 'bodyMedium' | 'meta' | 'metaMedium' | 'caption';

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...props
}: TextProps & { variant?: Variant; color?: string }) {
  const theme = useTheme();
  return (
    <Text
      {...props}
      style={[
        theme.typography[variant],
        { color: color ?? theme.colors.textPrimary },
        style
      ]}
    >
      {children}
    </Text>
  );
}
