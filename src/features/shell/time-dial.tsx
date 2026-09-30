import { View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { BURGUNDY, type DialVariant, type Tone } from '@/theme/clock-themes';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The canvas `TimeDial` palette per tone. */
const DIAL_TONES: Record<Tone, { bg: string; fg: string; muted: string; ink: string; k: number }> =
  {
    dark: {
      bg: '#151515',
      fg: '#ffffff',
      muted: 'rgba(232, 236, 237, 0.65)',
      ink: '#e8eced',
      k: 1,
    },
    light: {
      bg: '#ffffff',
      fg: '#151515',
      muted: 'rgba(21, 21, 21, 0.68)',
      ink: '#151515',
      k: 0.8,
    },
    gray: {
      bg: '#e8eced',
      fg: '#151515',
      muted: 'rgba(21, 21, 21, 0.68)',
      ink: '#151515',
      k: 0.85,
    },
  };

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
}

const round = (n: number) => {
  'worklet';
  return Math.round(n * 100) / 100;
};

function clampProgress(p: number): number {
  'worklet';
  return Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
}

function ticks(c: number, R: number, minorLength: number, majorLength: number) {
  let minor = '';
  let major = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const isMajor = i % 5 === 0;
    const r1 = R - 2;
    const r2 = R - (isMajor ? majorLength : minorLength);
    const segment = `M${round(c + r1 * Math.sin(a))} ${round(c - r1 * Math.cos(a))}L${round(c + r2 * Math.sin(a))} ${round(c - r2 * Math.cos(a))}`;
    if (isMajor) major += segment;
    else minor += segment;
  }
  return { minor, major };
}

function hourDots(c: number, r: number): string {
  let d = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = round(c + r * Math.sin(a));
    const y = round(c - r * Math.cos(a));
    d += `M${x - 1} ${y}a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`;
  }
  return d;
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
  pointer: boolean;
  size: number;
}

/** Where the arc is drawn and how thick, per variant. */
function arcRing({ R, variant }: Geometry): { r: number; width: number } {
  'worklet';
  if (variant === 'chrono') return { r: R - 6, width: 3 };
  if (variant === 'hairline') return { r: R, width: 1 };
  return { r: R, width: 2 };
}

function handPath({ c, R, variant, pointer, size }: Geometry, p: number): string {
  'worklet';
  const th = p * Math.PI * 2;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  if (variant === 'hairline') return 'M0 0';
  if (variant === 'chrono') {
    const L = R - 9;
    const T = R * 0.28;
    return `M${round(c - T * sin)} ${round(c + T * cos)}L${round(c + L * sin)} ${round(c - L * cos)}`;
  }
  // Light tones draw the hand as a short pointer on the ring rather than from the centre.
  if (pointer) {
    const inner = R - (size >= 90 ? 15 : 11);
    return `M${round(c + inner * sin)} ${round(c - inner * cos)}L${round(c + (R - 2) * sin)} ${round(c - (R - 2) * cos)}`;
  }
  const L = R - 11;
  const T = R * 0.16;
  return `M${round(c - T * sin)} ${round(c + T * cos)}L${round(c + L * sin)} ${round(c - L * cos)}`;
}

function isShared(value: TimeDialProps['progress']): value is SharedValue<number> {
  return typeof value === 'object' && value !== null && 'value' in value;
}

function ProgressMarks({
  geometry,
  progress,
}: {
  geometry: Geometry;
  progress: TimeDialProps['progress'];
}) {
  const { c, variant } = geometry;
  const ring = arcRing(geometry);
  const shared = isShared(progress) ? progress : null;
  const fixed = shared ? 0 : clampProgress(progress as number);
  const arcProps = useAnimatedProps(() => ({
    d: arcPath(c, ring.r, clampProgress(shared ? shared.value : fixed)),
  }));
  const handProps = useAnimatedProps(() => ({
    d: handPath(geometry, clampProgress(shared ? shared.value : fixed)),
  }));
  const beadProps = useAnimatedProps(() => {
    const th = clampProgress(shared ? shared.value : fixed) * Math.PI * 2;
    return { cx: round(c + ring.r * Math.sin(th)), cy: round(c - ring.r * Math.cos(th)) };
  });

  if (!shared) {
    return (
      <>
        {fixed > 0.001 ? (
          <Path
            testID="time-dial-arc"
            d={arcPath(c, ring.r, fixed)}
            fill="none"
            stroke={BURGUNDY}
            strokeWidth={ring.width}
            strokeLinecap="round"
          />
        ) : null}
        {variant === 'hairline' ? (
          <Circle
            cx={round(c + ring.r * Math.sin(fixed * Math.PI * 2))}
            cy={round(c - ring.r * Math.cos(fixed * Math.PI * 2))}
            r={2.5}
            fill={BURGUNDY}
          />
        ) : (
          <Path
            d={handPath(geometry, fixed)}
            fill="none"
            stroke={BURGUNDY}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        )}
      </>
    );
  }
  return (
    <>
      <AnimatedPath
        testID="time-dial-arc"
        animatedProps={arcProps}
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={ring.width}
        strokeLinecap="round"
      />
      {variant === 'hairline' ? (
        <AnimatedCircle animatedProps={beadProps} r={2.5} fill={BURGUNDY} />
      ) : (
        <AnimatedPath
          animatedProps={handProps}
          fill="none"
          stroke={BURGUNDY}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </>
  );
}

/** The static face of each variant: rings, tracks and tick marks. */
function Face({ geometry, tone }: { geometry: Geometry; tone: Tone }) {
  const P = DIAL_TONES[tone];
  const opacity = (v: number) => Math.round(v * P.k * 1000) / 1000;
  const { c, R, variant } = geometry;

  if (variant === 'hairline') {
    return (
      <>
        <Circle
          testID="time-dial-face-hairline"
          cx={c}
          cy={c}
          r={R}
          fill="none"
          stroke={P.ink}
          strokeOpacity={opacity(0.3)}
          strokeWidth={0.75}
        />
        <Path d={hourDots(c, R - 6)} fill={P.ink} fillOpacity={opacity(0.45)} />
      </>
    );
  }
  if (variant === 'chrono') {
    const { minor, major } = ticks(c, R - 8, 3, 6);
    return (
      <>
        <Circle
          testID="time-dial-face-chrono"
          cx={c}
          cy={c}
          r={R}
          fill="none"
          stroke={P.ink}
          strokeOpacity={opacity(0.5)}
          strokeWidth={1.25}
        />
        <Circle
          cx={c}
          cy={c}
          r={R - 6}
          fill="none"
          stroke={P.ink}
          strokeOpacity={opacity(0.12)}
          strokeWidth={3}
        />
        <Path d={minor} fill="none" stroke={P.ink} strokeOpacity={opacity(0.25)} strokeWidth={1} />
        <Path d={major} fill="none" stroke={P.ink} strokeOpacity={opacity(0.6)} strokeWidth={2} />
      </>
    );
  }
  const { minor, major } = ticks(c, R, 5, 8);
  return (
    <>
      <Circle
        testID="time-dial-face-classic"
        cx={c}
        cy={c}
        r={R}
        fill="none"
        stroke={P.ink}
        strokeOpacity={opacity(0.35)}
        strokeWidth={1}
      />
      <Circle
        cx={c}
        cy={c}
        r={R - 10}
        fill="none"
        stroke={P.ink}
        strokeOpacity={opacity(0.12)}
        strokeWidth={1}
      />
      <Path d={minor} fill="none" stroke={P.ink} strokeOpacity={opacity(0.25)} strokeWidth={1} />
      <Path d={major} fill="none" stroke={P.ink} strokeOpacity={opacity(0.55)} strokeWidth={1} />
    </>
  );
}

/**
 * One time unit on a watch-like dial: a face, a burgundy progress arc and the value window.
 * `classic` has ticks and a hand; `chrono` a bezel track, bar indices and a counterweighted
 * hand; `hairline` a single ring, hour dots and a bead at the arc's end.
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
}: TimeDialProps) {
  const P = DIAL_TONES[tone];
  const persianValue = /[۰-۹]/.test(value);
  const persianUnit = /[؀-ۿ]/.test(unit);
  const ls = labelSize ?? (persianUnit ? 13 : 10);
  const lh = Math.round(ls * (persianUnit ? 1.6 : 1.3));
  const c = size / 2;
  const R = c - 1;
  const geometry: Geometry = { c, R, variant, pointer: tone !== 'dark', size };
  const valueWidth = Math.min(Math.round(valueSize * 1.9), size - 16);
  const valueTop = round(c - 4 - (persianValue ? 0.37 : 0.863) * valueSize);
  const halo = {
    textShadowColor: P.bg,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  };
  const hairline = variant === 'hairline';

  return (
    <View
      testID="time-dial"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: solid ? P.bg : 'transparent',
      }}>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Face geometry={geometry} tone={tone} />
        {variant === 'chrono' ? (
          <Rect
            x={round(c - valueWidth / 2)}
            y={round(valueTop - 2)}
            width={valueWidth}
            height={valueSize + 6}
            rx={4}
            fill={P.bg}
            fillOpacity={0.6}
            stroke={P.ink}
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        ) : null}
        <ProgressMarks geometry={geometry} progress={progress} />
        {variant === 'classic' && !geometry.pointer ? (
          <Circle cx={c} cy={c} r={2} fill={BURGUNDY} />
        ) : null}
        {variant === 'chrono' ? (
          <Circle cx={c} cy={c} r={3} fill={P.bg} stroke={BURGUNDY} strokeWidth={1.5} />
        ) : null}
      </Svg>
      <Text
        className={persianValue ? (hairline ? '' : 'font-medium') : 'font-latin font-medium'}
        style={{
          position: 'absolute',
          left: round(c - valueWidth / 2),
          top: valueTop,
          width: valueWidth,
          height: valueSize,
          fontSize: valueSize,
          lineHeight: valueSize,
          textAlign: 'center',
          color: P.fg,
          fontVariant: ['tabular-nums'],
          ...halo,
        }}>
        {value}
      </Text>
      <Text
        className={persianUnit ? 'font-medium' : 'font-latin font-medium'}
        style={{
          position: 'absolute',
          left: 0,
          top: round(c + (persianUnit ? 2 : 4)),
          width: size,
          fontSize: ls,
          lineHeight: lh,
          textAlign: 'center',
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
