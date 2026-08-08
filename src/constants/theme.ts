export const colors = {
  graphite: '#141518',
  warmWhite: '#F7F6F3',
  neutralGray: '#8A8F98',
  border: '#E4E2DD',
  electricIndigo: '#4F46E5',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  control: 12,
  sheet: 16,
  sheetLg: 20,
};

export const typography = {
  display: { fontSize: 28, fontWeight: '600' as const, lineHeight: 34 },
  title: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

/** Default map center: Charlottesville, VA */
export const DEFAULT_MAP_CENTER = {
  lng: -78.4767,
  lat: 38.0293,
  zoom: 11,
};

export const PLATFORM_FEE_RATE = 0.12;
