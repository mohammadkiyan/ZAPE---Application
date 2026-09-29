import type { AppLocale } from '@/localization/locale';

export const THEME_IDS = [
  'constellation',
  'porcelain',
  'chronograph',
  'mist',
  'rings',
  'astrolabe',
  'ruler',
  'editorial',
  'flap',
  'bracelet',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const BACKGROUND_IDS = [
  'orbits',
  'plain',
  'graticule',
  'dots',
  'sunburst',
  'ruled',
  'contour',
  'guilloche',
  'stars',
  'silk',
] as const;
export type BackgroundId = (typeof BACKGROUND_IDS)[number];
export type BackgroundChoice = BackgroundId | 'auto';

export const TONE_IDS = ['dark', 'light', 'gray'] as const;
export type Tone = (typeof TONE_IDS)[number];
export type DialVariant = 'classic' | 'chrono' | 'hairline';

export const DEFAULT_THEME: ThemeId = 'constellation';
export const BURGUNDY = '#65001c';

type LocalizedName = Record<AppLocale, string>;

export interface ClockTheme {
  tone: Tone;
  background: BackgroundId;
  dial: DialVariant;
  name: LocalizedName;
}

// Copied from the RelTime Mobile canvas (Home/Clock `THEMES` and the `TL` name table).
export const THEMES: Record<ThemeId, ClockTheme> = {
  constellation: {
    tone: 'dark',
    background: 'orbits',
    dial: 'classic',
    name: { fa: 'صورت فلکی', en: 'Constellation' },
  },
  porcelain: {
    tone: 'light',
    background: 'plain',
    dial: 'classic',
    name: { fa: 'چینی', en: 'Porcelain' },
  },
  chronograph: {
    tone: 'dark',
    background: 'sunburst',
    dial: 'chrono',
    name: { fa: 'کرنوگراف', en: 'Chronograph' },
  },
  mist: { tone: 'gray', background: 'contour', dial: 'hairline', name: { fa: 'مه', en: 'Mist' } },
  rings: {
    tone: 'dark',
    background: 'guilloche',
    dial: 'classic',
    name: { fa: 'حلقه‌ها', en: 'Rings' },
  },
  astrolabe: {
    tone: 'dark',
    background: 'stars',
    dial: 'classic',
    name: { fa: 'اسطرلاب', en: 'Astrolabe' },
  },
  ruler: {
    tone: 'light',
    background: 'graticule',
    dial: 'hairline',
    name: { fa: 'خط‌کش', en: 'Ruler' },
  },
  editorial: {
    tone: 'light',
    background: 'ruled',
    dial: 'hairline',
    name: { fa: 'نوشتار', en: 'Editorial' },
  },
  flap: {
    tone: 'gray',
    background: 'dots',
    dial: 'classic',
    name: { fa: 'ورقی', en: 'Split-flap' },
  },
  bracelet: {
    tone: 'light',
    background: 'silk',
    dial: 'hairline',
    name: { fa: 'دستبند', en: 'Bracelet' },
  },
};

export const BACKGROUNDS: Record<BackgroundId, { name: LocalizedName }> = {
  orbits: { name: { fa: 'مدارها', en: 'Orbits' } },
  plain: { name: { fa: 'ساده', en: 'Plain' } },
  graticule: { name: { fa: 'شبکه', en: 'Grid' } },
  dots: { name: { fa: 'نقطه‌ها', en: 'Dots' } },
  sunburst: { name: { fa: 'پرتو', en: 'Sunburst' } },
  ruled: { name: { fa: 'خط‌دار', en: 'Ruled' } },
  contour: { name: { fa: 'تراز', en: 'Contour' } },
  guilloche: { name: { fa: 'گیوشه', en: 'Guilloché' } },
  stars: { name: { fa: 'ستارگان', en: 'Stars' } },
  silk: { name: { fa: 'ابریشم', en: 'Silk' } },
};

export interface Palette {
  bg: string;
  fg: string;
  fg2: string;
  muted: string;
  faint: string;
  line: string;
  border: string;
  edge: string;
  inner: string;
  control: string;
  ring: string;
  halo: string;
  /** Pattern ink used by backdrops and glyph strokes. */
  ink: string;
  /** Flat approximation of the canvas glass gradient (native views cannot blur-and-gradient cheaply). */
  glass: string;
  glassEdge: string;
  sheet: string;
  /** Segment track and inactive control fill. */
  off: string;
  segSel: string;
  tabBar: string;
  tabEdge: string;
  tabLens: string;
  tabThread: string;
  tabMuted: string;
  tabRing: string;
  tabHalo: string;
}

// Copied from the canvas `TONES` tables in Home, Clock and TabBar.
export const TONES: Record<Tone, Palette> = {
  dark: {
    bg: '#151515',
    fg: '#ffffff',
    fg2: 'rgba(232, 236, 237, 0.78)',
    muted: 'rgba(232, 236, 237, 0.6)',
    faint: 'rgba(232, 236, 237, 0.38)',
    line: 'rgba(232, 236, 237, 0.1)',
    border: 'rgba(232, 236, 237, 0.16)',
    edge: 'rgba(232, 236, 237, 0.35)',
    inner: 'rgba(232, 236, 237, 0.12)',
    control: 'rgba(232, 236, 237, 0.5)',
    ring: '#e8eced',
    halo: 'rgba(232, 236, 237, 0.6)',
    ink: '#e8eced',
    glass: 'rgba(255, 255, 255, 0.07)',
    glassEdge: 'rgba(255, 255, 255, 0.14)',
    sheet: 'rgba(40, 40, 42, 0.82)',
    off: 'rgba(255, 255, 255, 0.1)',
    segSel: 'rgba(255, 255, 255, 0.16)',
    tabBar: 'rgba(34, 34, 36, 0.62)',
    tabEdge: 'rgba(255, 255, 255, 0.14)',
    tabLens: 'rgba(255, 255, 255, 0.12)',
    tabThread: 'rgba(232, 236, 237, 0.2)',
    tabMuted: 'rgba(232, 236, 237, 0.62)',
    tabRing: 'rgba(34, 34, 36, 1)',
    tabHalo: 'rgba(255, 255, 255, 0.92)',
  },
  light: {
    bg: '#ffffff',
    fg: '#151515',
    fg2: 'rgba(21, 21, 21, 0.78)',
    muted: 'rgba(21, 21, 21, 0.62)',
    faint: 'rgba(21, 21, 21, 0.38)',
    line: 'rgba(21, 21, 21, 0.1)',
    border: 'rgba(21, 21, 21, 0.14)',
    edge: 'rgba(21, 21, 21, 0.2)',
    inner: 'rgba(21, 21, 21, 0.08)',
    control: 'rgba(21, 21, 21, 0.5)',
    ring: '#ffffff',
    halo: 'rgba(101, 0, 28, 0.35)',
    ink: '#151515',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassEdge: 'rgba(21, 21, 21, 0.08)',
    sheet: 'rgba(255, 255, 255, 0.88)',
    off: 'rgba(21, 21, 21, 0.06)',
    segSel: '#ffffff',
    tabBar: 'rgba(255, 255, 255, 0.7)',
    tabEdge: 'rgba(21, 21, 21, 0.08)',
    tabLens: 'rgba(21, 21, 21, 0.06)',
    tabThread: 'rgba(21, 21, 21, 0.14)',
    tabMuted: 'rgba(21, 21, 21, 0.6)',
    tabRing: '#ffffff',
    tabHalo: '#ffffff',
  },
  gray: {
    bg: '#e8eced',
    fg: '#151515',
    fg2: 'rgba(21, 21, 21, 0.78)',
    muted: 'rgba(21, 21, 21, 0.62)',
    faint: 'rgba(21, 21, 21, 0.38)',
    line: 'rgba(21, 21, 21, 0.12)',
    border: 'rgba(21, 21, 21, 0.16)',
    edge: 'rgba(21, 21, 21, 0.22)',
    inner: 'rgba(21, 21, 21, 0.1)',
    control: 'rgba(21, 21, 21, 0.5)',
    ring: '#e8eced',
    halo: 'rgba(101, 0, 28, 0.35)',
    ink: '#151515',
    glass: 'rgba(255, 255, 255, 0.62)',
    glassEdge: 'rgba(255, 255, 255, 0.8)',
    sheet: 'rgba(245, 247, 248, 0.88)',
    off: 'rgba(21, 21, 21, 0.07)',
    segSel: '#ffffff',
    tabBar: 'rgba(255, 255, 255, 0.62)',
    tabEdge: 'rgba(255, 255, 255, 0.8)',
    tabLens: 'rgba(21, 21, 21, 0.06)',
    tabThread: 'rgba(21, 21, 21, 0.14)',
    tabMuted: 'rgba(21, 21, 21, 0.6)',
    tabRing: '#ffffff',
    tabHalo: '#ffffff',
  },
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export function isBackgroundId(value: unknown): value is BackgroundId {
  return typeof value === 'string' && (BACKGROUND_IDS as readonly string[]).includes(value);
}

export function toneForTheme(theme: ThemeId): Tone {
  return THEMES[theme].tone;
}

export function resolveBackground(theme: ThemeId, background: BackgroundChoice): BackgroundId {
  return background === 'auto' ? THEMES[theme].background : background;
}
