import { View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { BURGUNDY, type DialVariant, type Tone } from '@/theme/clock-themes';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The canvas `TimeDial` palette per tone. */
const DIAL_TONES: Record<
  Tone,
  { bg: string; fg: string; muted: string; ink: string; edge: string; k: number }
> = {
  dark: {
    bg: '#151515',
    fg: '#ffffff',
    muted: 'rgba(232, 236, 237, 0.65)',
    ink: '#e8eced',
    edge: 'rgba(232, 236, 237, 0.4)',
    k: 1,
  },
  light: {
    bg: '#ffffff',
    fg: '#151515',
    muted: 'rgba(21, 21, 21, 0.68)',
    ink: '#151515',
    edge: 'rgba(21, 21, 21, 0.35)',
    k: 0.8,
  },
  gray: {
    bg: '#e8eced',
    fg: '#151515',
    muted: 'rgba(21, 21, 21, 0.68)',
    ink: '#151515',
    edge: 'rgba(21, 21, 21, 0.35)',
    k: 0.85,
  },
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const MARK_WIDTH = 24;

export interface TimeDialProps {
  /** The number in the window, already localized (e.g. «۰۵»). */
  value: string;
  unit: string;
  /** 0–1 around the ring, clockwise from 12 o'clock. A shared value animates without re-rendering. */
  progress: number | SharedValue<number>;
  tone: Tone;
  size?: number;
  valueSize?: number;
  labelSize?: number;
  /** Paint the tone background behind the dial. */
  solid?: boolean;
  variant?: DialVariant;
  /** Chrono sub-dial numerals at 12, 3 and 9 o'clock, e.g. `|3|9`. Shown at 90pt and up. */
  marks?: string;
}

const round = (n: number) => {
  'worklet';
  return Math.round(n * 100) / 100;
};

function clampProgress(p: number): number {
  'worklet';
  return Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
}

/**
 * A line height no shorter than either bundled font's own (Noto Sans Arabic is 2.11em). In a
 * shorter line iOS and Android place the glyphs differently; in a taller one both centre them.
 */
export function tallLine(fontSize: number): number {
  return Math.ceil(fontSize * 2.2);
}

/** A canvas text box (top and CSS line-height) as a native one with the same centre. */
function textBox(top: number, height: number, fontSize: number) {
  const lineHeight = tallLine(fontSize);
  return {
    position: 'absolute',
    top: round(top + (height - lineHeight) / 2),
    height: lineHeight,
    lineHeight,
    fontSize,
    // The owned Text pads right-to-left text from the top; positions here are exact.
    paddingTop: 0,
    textAlign: 'center',
  } as const;
}

function ticks(c: number, R: number, majorLength: number) {
  let minor = '';
  let major = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const isMajor = i % 5 === 0;
    const r1 = R - 2;
    const r2 = R - (isMajor ? majorLength : 5);
    const segment = `M${round(c + r1 * Math.sin(a))} ${round(c - r1 * Math.cos(a))}L${round(c + r2 * Math.sin(a))} ${round(c - r2 * Math.cos(a))}`;
    if (isMajor) major += segment;
    else minor += segment;
  }
  return { minor, major };
}

export function arcPath(c: number, R: number, p: number): string {
  'worklet';
  if (p <= 0.001) return 'M0 0';
  if (p >= 0.999) {
    return `M${c} ${c - R}A${R} ${R} 0 1 1 ${c} ${c + R}A${R} ${R} 0 1 1 ${c} ${c - R}`;
  }
  const th = p * Math.PI * 2;
  return `M${c} ${round(c - R)}A${R} ${R} 0 ${th > Math.PI ? 1 : 0} 1 ${round(c + R * Math.sin(th))} ${round(c - R * Math.cos(th))}`;
}

interface Geometry {
  c: number;
  R: number;
  variant: DialVariant;
  /** Classic on the light tones: the hand is a short pointer on the ring, with no pivot. */
  pointer: boolean;
  size: number;
}

/** How far the chrono hand's counterweight sits behind the centre. */
function tailLength({ R, variant }: Geometry): number {
  'worklet';
  return R * (variant === 'chrono' ? 0.24 : 0.16);
}

function handPath(geometry: Geometry, p: number): string {
  'worklet';
  const { c, R, variant, pointer, size } = geometry;
  if (variant === 'hairline') return 'M0 0';
  const th = p * Math.PI * 2;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  if (pointer) {
    const inner = R - (size >= 90 ? 15 : 11);
    return `M${round(c + inner * sin)} ${round(c - inner * cos)}L${round(c + (R - 2) * sin)} ${round(c - (R - 2) * cos)}`;
  }
  const L = variant === 'chrono' ? R - 6 : R - 11;
  const T = tailLength(geometry);
  return `M${round(c - T * sin)} ${round(c + T * cos)}L${round(c + L * sin)} ${round(c - L * cos)}`;
}

function isShared(value: TimeDialProps['progress']): value is SharedValue<number> {
  return typeof value === 'object' && value !== null && 'value' in value;
}

/** The burgundy marks that move with progress: the arc, the hand and the chrono counterweight. */
function ProgressMarks({
  geometry,
  progress,
  bg,
}: {
  geometry: Geometry;
  progress: TimeDialProps['progress'];
  bg: string;
}) {
  const { c, R, variant } = geometry;
  const arcWidth = variant === 'hairline' ? 1.5 : 2;
  const tail = tailLength(geometry);
  const shared = isShared(progress) ? progress : null;
  const fixed = shared ? 0 : clampProgress(progress as number);
  const arcProps = useAnimatedProps(() => ({
    d: arcPath(c, R, clampProgress(shared ? shared.value : fixed)),
  }));
  const handProps = useAnimatedProps(() => ({
    d: handPath(geometry, clampProgress(shared ? shared.value : fixed)),
  }));
  const weightProps = useAnimatedProps(() => {
    const th = clampProgress(shared ? shared.value : fixed) * Math.PI * 2;
    return { cx: round(c - tail * Math.sin(th)), cy: round(c + tail * Math.cos(th)) };
  });
  const weight = { r: 2.6, fill: bg, stroke: BURGUNDY, strokeWidth: 1.5 };
  const hand = {
    fill: 'none',
    stroke: BURGUNDY,
    strokeWidth: 1.5,
    strokeLinecap: 'round',
  } as const;
  const arc = { ...hand, strokeWidth: arcWidth };

  if (!shared) {
    const th = fixed * Math.PI * 2;
    return (
      <>
        {variant !== 'chrono' && fixed > 0.001 ? (
          <Path testID="time-dial-arc" d={arcPath(c, R, fixed)} {...arc} />
        ) : null}
        {variant !== 'hairline' ? (
          <Path testID="time-dial-hand" d={handPath(geometry, fixed)} {...hand} />
        ) : null}
        {variant === 'chrono' ? (
          <Circle
            cx={round(c - tail * Math.sin(th))}
            cy={round(c + tail * Math.cos(th))}
            {...weight}
          />
        ) : null}
      </>
    );
  }
  return (
    <>
      {variant !== 'chrono' ? (
        <AnimatedPath testID="time-dial-arc" animatedProps={arcProps} {...arc} />
      ) : null}
      {variant !== 'hairline' ? (
        <AnimatedPath testID="time-dial-hand" animatedProps={handProps} {...hand} />
      ) : null}
      {variant === 'chrono' ? <AnimatedCircle animatedProps={weightProps} {...weight} /> : null}
    </>
  );
}

/** The static face of each variant: disc, rings and tick marks. */
function Face({ geometry, tone }: { geometry: Geometry; tone: Tone }) {
  const P = DIAL_TONES[tone];
  const opacity = (v: number) => Math.round(v * P.k * 1000) / 1000;
  const { c, R, variant } = geometry;

  if (variant === 'hairline') {
    return (
      <Circle
        testID="time-dial-face-hairline"
        cx={c}
        cy={c}
        r={R}
        fill="none"
        stroke={P.ink}
        strokeOpacity={opacity(0.3)}
        strokeWidth={1}
      />
    );
  }
  const chrono = variant === 'chrono';
  const { minor, major } = ticks(c, R, chrono ? 9 : 8);
  return (
    <>
      {chrono ? <Circle cx={c} cy={c} r={R - 10} fill={P.ink} fillOpacity={opacity(0.06)} /> : null}
      <Circle
        testID={`time-dial-face-${variant}`}
        cx={c}
        cy={c}
        r={R}
        fill="none"
        stroke={P.ink}
        strokeOpacity={opacity(chrono ? 0.6 : 0.35)}
        strokeWidth={chrono ? 1.5 : 1}
      />
      {chrono ? null : (
        <Circle
          cx={c}
          cy={c}
          r={R - 10}
          fill="none"
          stroke={P.ink}
          strokeOpacity={opacity(0.12)}
          strokeWidth={1}
        />
      )}
      <Path
        testID="time-dial-ticks"
        d={minor}
        fill="none"
        stroke={P.ink}
        strokeOpacity={opacity(chrono ? 0.3 : 0.25)}
        strokeWidth={1}
      />
      <Path
        d={major}
        fill="none"
        stroke={P.ink}
        strokeOpacity={opacity(chrono ? 0.8 : 0.55)}
        strokeWidth={chrono ? 1.5 : 1}
      />
    </>
  );
}

/** Where the canvas puts the value and the unit label, per variant. */
function textLayout(
  { c, R, variant, size }: Geometry,
  valueSize: number,
  persianValue: boolean,
  persianUnit: boolean,
  labelLine: number
) {
  if (variant === 'chrono') {
    const fontSize = Math.round(valueSize * 0.64);
    const width = Math.round(fontSize * 1.55 + 6);
    return {
      fontSize,
      width,
      height: Math.round(fontSize * 1.2 + 4),
      top: round(c + (size >= 90 ? 7 : 5)),
      labelTop: round(c - R * 0.5 - labelLine / 2),
    };
  }
  if (variant === 'hairline') {
    const fontSize = Math.round(valueSize * 1.08);
    return {
      fontSize,
      width: Math.min(Math.round(fontSize * 1.9), size - 12),
      height: fontSize,
      top: round(c - 5 - fontSize * 0.5),
      labelTop: round(c + fontSize * 0.5 + (persianUnit ? -2 : 1)),
    };
  }
  return {
    fontSize: valueSize,
    width: Math.min(Math.round(valueSize * 1.9), size - 16),
    height: valueSize,
    top: round(c - 4 - (persianValue ? 0.77 : 0.863) * valueSize),
    labelTop: round(c + (persianUnit ? 2 : 4)),
  };
}

/**
 * One time unit on a watch-like dial, ported from the canvas `TimeDial` part. `classic` has
 * two rings, ticks, a progress arc and a hand; `chrono` a heavier bezel, a counterweighted
 * hand and the value in a window below the centre; `hairline` a single ring and arc around a
 * larger, lighter value.
 */
export function TimeDial({
  value,
  unit,
  progress,
  tone,
  size = 108,
  valueSize = 38,
  labelSize,
  solid = true,
  variant = 'classic',
  marks,
}: TimeDialProps) {
  const P = DIAL_TONES[tone];
  const persianValue = /[۰-۹]/.test(value);
  const persianUnit = /[؀-ۿ]/.test(unit);
  const ls = labelSize ?? (persianUnit ? 13 : 10);
  const lh = Math.round(ls * (persianUnit ? 1.6 : 1.3));
  const c = size / 2;
  const R = c - 1;
  const chrono = variant === 'chrono';
  const hairline = variant === 'hairline';
  const geometry: Geometry = {
    c,
    R,
    variant,
    pointer: variant === 'classic' && tone !== 'dark',
    size,
  };
  const text = textLayout(geometry, valueSize, persianValue, persianUnit, lh);
  const valueLeft = round(c - text.width / 2);
  const halo = {
    textShadowColor: P.bg,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  };
  const numerals = String(marks ?? '').split('|');
  const showMarks = chrono && size >= 90 && numerals.length === 3;
  const numeral = (index: number) =>
    persianValue
      ? (numerals[index] ?? '').replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]!)
      : (numerals[index] ?? '');
  const markSpots = [
    { x: c, y: c - R + 17 },
    { x: c + R - 17, y: c },
    { x: c - R + 17, y: c },
  ];

  return (
    <View
      testID="time-dial"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: solid ? P.bg : 'transparent',
        // The dial is drawn left-to-right in either writing direction.
        direction: 'ltr',
      }}>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Face geometry={geometry} tone={tone} />
        <ProgressMarks geometry={geometry} progress={progress} bg={P.bg} />
        {chrono ? (
          <>
            <Circle cx={c} cy={c} r={3.2} fill={BURGUNDY} />
            <Circle cx={c} cy={c} r={1.2} fill={P.bg} />
          </>
        ) : null}
        {variant === 'classic' && !geometry.pointer ? (
          <Circle cx={c} cy={c} r={2} fill={BURGUNDY} />
        ) : null}
      </Svg>
      {showMarks
        ? markSpots.map((spot, index) => (
            <Text
              key={index}
              testID="time-dial-mark"
              className={persianValue ? undefined : 'font-latin'}
              style={{
                ...textBox(spot.y - 3.75, 7.5, 7.5),
                left: round(spot.x - MARK_WIDTH / 2),
                width: MARK_WIDTH,
                color: P.muted,
              }}>
              {numeral(index)}
            </Text>
          ))
        : null}
      {chrono ? (
        <View
          testID="time-dial-window"
          style={{
            position: 'absolute',
            left: valueLeft,
            top: text.top,
            width: text.width,
            height: text.height,
            borderWidth: 1,
            borderColor: P.edge,
            borderRadius: 1,
            backgroundColor: P.bg,
          }}
        />
      ) : null}
      <Text
        className={cn(!persianValue && 'font-latin', !hairline && 'font-medium')}
        style={{
          ...textBox(text.top, text.height, text.fontSize),
          left: valueLeft,
          width: text.width,
          color: P.fg,
          fontVariant: ['tabular-nums'],
          ...halo,
        }}>
        {value}
      </Text>
      <Text
        className={persianUnit ? 'font-medium' : 'font-latin font-medium'}
        style={{
          ...textBox(text.labelTop, lh, ls),
          left: 0,
          width: size,
          color: P.muted,
          letterSpacing: persianUnit ? 0 : ls * (size >= 90 ? 0.14 : 0.1),
          textTransform: persianUnit ? 'none' : 'uppercase',
          ...halo,
        }}>
        {unit}
      </Text>
    </View>
  );
}
