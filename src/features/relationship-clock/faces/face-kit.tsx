import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { tallLine } from '@/features/shell/time-dial';
import { cn } from '@/lib/utils';
import type { AppLocale } from '@/localization/locale';
import type { ThemeId, Tone } from '@/theme/clock-themes';
import type { Elapsed } from '../elapsed';
import { TickingText, type TickingFormat } from '../ticking-text';

// Every face draws on the same artboard: the canvas phone width, starting at the names row.
export const FACE_WIDTH = 390;
export const FACE_HEIGHT = 550;

export interface FaceProps {
  theme: ThemeId;
  tone: Tone;
  locale: AppLocale;
  /** Recomputed once a second. */
  elapsed: Elapsed;
  /** 0–1 toward the next unit. Seconds move every frame, so they come as a shared value. */
  progress: Record<'y' | 'mo' | 'd' | 'h' | 'mi', number>;
  secondProgress: SharedValue<number>;
  dayMs: SharedValue<number>;
}

interface FaceTone {
  bg: string;
  fg: string;
  muted: string;
  line: string;
  ink: string;
  /** Scales artwork opacity: dark ink on a light ground reads heavier. */
  k: number;
}

/** The RelTime device canvas face palette per tone. */
export const FACE_TONES: Record<Tone, FaceTone> = {
  dark: {
    bg: '#151515',
    fg: '#ffffff',
    muted: 'rgba(232, 236, 237, 0.6)',
    line: 'rgba(232, 236, 237, 0.1)',
    ink: '#e8eced',
    k: 1,
  },
  light: {
    bg: '#ffffff',
    fg: '#151515',
    muted: 'rgba(21, 21, 21, 0.68)',
    line: 'rgba(21, 21, 21, 0.1)',
    ink: '#151515',
    k: 0.85,
  },
  gray: {
    bg: '#e8eced',
    fg: '#151515',
    muted: 'rgba(21, 21, 21, 0.68)',
    line: 'rgba(21, 21, 21, 0.12)',
    ink: '#151515',
    k: 0.9,
  },
};

export const directionOf = (locale: AppLocale) => (locale === 'fa' ? 'rtl' : 'ltr');

const round = (n: number) => {
  'worklet';
  return Math.round(n * 10) / 10;
};

/** A progress arc on a ring, clockwise from 12 o'clock. */
export function ringArc(cx: number, cy: number, r: number, p: number): string {
  'worklet';
  if (!(p > 0.001)) return 'M0 0';
  if (p >= 0.999) {
    return `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}`;
  }
  const th = p * Math.PI * 2;
  return `M${cx} ${cy - r}A${r} ${r} 0 ${th > Math.PI ? 1 : 0} 1 ${round(cx + r * Math.sin(th))} ${round(cy - r * Math.cos(th))}`;
}

/** The point at progress `p` on a ring. */
export function ringPoint(cx: number, cy: number, r: number, p: number) {
  'worklet';
  const th = p * Math.PI * 2;
  return { x: round(cx + r * Math.sin(th)), y: round(cy - r * Math.cos(th)) };
}

export function circlePath(cx: number, cy: number, r: number): string {
  return `M${round(cx - r)} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

export interface LineProps {
  children: ReactNode;
  size: number;
  /** The canvas line-height: the box this line occupies in the layout. */
  height: number;
  color: string;
  weight?: 400 | 500 | 600;
  tracking?: number;
  upper?: boolean;
  align?: 'center' | 'flex-start' | 'flex-end';
  /** A soft halo in this colour, to lift the text off artwork behind it. */
  halo?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * One line of text in a box of the canvas line-height. The text itself sits on a line tall
 * enough for either bundled font, so both platforms centre it in the box the same way.
 */
export function Line({
  children,
  size,
  height,
  color,
  weight = 400,
  tracking = 0,
  upper = false,
  align,
  halo,
  style,
  testID,
}: LineProps) {
  return (
    <View style={[{ height, justifyContent: 'center', alignItems: align }, style]}>
      <Text
        testID={testID}
        numberOfLines={1}
        className={cn(
          'w-auto p-0',
          weight === 500 && 'font-medium',
          weight === 600 && 'font-semibold'
        )}
        style={{
          fontSize: size,
          lineHeight: tallLine(size),
          color,
          letterSpacing: tracking,
          textTransform: upper ? 'uppercase' : 'none',
          fontVariant: ['tabular-nums'],
          ...(halo
            ? {
                textShadowColor: halo,
                textShadowRadius: 6,
                textShadowOffset: { width: 0, height: 0 },
              }
            : null),
        }}>
        {children}
      </Text>
    </View>
  );
}

/** Unit-label type: tracked capitals in English, plain in Persian. */
export function unitType(locale: AppLocale, size = { fa: 13, en: 10 }) {
  const fa = locale === 'fa';
  return {
    size: fa ? size.fa : size.en,
    tracking: fa ? 0 : size.en * 0.16,
    upper: !fa,
    weight: 500,
  } as const;
}

interface Box {
  size: number;
  height: number;
}

/**
 * How far to raise a smaller line so it shares a baseline with a larger one when their boxes
 * are bottom-aligned. Centred text sits (ascent − descent) / 2 below the middle of its box.
 */
export function baselineLift(big: Box, small: Box, locale: AppLocale): number {
  const m = locale === 'fa' ? 0.318 : 0.364;
  return big.height / 2 - m * big.size - (small.height / 2 - m * small.size);
}

interface TickProps extends Box {
  dayMs: SharedValue<number>;
  locale: AppLocale;
  color: string;
  format?: Exclude<TickingFormat, 'full'>;
  weight?: 400 | 500;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The running milliseconds, as `508` or `.508`, in a box of the canvas line-height. */
export function Millis({
  dayMs,
  locale,
  size,
  height,
  color,
  format = 'fraction',
  weight = 400,
  style,
  testID = 'clock-ms',
}: TickProps) {
  return (
    <View style={[{ height, justifyContent: 'center' }, style]}>
      <TickingText
        testID={testID}
        dayMs={dayMs}
        format={format}
        locale={locale}
        weight={weight}
        style={{
          // Three tabular digits, plus the point.
          width: Math.ceil(size * (format === 'fraction' ? 2.3 : 2)),
          fontSize: size,
          color,
          textAlign: format === 'fraction' ? 'left' : 'center',
        }}
      />
    </View>
  );
}
