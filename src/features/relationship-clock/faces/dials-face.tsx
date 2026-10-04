import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { TimeDial } from '@/features/shell/time-dial';
import { Thread } from '@/features/shell/thread';
import { THEMES, TONES } from '@/theme/clock-themes';
import { dialValue } from '../format';
import {
  FACE_HEIGHT,
  FACE_WIDTH,
  Line,
  Millis,
  baselineLift,
  unitType,
  type FaceProps,
} from './face-kit';

type Unit = 'y' | 'mo' | 'd' | 'h' | 'mi' | 's';
interface DialSpot {
  unit: Unit;
  x: number;
  y: number;
  size: number;
  valueSize: number;
  labelSize: { fa: number; en: number };
  marks?: string;
}

// Dial centres from the mobile canvas `ClockFace` part, measured from its names row.
const LABEL_LARGE = { fa: 14, en: 11 };
const LABEL_MEDIUM = { fa: 13, en: 10 };
const LABEL_SMALL = { fa: 12, en: 9 };
const DIALS: DialSpot[] = [
  { unit: 'y', x: 195, y: 168, size: 132, valueSize: 46, labelSize: LABEL_LARGE, marks: '|3|9' },
  { unit: 'mo', x: 84, y: 300, size: 108, valueSize: 35, labelSize: LABEL_MEDIUM, marks: '|3|9' },
  { unit: 'd', x: 306, y: 300, size: 108, valueSize: 35, labelSize: LABEL_MEDIUM, marks: '|7|22' },
  { unit: 'h', x: 86, y: 436, size: 88, valueSize: 27, labelSize: LABEL_SMALL },
  { unit: 'mi', x: 195, y: 456, size: 92, valueSize: 27, labelSize: LABEL_SMALL },
  { unit: 's', x: 304, y: 436, size: 88, valueSize: 27, labelSize: LABEL_SMALL },
];

/** Where the thread runs out: the rule leading into the milliseconds readout. */
const RULE = { y: 526, end: 161 };
const MS = { size: 24, height: 24 };
const MS_LABEL_HEIGHT = 16;

/**
 * The thread through the six dials and on to the milliseconds, with the discs that clear it
 * (and the backdrop) from under each dial. Ported from the canvas `ClockFace.geo()`.
 */
function buildThread() {
  type Point = readonly [number, number];
  const f = (v: number) => Math.round(v * 10) / 10;
  const spot = (unit: Unit) => DIALS.find((dial) => dial.unit === unit)!;
  const P = (['h', 'mi', 's', 'd', 'y', 'mo'] as const).map((unit): Point => {
    const dial = spot(unit);
    return [dial.x, dial.y];
  });
  const n = P.length;
  const at = (i: number) => P[((i % n) + n) % n]!;
  // A closed Catmull-Rom loop through the dial centres, as cubic segments.
  const segments: [Point, Point, Point, Point][] = P.map((p1, i) => {
    const p0 = at(i - 1);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    return [
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ];
  });
  const hours = spot('h');
  const curveEnd = Math.max(hours.x + 22, RULE.end - 26);
  segments.push([
    [hours.x, hours.y],
    [hours.x, RULE.y - 28],
    [f(hours.x + (curveEnd - hours.x) * 0.35), RULE.y],
    [curveEnd, RULE.y],
  ]);
  let d = `M${at(0)[0]} ${at(0)[1]}`;
  let length = 0;
  for (const [a, b, c, e] of segments) {
    d += `C${f(b[0])} ${f(b[1])} ${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`;
    let [px, py] = a;
    for (let j = 1; j <= 32; j++) {
      const t = j / 32;
      const u = 1 - t;
      const along = (i: 0 | 1) =>
        u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * e[i];
      const x = along(0);
      const y = along(1);
      length += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
  }
  d += `L${RULE.end} ${RULE.y}`;
  length += RULE.end - curveEnd;
  const disks = DIALS.map(({ x, y, size }) => {
    const r = size / 2 + 4;
    return `M${f(x - r)} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }).join('');
  return { d, length: Math.ceil(length), disks };
}

const THREAD = buildThread();

/**
 * Six dials strung on the thread, which ends at the running milliseconds. Constellation,
 * Porcelain, Chronograph and Mist share it and differ in tone and dial variant.
 */
export function DialsFace({
  theme,
  tone,
  locale,
  elapsed,
  progress,
  secondProgress,
  dayMs,
}: FaceProps) {
  const { t } = useTranslation('relationship');
  const variant = THEMES[theme].dial;
  const palette = TONES[tone];
  const label = unitType(locale, { fa: 11, en: 9 });

  return (
    <View testID="face-dials" style={StyleSheet.absoluteFill}>
      <Svg width={FACE_WIDTH} height={FACE_HEIGHT} style={StyleSheet.absoluteFill}>
        <Thread
          key={theme}
          testID="clock-thread"
          d={THREAD.d}
          length={THREAD.length}
          strokeWidth={variant === 'hairline' ? 1.25 : 1.75}
          opacity={0.92}
          durationMs={520}
          delayMs={120}
        />
        <Path d={THREAD.disks} fill={palette.bg} />
      </Svg>
      {DIALS.map((dial) => (
        <View
          key={dial.unit}
          testID={`clock-dial-${dial.unit}`}
          style={{
            position: 'absolute',
            left: dial.x - dial.size / 2,
            top: dial.y - dial.size / 2,
          }}>
          <TimeDial
            value={dialValue(elapsed[dial.unit], locale)}
            unit={t(`clock.${dial.unit}`)}
            progress={dial.unit === 's' ? secondProgress : progress[dial.unit]}
            tone={tone}
            variant={variant}
            size={dial.size}
            valueSize={dial.valueSize}
            labelSize={dial.labelSize[locale]}
            marks={dial.marks}
            solid={false}
          />
        </View>
      ))}
      <View
        style={{
          position: 'absolute',
          left: RULE.end + 10,
          top: RULE.y - MS.height / 2,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 10,
        }}>
        <Millis dayMs={dayMs} locale={locale} format="ms" {...MS} weight={500} color={palette.fg} />
        <Line
          {...label}
          height={MS_LABEL_HEIGHT}
          color={palette.muted}
          style={{
            marginBottom: baselineLift(MS, { size: label.size, height: MS_LABEL_HEIGHT }, locale),
          }}>
          {t('clock.ms')}
        </Line>
      </View>
    </View>
  );
}
