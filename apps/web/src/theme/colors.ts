/**
 * JalurTikus Design Tokens & Color Palette
 * Dapat diimpor di React, MapLibre GL layer styles, maupun modul TypeScript lainnya.
 */

export const THEME_COLORS = {
  // Named Palettes
  midnightNavy: '#101B2D',
  deepSlate: '#17263C',
  electricLime: '#A3E635',
  skyBlue: '#38BDF8',
  amber: '#F59E0B',
  trafficRed: '#EF4444',
  cloudWhite: '#F8FAFC',

  // Semantic Brand
  primary: '#A3E635',
  primaryHover: '#84CC16',

  // Background & Surface
  background: '#101B2D',
  surface: '#17263C',
  surfaceSecondary: '#203149',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',

  // Traffic Conditions & Map Routes
  traffic: {
    free: '#22C55E',        // Lancar
    light: '#38BDF8',       // Ramai lancar / rute alternatif
    medium: '#F59E0B',      // Padat / peringatan
    heavy: '#EF4444',       // Macet parah / kecelakaan
    roadClosed: '#64748B',  // Jalan ditutup
  },

  // Map Routes
  route: {
    primary: '#A3E635',     // Rute utama (Electric Lime)
    alternative: '#38BDF8', // Rute alternatif (Sky Blue)
  },

  // Utility
  border: '#334155',
  info: '#38BDF8',
} as const;

export type ThemeColors = typeof THEME_COLORS;

