import { memo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { BURGUNDY, THEMES, TONES, type ThemeId } from '@/theme/clock-themes';

export const GLYPH_WIDTH = 112;
export const GLYPH_HEIGHT = 70;

const round = (v: number) => Math.round(v * 10) / 10;
const circ = (x: number, y: number, r: number) =>
  `M${round(x - r)} ${round(y)}a${r} ${r} 0 1 0 ${round(2 * r)} 0a${r} ${r} 0 1 0 ${round(-2 * r)} 0`;
const arc = (x: number, y: number, r: number, progress: number) => {
  const th = Math.min(progress, 0.999) * Math.PI * 2;
  return `M${round(x)} ${round(y - r)}A${r} ${r} 0 ${th > Math.PI ? 1 : 0} 1 ${round(x + r * Math.sin(th))} ${round(y - r * Math.cos(th))}`;
};

// Six time units (years … seconds) as dials on a thread loop, as drawn on the canvas.
const UNIT_PROGRESS = { y: 0.54, mo: 0.5, d: 0.4, h: 0.125, mi: 0.52, s: 0.19 } as const;
type Unit = keyof typeof UNIT_PROGRESS;
const UNITS: Record<Unit, [number, number, number]> = {
  y: [56, 18, 8.1],
  mo: [38.8, 32.9, 6.9],
  d: [73.2, 32.9, 6.9],
  h: [40.1, 48.5, 5.4],
  mi: [56, 50.7, 5.7],
  s: [71.9, 48.5, 5.4],
};
const UNIT_IDS: Unit[] = ['y', 'mo', 'd', 'h', 'mi', 's'];

const CONSTELLATION_LOOP = (() => {
  const P = (['h', 'mi', 's', 'd', 'y', 'mo'] as Unit[]).map((k) => UNITS[k]);
  let loop = `M${P[0]![0]} ${P[0]![1]}`;
  for (let i = 0; i < 6; i++) {
    const p0 = P[(i + 5) % 6]!;
    const p1 = P[i]!;
    const p2 = P[(i + 1) % 6]!;
    const p3 = P[(i + 2) % 6]!;
    loop += `C${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)} ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return `${loop}C40.1 57 43 62 47 62L53 62`;
})();

function ConstellationGlyph({ theme }: { theme: ThemeId }) {
  const { dial, tone } = THEMES[theme];
  const palette = TONES[tone];
  let marks = '';
  for (const k of UNIT_IDS) {
    const [x, y, r] = UNITS[k];
    const th = UNIT_PROGRESS[k] * Math.PI * 2;
    if (dial !== 'chrono') marks += arc(x, y, r, UNIT_PROGRESS[k]);
    if (dial !== 'hairline')
      marks += `M${x} ${y}L${round(x + (r - 1.6) * Math.sin(th))} ${round(y - (r - 1.6) * Math.cos(th))}`;
  }
  const ringOpacity = dial === 'chrono' ? 0.8 : dial === 'hairline' ? 0.4 : 0.55;
  const ringWidth = dial === 'chrono' ? 1.3 : 0.8;
  return (
    <>
      <Path
        d={CONSTELLATION_LOOP}
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={dial === 'hairline' ? 1 : 1.2}
        strokeLinecap="round"
      />
      {UNIT_IDS.map((k) => (
        <Circle
          key={k}
          cx={UNITS[k][0]}
          cy={UNITS[k][1]}
          r={UNITS[k][2]}
          fill={palette.bg}
          stroke={palette.ink}
          strokeOpacity={ringOpacity}
          strokeWidth={ringWidth}
        />
      ))}
      <Path d={marks} fill="none" stroke={BURGUNDY} strokeWidth={1} strokeLinecap="round" />
    </>
  );
}

const RING_PROGRESS = [0.54, 0.5, 0.4, 0.125, 0.52, 0.19];

function RingsGlyph() {
  const [x, y] = [30, 36];
  let tracks = '';
  let arcs = '';
  [26, 22, 18, 14, 10, 6].forEach((r, i) => {
    tracks += circ(x, y, r);
    if (i < 5) arcs += arc(x, y, r, RING_PROGRESS[i]!);
  });
  return (
    <>
      <Path d={tracks} fill="none" stroke="#e8eced" strokeOpacity={0.16} strokeWidth={0.8} />
      <Path
        d={arcs}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.8}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <Path
        d={arc(x, y, 6, 0.19)}
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M66 18.5h12M66 27.5h14M66 36.5h10M66 45.5h13M66 54.5h12"
        fill="none"
        stroke="#e8eced"
        strokeOpacity={0.35}
        strokeWidth={1.2}
      />
      <Path
        d="M92 18.5h8M92 27.5h8M92 36.5h8M92 45.5h8M92 54.5h8"
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.85}
        strokeWidth={2.4}
      />
    </>
  );
}

function AstrolabeGlyph() {
  const [x, y] = [56, 35];
  let orbits = '';
  let limb = '';
  let planets = '';
  const points: [number, number][] = [];
  [30, 25, 20, 15, 10, 6].forEach((r, i) => {
    orbits += circ(x, y, r);
    const th = RING_PROGRESS[i]! * Math.PI * 2;
    const px = x + r * Math.sin(th);
    const py = y - r * Math.cos(th);
    points.push([round(px), round(py)]);
    planets += circ(px, py, i === 0 ? 1.9 : 1.4);
  });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    limb += `M${round(x + 31.5 * Math.sin(a))} ${round(y - 31.5 * Math.cos(a))}L${round(x + 34 * Math.sin(a))} ${round(y - 34 * Math.cos(a))}`;
  }
  const thread = points.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px} ${py}`).join('');
  return (
    <>
      <Path d={orbits} fill="none" stroke="#e8eced" strokeOpacity={0.2} strokeWidth={0.8} />
      <Path d={limb} fill="none" stroke="#e8eced" strokeOpacity={0.45} strokeWidth={0.8} />
      <Path d={thread} fill="none" stroke={BURGUNDY} strokeWidth={1.1} strokeLinejoin="round" />
      <Path d={planets} fill="#ffffff" />
    </>
  );
}

function RulerGlyph() {
  let ticks = '';
  for (const y of [15.5, 27.5, 39.5, 51.5]) {
    for (let j = 0; j <= 12; j++)
      ticks += `M${round(14 + j * (68 / 12))} ${y}v${j % 3 === 0 ? 3.5 : 2}`;
  }
  return (
    <>
      <Path
        d="M14 15.5H82M14 27.5H82M14 39.5H82M14 51.5H82"
        fill="none"
        stroke="#151515"
        strokeOpacity={0.3}
        strokeWidth={0.8}
      />
      <Path d={ticks} fill="none" stroke="#151515" strokeOpacity={0.4} strokeWidth={0.7} />
      <Path
        d="M14 15.5H51M14 27.5H48M14 39.5H41M14 51.5H22.5"
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={1.4}
      />
      <Path d="M51 11v8M48 23v8M41 35v8M22.5 47v8" fill="none" stroke={BURGUNDY} strokeWidth={1} />
      <Path
        d="M89 13.5h11M89 25.5h11M89 37.5h11M89 49.5h11"
        fill="none"
        stroke="#151515"
        strokeOpacity={0.8}
        strokeWidth={3}
      />
    </>
  );
}

function EditorialGlyph() {
  return (
    <>
      <SvgText
        x={12}
        y={54}
        fill="#151515"
        fontFamily="Inter-SemiBold"
        fontSize={52}
        letterSpacing={-2}>
        5
      </SvgText>
      <Path d="M13 60.5H41" fill="none" stroke={BURGUNDY} strokeWidth={1.6} />
      <Path
        d="M56 26.5H100M56 41.5H100"
        fill="none"
        stroke="#151515"
        strokeOpacity={0.15}
        strokeWidth={0.8}
      />
      <Path
        d="M56 19.5h10M56 34.5h12M56 49.5h26"
        fill="none"
        stroke="#151515"
        strokeOpacity={0.85}
        strokeWidth={5}
      />
      <Path
        d="M70 20.5h14M72 35.5h9"
        fill="none"
        stroke="#151515"
        strokeOpacity={0.35}
        strokeWidth={2}
      />
    </>
  );
}

function FlapGlyph() {
  return (
    <>
      <Path
        d="M41 9h14v19H41zM57 9h14v19H57zM31 36h10v13H31zM43 36h10v13H43zM59 36h10v13H59zM71 36h10v13H71zM35 55h7v9h-7zM43.5 55h7v9h-7zM52.5 55h7v9h-7zM61 55h7v9h-7zM70 55h7v9h-7zM78.5 55h7v9h-7z"
        fill="#151515"
      />
      <Path
        d="M41 18.5h30M31 42.5h22M59 42.5h22"
        fill="none"
        stroke="#e8eced"
        strokeOpacity={0.3}
        strokeWidth={0.6}
      />
      <Path d="M50 32.5h12" fill="none" stroke={BURGUNDY} strokeWidth={1.4} />
    </>
  );
}

function BraceletGlyph() {
  return (
    <>
      <Path
        d="M3 24C12 30 16 34 20 36.5S34 44 42 45.5S56 47 66 46S80 43 88 40.5S100 35 109 30"
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <Path
        d="M11.5 36.5a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0M36.2 44a6.8 6.8 0 1 0 13.6 0a6.8 6.8 0 1 0-13.6 0M52.2 46.5a6.8 6.8 0 1 0 13.6 0a6.8 6.8 0 1 0-13.6 0M68 46a5.2 5.2 0 1 0 10.4 0a5.2 5.2 0 1 0-10.4 0M80.6 42.8a5.2 5.2 0 1 0 10.4 0a5.2 5.2 0 1 0-10.4 0M93 38.5a5.2 5.2 0 1 0 10.4 0a5.2 5.2 0 1 0-10.4 0"
        fill="#e8eced"
      />
    </>
  );
}

function GlyphArt({ theme }: { theme: ThemeId }) {
  switch (theme) {
    case 'rings':
      return <RingsGlyph />;
    case 'astrolabe':
      return <AstrolabeGlyph />;
    case 'ruler':
      return <RulerGlyph />;
    case 'editorial':
      return <EditorialGlyph />;
    case 'flap':
      return <FlapGlyph />;
    case 'bracelet':
      return <BraceletGlyph />;
    default:
      return <ConstellationGlyph theme={theme} />;
  }
}

/** A 112×70 thumbnail of a clock theme, ported from the canvas `ThemeGlyph` part. Decorative. */
export const ThemeGlyph = memo(function ThemeGlyph({ theme }: { theme: ThemeId }) {
  return (
    <View
      testID={`theme-glyph-${theme}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: GLYPH_WIDTH,
        height: GLYPH_HEIGHT,
        backgroundColor: TONES[THEMES[theme].tone].bg,
        overflow: 'hidden',
      }}>
      <Svg width={GLYPH_WIDTH} height={GLYPH_HEIGHT} viewBox={`0 0 ${GLYPH_WIDTH} ${GLYPH_HEIGHT}`}>
        <GlyphArt theme={theme} />
      </Svg>
    </View>
  );
});
