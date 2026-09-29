import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { colorScheme, vars } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from 'expo-router/react-navigation';
import { NAV_THEME, THEME } from '@/lib/theme';
import { TONES, type Palette, type Tone } from './clock-themes';

type Rgb = [number, number, number];

export function parseColor(value: string): { rgb: Rgb; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const rgba = /^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/i.exec(value);
  if (rgba) {
    return {
      rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])],
      alpha: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }
  throw new Error(`Unsupported color: ${value}`);
}

/** Composites a possibly translucent color over an opaque background. */
export function flatten(color: string, over: string): Rgb {
  const top = parseColor(color);
  const base = parseColor(over).rgb;
  return top.rgb.map((c, i) => Math.round(c * top.alpha + base[i]! * (1 - top.alpha))) as Rgb;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Space-separated HSL triplet, the format `hsl(var(--token))` classes expect. */
export function hslTriplet([r, g, b]: Rgb): string {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }
  const round = (v: number) => Math.round(v * 10) / 10;
  return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`;
}

/** Semantic CSS variables for one tone. Translucent canvas values are flattened over the tone background. */
export function toneVariables(tone: Tone): Record<`--${string}`, string> {
  const p = TONES[tone];
  const t = THEME[tone];
  const on = (color: string) => hslTriplet(flatten(color, p.bg));
  const fg = on(t.foreground);
  return {
    '--background': on(t.background),
    '--foreground': fg,
    '--subtle': on(p.fg2),
    '--faint': on(p.faint),
    '--card': on(t.card),
    '--card-foreground': fg,
    '--popover': on(t.popover),
    '--popover-foreground': fg,
    '--primary': on(t.primary),
    '--primary-foreground': on('#ffffff'),
    '--secondary': on(t.secondary),
    '--secondary-foreground': fg,
    '--muted': on(p.off),
    '--muted-foreground': on(t.muted),
    '--accent': on(t.accent),
    '--accent-foreground': fg,
    '--destructive': on(t.destructive),
    '--destructive-foreground': on(tone === 'dark' ? p.bg : '#ffffff'),
    '--border': on(t.border),
    '--line': on(p.line),
    '--edge': on(p.edge),
    '--input': on(t.input),
    '--ring': on(t.ring),
  };
}

interface ToneContextValue {
  tone: Tone;
  palette: Palette;
}

const ToneContext = createContext<ToneContextValue>({ tone: 'dark', palette: TONES.dark });

export function useTone(): ToneContextValue {
  return useContext(ToneContext);
}

/** Applies a tone's palette to every NativeWind class, SVG reader, navigator and the status bar below it. */
export function ToneProvider({ tone, children }: PropsWithChildren<{ tone: Tone }>) {
  const parent = useContext(ToneContext);
  const value = useMemo(() => ({ tone, palette: TONES[tone] }), [tone]);
  useEffect(() => {
    colorScheme.set(tone === 'dark' ? 'dark' : 'light');
    // A nested provider (onboarding) hands the scheme back to its parent when it unmounts.
    return () => colorScheme.set(parent.tone === 'dark' ? 'dark' : 'light');
  }, [tone, parent.tone]);
  const style = useMemo(() => [{ flex: 1 }, vars(toneVariables(tone))], [tone]);
  return (
    <ToneContext.Provider value={value}>
      <ThemeProvider value={NAV_THEME[tone]}>
        <View style={style} testID={`tone-${tone}`}>
          {children}
        </View>
        <StatusBar style={tone === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </ToneContext.Provider>
  );
}
