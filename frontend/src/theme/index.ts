export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#DBEAFE',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',

  background: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const FONT = {
  title: 24,
  subtitle: 18,
  body: 16,
  small: 12,
} as const;

export default { COLORS, SPACING, RADIUS, FONT };
