import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/ui/text';
import { BURGUNDY, type Tone } from '@/theme/clock-themes';

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
  /** 0–1 around the ring, clockwise from 12 o'clock. */
  progress: number;
  tone: Tone;
  size?: number;
  valueSize?: number;
  labelSize?: number;
  /** Paint the tone background behind the dial. */
  solid?: boolean;
  /** Only `classic` is ported so far; `add-relationship` adds `chrono` and `hairline`. */
  variant?: 'classic';
}

const round = (n: number) => Math.round(n * 100) / 100;

function ticks(c: number, R: number): { minor: string; major: string } {
  let minor = '';
  let major = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const isMajor = i % 5 === 0;
    const r1 = R - 2;
    const r2 = R - (isMajor ? 8 : 5);
    const segment = `M${round(c + r1 * Math.sin(a))} ${round(c - r1 * Math.cos(a))}L${round(c + r2 * Math.sin(a))} ${round(c - r2 * Math.cos(a))}`;
    if (isMajor) major += segment;
    else minor += segment;
  }
  return { minor, major };
}

function arcPath(c: number, R: number, p: number): string {
  if (p <= 0.001) return '';
  if (p >= 0.999) {
    return `M${c} ${c - R}A${R} ${R} 0 1 1 ${c} ${c + R}A${R} ${R} 0 1 1 ${c} ${c - R}`;
  }
  const th = p * Math.PI * 2;
  return `M${c} ${round(c - R)}A${R} ${R} 0 ${th > Math.PI ? 1 : 0} 1 ${round(c + R * Math.sin(th))} ${round(c - R * Math.cos(th))}`;
}

/** One time unit on a watch-like dial: ticks, a burgundy progress arc and the value window. */
export function TimeDial({
  value,
  unit,
  progress,
  tone,
  size = 108,
  valueSize = 38,
  labelSize,
  solid = true,
}: TimeDialProps) {
  const P = DIAL_TONES[tone];
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const persianValue = /[۰-۹]/.test(value);
  const persianUnit = /[؀-ۿ]/.test(unit);
  const ls = labelSize ?? (persianUnit ? 13 : 10);
  const lh = Math.round(ls * (persianUnit ? 1.6 : 1.3));
  const c = size / 2;
  const R = c - 1;
  const opacity = (v: number) => Math.round(v * P.k * 1000) / 1000;
  const { minor, major } = ticks(c, R);
  const th = p * Math.PI * 2;
  // Light tones draw the hand as a short pointer on the ring rather than from the centre.
  const pointer = tone !== 'dark';
  const inner = R - (size >= 90 ? 15 : 11);
  const L = R - 11;
  const T = R * 0.16;
  const hand = pointer
    ? `M${round(c + inner * Math.sin(th))} ${round(c - inner * Math.cos(th))}L${round(c + (R - 2) * Math.sin(th))} ${round(c - (R - 2) * Math.cos(th))}`
    : `M${round(c - T * Math.sin(th))} ${round(c + T * Math.cos(th))}L${round(c + L * Math.sin(th))} ${round(c - L * Math.cos(th))}`;
  const valueWidth = Math.min(Math.round(valueSize * 1.9), size - 16);
  const valueTop = round(c - 4 - (persianValue ? 0.77 : 0.863) * valueSize);
  const halo = {
    textShadowColor: P.bg,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  };

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
        <Circle
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
        {p > 0.001 ? (
          <Path
            d={arcPath(c, R, p)}
            fill="none"
            stroke={BURGUNDY}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ) : null}
        <Path d={hand} fill="none" stroke={BURGUNDY} strokeWidth={1.5} strokeLinecap="round" />
        {pointer ? null : <Circle cx={c} cy={c} r={2} fill={BURGUNDY} />}
      </Svg>
      <Text
        className={persianValue ? 'font-medium' : 'font-latin font-medium'}
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
