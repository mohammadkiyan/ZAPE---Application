import { memo, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TONES, type BackgroundId, type Tone } from '@/theme/clock-themes';

interface PatternGeometry {
  a: string;
  aO: number;
  b: string;
  bO: number;
  dots: string;
  dotsO: number;
  dots2: string;
  dots2O: number;
}

const round = (v: number) => Math.round(v * 10) / 10;
const circle = (x: number, y: number, r: number) =>
  `M${round(x - r)} ${round(y)}a${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0a${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0`;

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

/** Pattern paths ported from the canvas `Backdrop` part. `s` scales the pattern (thumbnails use ~0.3). */
export function buildPattern(
  bg: BackgroundId,
  w: number,
  h: number,
  cx: number,
  cy: number,
  s: number
): PatternGeometry {
  const o: PatternGeometry = {
    a: '',
    aO: 0,
    b: '',
    bO: 0,
    dots: '',
    dotsO: 0,
    dots2: '',
    dots2O: 0,
  };
  switch (bg) {
    case 'orbits':
      [42, 72, 102, 132].forEach((r) => (o.a += circle(cx, cy, r * s)));
      [162, 192, 230, 270].forEach((r) => (o.b += circle(cx, cy, r * s)));
      o.aO = 0.07;
      o.bO = 0.045;
      break;
    case 'graticule': {
      const step = 24 * s;
      for (let i = Math.floor(-cx / step); i <= Math.ceil((w - cx) / step); i++) {
        const seg = `M${round(cx + i * step)} 0V${h}`;
        if (i % 5 === 0) o.b += seg;
        else o.a += seg;
      }
      for (let j = Math.floor(-cy / step); j <= Math.ceil((h - cy) / step); j++) {
        const seg = `M0 ${round(cy + j * step)}H${w}`;
        if (j % 5 === 0) o.b += seg;
        else o.a += seg;
      }
      o.aO = 0.035;
      o.bO = 0.075;
      break;
    }
    case 'dots': {
      const step = 18 * s;
      const r = Math.max(0.6, 0.9 * s);
      for (let i = Math.floor(-cx / step); i <= Math.ceil((w - cx) / step); i++) {
        for (let j = Math.floor(-cy / step); j <= Math.ceil((h - cy) / step); j++) {
          o.dots += circle(cx + i * step, cy + j * step, r);
        }
      }
      o.dotsO = 0.2;
      break;
    }
    case 'sunburst': {
      const R = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 4;
      for (let k = 0; k < 120; k++) {
        const a = (k / 120) * Math.PI * 2;
        const seg = `M${round(cx + 36 * s * Math.sin(a))} ${round(cy - 36 * s * Math.cos(a))}L${round(cx + R * Math.sin(a))} ${round(cy - R * Math.cos(a))}`;
        if (k % 10 === 0) o.b += seg;
        else o.a += seg;
      }
      o.aO = 0.04;
      o.bO = 0.08;
      break;
    }
    case 'ruled': {
      const step = 14 * s;
      for (let j = Math.floor(-cy / step); j <= Math.ceil((h - cy) / step); j++) {
        const y = round(cy + j * step);
        if (y < 0 || y > h) continue;
        const seg = `M0 ${y}H${w}`;
        if (j % 6 === 0) o.b += seg;
        else o.a += seg;
      }
      o.aO = 0.045;
      o.bO = 0.085;
      break;
    }
    case 'contour':
      for (let k = 0; k < 13; k++) {
        const rk = (26 + 24 * k) * s;
        let d = '';
        for (let q = 0; q <= 180; q++) {
          const th = (q / 180) * Math.PI * 2;
          const r =
            rk *
            (1 + 0.07 * Math.sin(3 * th + 0.55 * k) + 0.045 * Math.sin(5 * th + 1.3 * k + 0.4));
          d += `${q === 0 ? 'M' : 'L'}${round(cx + 30 * s + r * Math.cos(th))} ${round(cy + 8 * s + r * Math.sin(th) * 0.86)}`;
        }
        if (k % 4 === 0) o.b += `${d}Z`;
        else o.a += `${d}Z`;
      }
      o.aO = 0.05;
      o.bO = 0.09;
      break;
    case 'guilloche':
      for (let k = 0; k < 48; k++) {
        const a = (k / 48) * Math.PI * 2;
        o.a += circle(cx + 34 * s * Math.cos(a), cy + 34 * s * Math.sin(a), 150 * s);
      }
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * Math.PI * 2;
        o.b += circle(cx + 70 * s * Math.cos(a), cy + 70 * s * Math.sin(a), 250 * s);
      }
      o.aO = 0.035;
      o.bO = 0.025;
      break;
    case 'stars': {
      const rnd = seededRandom(7);
      const k2 = Math.max(s, 0.55);
      for (let k = 0; k < 120; k++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = 0.5 + rnd() * 0.9;
        if (r > 1.15) o.dots2 += circle(x, y, r * 1.2 * k2);
        else o.dots += circle(x, y, r * k2);
      }
      o.dotsO = 0.3;
      o.dots2O = 0.6;
      break;
    }
    case 'silk': {
      const step = 11 * s;
      for (let k = -Math.ceil(h / step) - 1; k <= Math.ceil(w / step) + 1; k++) {
        const x0 = k * step;
        o.a += `M${round(x0)} 0L${round(x0 + h)} ${h}`;
        o.b += `M${round(x0 + h)} 0L${round(x0)} ${h}`;
      }
      o.aO = 0.032;
      o.bO = 0.032;
      break;
    }
    case 'plain':
      break;
  }
  return o;
}

export interface BackdropProps {
  background: BackgroundId;
  tone: Tone;
  width: number;
  height: number;
  cx?: number;
  cy?: number;
  scale?: number;
  /** Multiplies pattern opacity; thumbnails boost faint patterns so they read at small sizes. */
  boost?: number;
  /** Paint the tone background behind the pattern. */
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Decorative clock-theme background. Hidden from assistive technology. */
export const Backdrop = memo(function Backdrop({
  background,
  tone,
  width,
  height,
  cx = width / 2,
  cy = 285,
  scale = 1,
  boost = 1,
  solid = false,
  style,
}: BackdropProps) {
  const geometry = useMemo(
    () => buildPattern(background, width, height, cx, cy, scale),
    [background, width, height, cx, cy, scale]
  );
  const palette = TONES[tone];
  const k = (tone === 'light' ? 0.85 : 1) * boost;
  const opacity = (v: number) => Math.min(1, Math.round(v * k * 1000) / 1000);
  return (
    <View
      testID={`backdrop-${background}`}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, overflow: 'hidden' },
        solid && { backgroundColor: palette.bg },
        style,
      ]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {geometry.a ? (
          <Path
            d={geometry.a}
            fill="none"
            stroke={palette.ink}
            strokeWidth={1}
            strokeOpacity={opacity(geometry.aO)}
          />
        ) : null}
        {geometry.b ? (
          <Path
            d={geometry.b}
            fill="none"
            stroke={palette.ink}
            strokeWidth={1}
            strokeOpacity={opacity(geometry.bO)}
          />
        ) : null}
        {geometry.dots ? (
          <Path d={geometry.dots} fill={palette.ink} fillOpacity={opacity(geometry.dotsO)} />
        ) : null}
        {geometry.dots2 ? (
          <Path d={geometry.dots2} fill={palette.ink} fillOpacity={opacity(geometry.dots2O)} />
        ) : null}
      </Svg>
    </View>
  );
});
