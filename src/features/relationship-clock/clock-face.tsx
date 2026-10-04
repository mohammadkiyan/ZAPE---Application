import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import type { Relationship } from '@/api/contracts/relationship';
import { Text } from '@/components/ui/text';
import { Backdrop } from '@/features/clock-themes/backdrop';
import { TimeDial, tallLine } from '@/features/shell/time-dial';
import { Thread } from '@/features/shell/thread';
import { usePreferences } from '@/preferences/preferences';
import { BURGUNDY, THEMES, TONES, type BackgroundId, type ThemeId } from '@/theme/clock-themes';
import { dialProgress } from './elapsed';
import { dialValue, formatStartDate } from './format';
import { TickingText } from './ticking-text';
import { useRelationshipClock } from './use-clock-tick';

// The canvas `ClockFace` part is a 390 × 690 artboard. Coordinates below are the artboard's;
// the tab header takes everything above the names row, so the face starts there.
const DESIGN_WIDTH = 390;
const TOP = 108;
/** Down to where the canvas starts the Clock style panel, less the tab's own gap. */
const HEIGHT = 550;
const BACKDROP_BOTTOM = 690;
const BACKDROP_CENTER_Y = 420;
/** The backdrop runs up behind the tab header and status bar; the scroll view clips the rest. */
const BACKDROP_BLEED = 240;

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

const LABEL_LARGE = { fa: 14, en: 11 };
const LABEL_MEDIUM = { fa: 13, en: 10 };
const LABEL_SMALL = { fa: 12, en: 9 };
const DIALS: DialSpot[] = [
  { unit: 'y', x: 195, y: 276, size: 132, valueSize: 46, labelSize: LABEL_LARGE, marks: '|3|9' },
  { unit: 'mo', x: 84, y: 408, size: 108, valueSize: 35, labelSize: LABEL_MEDIUM, marks: '|3|9' },
  { unit: 'd', x: 306, y: 408, size: 108, valueSize: 35, labelSize: LABEL_MEDIUM, marks: '|7|22' },
  { unit: 'h', x: 86, y: 544, size: 88, valueSize: 27, labelSize: LABEL_SMALL },
  { unit: 'mi', x: 195, y: 564, size: 92, valueSize: 27, labelSize: LABEL_SMALL },
  { unit: 's', x: 304, y: 544, size: 88, valueSize: 27, labelSize: LABEL_SMALL },
];

/** Where the thread runs out: the rule leading into the milliseconds readout. */
const RULE = { y: 634, end: 161 };
const MS_LEFT = 171;
const MS_TOP = 622;
const BEAD = { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BURGUNDY };

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
    [hours.x, 606],
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

export interface ClockFaceProps {
  relationship: Pick<Relationship, 'start' | 'calendar'>;
  /** The clock style: its tone, dial variant and thread weight all come from the theme. */
  theme: ThemeId;
  background: BackgroundId;
  /** False while the screen is not focused: ticking stops. */
  visible?: boolean;
}

/**
 * The Rel Clock face, ported from the canvas `ClockFace` part: «شما» and «همراه» joined by a
 * bar, the since line and title, six dials strung on the thread, and the running milliseconds
 * where the thread ends. One structure for every theme; the theme only picks tone, dial
 * variant and backdrop.
 */
export function ClockFace({ relationship, theme, background, visible = true }: ClockFaceProps) {
  const { t } = useTranslation('relationship');
  const locale = usePreferences((state) => state.locale);
  const { width: windowWidth } = useWindowDimensions();
  const { tone, dial: variant } = THEMES[theme];
  const palette = TONES[tone];
  const clock = useRelationshipClock(relationship.start, { visible });
  const e = clock.elapsed;
  const progress = dialProgress(e);
  const values: Record<Unit, { value: number; progress: number | typeof clock.secondProgress }> = {
    y: { value: e.y, progress: progress.y },
    mo: { value: e.mo, progress: progress.mo },
    d: { value: e.d, progress: progress.d },
    h: { value: e.h, progress: progress.h },
    mi: { value: e.mi, progress: progress.mi },
    s: { value: e.s, progress: clock.secondProgress },
  };
  const summary = t('clock.summary', {
    y: dialValue(e.y, locale),
    mo: dialValue(e.mo, locale),
    d: dialValue(e.d, locale),
  });

  const fa = locale === 'fa';
  // Narrow phones scale the artboard down; wider ones centre it.
  const k = Math.min(1, windowWidth / DESIGN_WIDTH);
  const width = DESIGN_WIDTH * k;
  const y = (canvasY: number) => (canvasY - TOP) * k;
  const row = (canvasY: number, height: number) =>
    ({
      position: 'absolute',
      top: y(canvasY),
      left: 0,
      right: 0,
      height,
      alignItems: 'center',
      justifyContent: 'center',
    }) as const;
  const eyebrow = (size: { fa: number; en: number }, tracking: number) =>
    ({
      fontSize: fa ? size.fa : size.en,
      lineHeight: tallLine(fa ? size.fa : size.en),
      letterSpacing: fa ? 0 : size.en * tracking,
      textTransform: fa ? 'none' : 'uppercase',
    }) as const;

  return (
    <View
      testID="clock-face"
      accessible
      accessibilityLabel={summary}
      style={{ width, height: HEIGHT * k, alignSelf: 'center' }}>
      <Backdrop
        background={background}
        tone={tone}
        width={windowWidth}
        height={BACKDROP_BLEED + y(BACKDROP_BOTTOM)}
        cx={windowWidth / 2}
        cy={BACKDROP_BLEED + y(BACKDROP_CENTER_Y)}
        scale={k}
        style={{ position: 'absolute', top: -BACKDROP_BLEED, left: (width - windowWidth) / 2 }}
      />
      <Svg
        width={width}
        height={HEIGHT * k}
        viewBox={`0 ${TOP} ${DESIGN_WIDTH} ${HEIGHT}`}
        style={StyleSheet.absoluteFill}>
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

      <View style={[row(108, 20), { flexDirection: 'row', gap: 12 }]}>
        <Text
          className="w-auto p-0 font-medium"
          style={[eyebrow({ fa: 13, en: 11 }, 0.16), { color: palette.fg2 }]}>
          {t('clock.you')}
        </Text>
        <View style={{ width: 72, flexDirection: 'row', alignItems: 'center' }}>
          <View style={BEAD} />
          <View style={{ flex: 1, height: 1.5, backgroundColor: BURGUNDY }} />
          <View style={BEAD} />
        </View>
        <Text
          className="w-auto p-0 font-medium"
          style={[eyebrow({ fa: 13, en: 11 }, 0.16), { color: palette.fg2 }]}>
          {t('clock.partner')}
        </Text>
      </View>
      <View style={row(134, fa ? 26 : 22)}>
        <Text
          className="p-0 text-center"
          style={{
            fontSize: fa ? 16 : 15,
            lineHeight: tallLine(fa ? 16 : 15),
            color: palette.fg2,
          }}>
          {t('clock.since', {
            date: formatStartDate(relationship.start, relationship.calendar, locale),
          })}
        </Text>
      </View>
      <View style={row(178, 20)}>
        <Text
          className="p-0 text-center font-medium"
          style={[eyebrow({ fa: 13, en: 12 }, 0.2), { color: palette.muted }]}>
          {t('clock.title')}
        </Text>
      </View>

      {/* Dial positions are the artboard's in either writing direction. */}
      <View style={[StyleSheet.absoluteFill, { direction: 'ltr' }]}>
        {DIALS.map((dial) => {
          const size = Math.round(dial.size * k);
          return (
            <View
              key={dial.unit}
              testID={`clock-dial-${dial.unit}`}
              style={{
                position: 'absolute',
                left: dial.x * k - size / 2,
                top: y(dial.y) - size / 2,
              }}>
              <TimeDial
                value={dialValue(values[dial.unit].value, locale)}
                unit={t(`clock.${dial.unit}`)}
                progress={values[dial.unit].progress}
                tone={tone}
                variant={variant}
                size={size}
                valueSize={Math.round(dial.valueSize * k)}
                labelSize={Math.round(dial.labelSize[locale] * k)}
                marks={dial.marks}
                solid={false}
              />
            </View>
          );
        })}
        <View
          style={{
            position: 'absolute',
            left: MS_LEFT * k,
            top: y(MS_TOP),
            height: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
          <TickingText
            testID="clock-ms"
            dayMs={clock.dayMs}
            format="ms"
            locale={locale}
            style={{ width: 48, fontSize: 24, color: palette.fg }}
          />
          <Text
            className="w-auto p-0 font-medium"
            style={[eyebrow({ fa: 11, en: 9 }, 0.16), { color: palette.muted }]}>
            {t('clock.ms')}
          </Text>
        </View>
      </View>
    </View>
  );
}
