import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, AppColors, radii, spacing, typography } from './tokens';
import { ThemePreference } from '@/types/models';

interface ThemeValue {
  colors: AppColors;
  isDark: boolean;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({
  preference,
  children
}: {
  preference: ThemePreference;
  children: React.ReactNode;
}) {
  const system = useColorScheme();
  const isDark = preference === 'dark' || (preference === 'system' && system === 'dark');
  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      spacing,
      radii,
      typography
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
