import React from 'react';
import { View } from 'react-native';
import { PeriodUnit } from '@/types/models';
import { Chip, ChipRow } from './Chip';
import { AppText } from './AppText';
import { useTheme } from '@/theme/ThemeContext';

const presets: Array<{ label: string; value: number; unit: PeriodUnit }> = [
  { label: 'Today', value: 0, unit: 'days' },
  { label: 'Tomorrow', value: 1, unit: 'day' },
  { label: '2 days', value: 2, unit: 'days' },
  { label: '1 week', value: 1, unit: 'week' },
  { label: '2 weeks', value: 2, unit: 'weeks' },
  { label: '1 month', value: 1, unit: 'month' }
];

export function PeriodPicker({
  label,
  value,
  unit,
  onChange,
  includeToday = false
}: {
  label: string;
  value: number;
  unit: PeriodUnit;
  onChange: (value: number, unit: PeriodUnit) => void;
  includeToday?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <AppText variant="metaMedium" color={theme.colors.textSecondary}>{label}</AppText>
      <ChipRow>
        {presets
          .filter((preset) => includeToday || preset.value > 0)
          .map((preset) => (
            <Chip
              key={`${preset.value}-${preset.unit}`}
              label={preset.label}
              selected={preset.value === value && preset.unit === unit}
              onPress={() => onChange(preset.value, preset.unit)}
            />
          ))}
      </ChipRow>
    </View>
  );
}
