import type { Theme } from 'expo-router/react-navigation';
import { BURGUNDY, TONES, type Tone } from '@/theme/clock-themes';
import { FONT_FAMILY } from '@/theme/fonts';

function semanticPalette(tone: Tone) {
  const p = TONES[tone];
  return {
    background: p.bg,
    foreground: p.fg,
    card: p.glass,
    popover: p.sheet,
    primary: BURGUNDY,
    secondary: p.off,
    muted: p.muted,
    accent: p.inner,
    destructive: tone === 'dark' ? '#e8847b' : '#b92727',
    border: p.border,
    input: p.control,
    // Burgundy is unreadable on the dark tone, so focus rings use the light ink there.
    ring: tone === 'dark' ? p.ring : BURGUNDY,
    radius: 4,
  };
}

/** JS-side semantic colors per clock-theme tone; NativeWind classes read the same values via CSS variables. */
export const THEME: Record<Tone, ReturnType<typeof semanticPalette>> = {
  dark: semanticPalette('dark'),
  light: semanticPalette('light'),
  gray: semanticPalette('gray'),
};

const fonts: Theme['fonts'] = {
  regular: { fontFamily: FONT_FAMILY.fa[400], fontWeight: '400' },
  medium: { fontFamily: FONT_FAMILY.fa[500], fontWeight: '500' },
  bold: { fontFamily: FONT_FAMILY.fa[600], fontWeight: '600' },
  heavy: { fontFamily: FONT_FAMILY.fa[600], fontWeight: '600' },
};

function navTheme(tone: Tone): Theme {
  const theme = THEME[tone];
  return {
    dark: tone === 'dark',
    colors: {
      primary: tone === 'dark' ? theme.foreground : theme.primary,
      background: theme.background,
      card: theme.background,
      text: theme.foreground,
      border: theme.border,
      notification: theme.primary,
    },
    fonts,
  };
}

// Native navigation colors follow the active clock-theme tone.
export const NAV_THEME: Record<Tone, Theme> = {
  dark: navTheme('dark'),
  light: navTheme('light'),
  gray: navTheme('gray'),
};
