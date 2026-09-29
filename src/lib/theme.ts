import type { Theme } from 'expo-router/react-navigation';

export const semanticPalette = {
  light: {
    background: '#f0f1f1',
    foreground: '#28282a',
    card: '#ffffff',
    popover: '#ffffff',
    primary: '#7f1d31',
    secondary: '#f0f0f1',
    muted: '#f0f0f1',
    accent: '#e9e9eb',
    destructive: '#b92727',
    border: '#dedfe0',
    input: '#dedfe0',
    ring: '#7f1d31',
    radius: 4,
  },
  dark: {
    background: '#252428',
    foreground: '#dfe5e8',
    card: '#302f33',
    popover: '#39383d',
    primary: '#c78c99',
    secondary: '#39383d',
    muted: '#39383d',
    accent: '#46454a',
    destructive: '#e8847b',
    border: '#55545b',
    input: '#686770',
    ring: '#d49ba8',
    radius: 4,
  },
} as const;

// Native navigation colors mirror the semantic NativeWind palette. Cosmic club
// treatments belong to future feature scopes, never to this global default.
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    dark: false,
    colors: {
      primary: '#7f1d31',
      background: '#f0f1f1',
      card: '#ffffff',
      text: '#28282a',
      border: '#dedfe0',
      notification: '#b92727',
    },
    fonts: {
      regular: { fontFamily: 'Vazirmatn', fontWeight: '400' },
      medium: { fontFamily: 'Vazirmatn', fontWeight: '500' },
      bold: { fontFamily: 'Vazirmatn', fontWeight: '700' },
      heavy: { fontFamily: 'Vazirmatn', fontWeight: '800' },
    },
  },
  dark: {
    dark: true,
    colors: {
      primary: '#c78c99',
      background: '#252428',
      card: '#302f33',
      text: '#dfe5e8',
      border: '#55545b',
      notification: '#e8847b',
    },
    fonts: {
      regular: { fontFamily: 'Vazirmatn', fontWeight: '400' },
      medium: { fontFamily: 'Vazirmatn', fontWeight: '500' },
      bold: { fontFamily: 'Vazirmatn', fontWeight: '700' },
      heavy: { fontFamily: 'Vazirmatn', fontWeight: '800' },
    },
  },
};
