export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 26,
  pill: 999
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36
} as const;

export const typography = {
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  section: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  metaMedium: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const }
} as const;

export const lightColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceRaised: '#FCFCFD',
  surfaceMuted: '#EEF1F5',
  textPrimary: '#111827',
  textSecondary: '#5B6472',
  textTertiary: '#8A94A6',
  borderSubtle: '#E5E7EB',
  borderStrong: '#CBD2DC',
  accent: '#4F7CFF',
  accentSoft: '#EAF0FF',
  todo: '#64748B',
  todoSoft: '#EEF2F7',
  inProgress: '#4F7CFF',
  inProgressSoft: '#EAF0FF',
  blocked: '#F59E0B',
  blockedSoft: '#FFF4D6',
  overdue: '#EF4444',
  overdueSoft: '#FEE2E2',
  done: '#22C55E',
  doneSoft: '#DCFCE7',
  payment: '#8B5CF6',
  paymentSoft: '#F0E9FF',
  danger: '#DC2626',
  shadow: '#000000'
} as const;

export const darkColors = {
  background: '#0D1321',
  surface: '#151C2E',
  surfaceRaised: '#1B2438',
  surfaceMuted: '#101827',
  textPrimary: '#E8EEF8',
  textSecondary: '#98A4B8',
  textTertiary: '#71809A',
  borderSubtle: '#28334A',
  borderStrong: '#3B4964',
  accent: '#7C9BFF',
  accentSoft: '#223157',
  todo: '#8B98AD',
  todoSoft: '#202A40',
  inProgress: '#7C9BFF',
  inProgressSoft: '#223157',
  blocked: '#FBBF24',
  blockedSoft: '#44360F',
  overdue: '#F87171',
  overdueSoft: '#4A1E22',
  done: '#34D399',
  doneSoft: '#173B2D',
  payment: '#A78BFA',
  paymentSoft: '#302452',
  danger: '#F87171',
  shadow: '#000000'
} as const;

export type AppColors = typeof lightColors;
