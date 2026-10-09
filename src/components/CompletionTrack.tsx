import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AppText } from './AppText';

export function CompletionTrack({ completed, total, label }: { completed: number; total: number; label?: string }) {
  const theme = useTheme();
  const safeTotal = Math.max(total, 1);
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {Array.from({ length: safeTotal }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: index < completed ? theme.colors.done : theme.colors.surfaceMuted,
                borderColor: theme.colors.borderSubtle
              }
            ]}
          />
        ))}
      </View>
      <AppText variant="metaMedium" color={theme.colors.textSecondary}>
        {label ?? `${Math.round((completed / safeTotal) * 100)}% · ${completed}/${total} completed`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  track: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 10, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth }
});
