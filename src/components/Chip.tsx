import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AppText } from './AppText';

export function Chip({
  label,
  selected,
  onPress,
  tone = 'neutral'
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'accent' | 'danger' | 'warning' | 'success';
}) {
  const theme = useTheme();
  const toneColor = {
    neutral: theme.colors.todo,
    accent: theme.colors.accent,
    danger: theme.colors.overdue,
    warning: theme.colors.blocked,
    success: theme.colors.done
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? toneColor : theme.colors.borderSubtle,
          backgroundColor: selected ? `${toneColor}18` : theme.colors.surface
        }
      ]}
    >
      <AppText variant="metaMedium" color={selected ? toneColor : theme.colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  }
});
