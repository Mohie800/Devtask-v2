import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export function Card({ children, style, raised, ...props }: ViewProps & { raised?: boolean }) {
  const theme = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: raised ? theme.colors.surfaceRaised : theme.colors.surface,
          borderColor: theme.colors.borderSubtle,
          borderRadius: theme.radii.lg
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16
  }
});
