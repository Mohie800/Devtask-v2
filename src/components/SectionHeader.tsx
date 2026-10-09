import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { AppText } from './AppText';

export function SectionHeader({ title, meta, tone }: { title: string; meta?: string; tone?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.marker, { backgroundColor: tone ?? theme.colors.borderStrong }]} />
      <AppText variant="section" color={theme.colors.textSecondary}>{title}</AppText>
      {meta ? <AppText variant="meta" color={theme.colors.textTertiary}>{meta}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4
  }
});
