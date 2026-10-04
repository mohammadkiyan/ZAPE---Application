import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BURGUNDY, type Tone } from '@/theme/clock-themes';
import { dialValue } from '../format';
import {
  FACE_HEIGHT,
  FACE_TONES,
  FACE_WIDTH,
  Line,
  Millis,
  baselineLift,
  ringArc,
  unitType,
  type FaceProps,
} from './face-kit';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BEAD: Record<Tone, { fill: string; edge: string }> = {
  dark: { fill: '#151515', edge: 'rgba(232, 236, 237, 0.35)' },
  light: { fill: '#e8eced', edge: 'rgba(21, 21, 21, 0)' },
  gray: { fill: '#ffffff', edge: 'rgba(21, 21, 21, 0)' },
};

type Unit = 'y' | 'mo' | 'd' | 'h' | 'mi' | 's';
interface Bead {
  unit: Unit;
  x: number;
  y: number;
  size: number;
  font: number;
}

const GAP = 20;
const f = (v: number) => Math.round(v * 10) / 10;

/**
 * One strand: beads spaced along a shallow hanging curve, the thread through their centres
 * and a knot at its end. Ported from the device `FaceBracelet`, whose single strand of six
 * beads is wider than a phone; here it hangs as two.
 */
function buildStrand(base: number, beads: readonly (readonly [Unit, number, number])[]) {
  const curveY = (x: number) => base - 0.0008 * (x - FACE_WIDTH / 2) ** 2;
  const total = beads.reduce((sum, [, size]) => sum + size, 0) + GAP * (beads.length - 1);
  let x = (FACE_WIDTH - total) / 2;
  const placed: Bead[] = beads.map(([unit, size, font]) => {
    const cx = x + size / 2;
    x += size + GAP;
    return { unit, x: f(cx), y: f(curveY(cx)), size, font };
  });
  const points = [
    [16, f(curveY(16))],
    ...placed.map((bead) => [bead.x, bead.y]),
    [FACE_WIDTH - 16, f(curveY(FACE_WIDTH - 16))],
  ] as [number, number][];
  const at = (i: number) => points[Math.min(points.length - 1, Math.max(0, i))]!;
  let thread = `M${at(0)[0]} ${at(0)[1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    thread += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return { beads: placed, thread, knot: at(points.length - 1) };
}

const STRANDS = [
  buildStrand(200, [
    ['y', 110, 34],
    ['mo', 90, 28],
    ['d', 90, 28],
  ]),
  buildStrand(370, [
    ['h', 68, 21],
    ['mi', 68, 21],
    ['s', 68, 21],
  ]),
];
const BEADS = STRANDS.flatMap((strand) => strand.beads);
const SECONDS = BEADS.find((bead) => bead.unit === 's')!;
const MS = { size: 20, height: 24 };
const MS_LABEL_HEIGHT = 16;

/** Bracelet: each unit is a bead on the thread, with its progress drawn around it. */
export function BraceletFace({
  tone,
  locale,
  elapsed,
  progress,
  secondProgress,
  dayMs,
}: FaceProps) {
  const { t } = useTranslation('relationship');
  const P = FACE_TONES[tone];
  const C = BEAD[tone];
  const label = unitType(locale, { fa: 12, en: 9 });
  const secondsArc = useAnimatedProps(() => ({
    d: ringArc(SECONDS.x, SECONDS.y, SECONDS.size / 2 + 5, Math.min(secondProgress.value, 0.999)),
  }));
  const arc = {
    fill: 'none',
    stroke: BURGUNDY,
    strokeWidth: 1.75,
    strokeLinecap: 'round',
  } as const;

  return (
    <View testID="face-bracelet" style={StyleSheet.absoluteFill}>
      <Svg width={FACE_WIDTH} height={FACE_HEIGHT} style={StyleSheet.absoluteFill}>
        {STRANDS.map((strand, index) => (
          <Path
            key={index}
            testID="bracelet-thread"
            d={strand.thread}
            fill="none"
            stroke={BURGUNDY}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        {STRANDS.map((strand, index) => (
          <Circle key={index} cx={strand.knot[0]} cy={strand.knot[1]} r={3.5} fill={BURGUNDY} />
        ))}
        {BEADS.map((bead) => (
          <Circle
            key={bead.unit}
            testID={`bead-${bead.unit}`}
            cx={bead.x}
            cy={bead.y}
            r={bead.size / 2}
            fill={C.fill}
            stroke={C.edge}
            strokeWidth={1}
          />
        ))}
        {BEADS.map((bead) =>
          bead.unit === 's' ? (
            <AnimatedPath key={bead.unit} animatedProps={secondsArc} {...arc} />
          ) : (
            <Path
              key={bead.unit}
              d={ringArc(bead.x, bead.y, bead.size / 2 + 5, Math.min(progress[bead.unit], 0.999))}
              {...arc}
            />
          )
        )}
      </Svg>
      {BEADS.map((bead) => (
        <View
          key={bead.unit}
          testID={`clock-dial-${bead.unit}`}
          style={{
            position: 'absolute',
            left: bead.x - 55,
            top: bead.y - bead.size / 2,
            width: 110,
          }}>
          <Line size={bead.font} height={bead.size} weight={500} color={P.fg} align="center">
            {dialValue(elapsed[bead.unit], locale)}
          </Line>
          <Line {...label} height={16} color={P.muted} align="center" style={{ marginTop: 12 }}>
            {t(`clock.${bead.unit}`)}
          </Line>
        </View>
      ))}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 482,
          width: FACE_WIDTH,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 10,
          direction: 'ltr',
        }}>
        <Millis dayMs={dayMs} locale={locale} format="ms" {...MS} weight={500} color={P.fg} />
        <Line
          {...label}
          height={MS_LABEL_HEIGHT}
          color={P.muted}
          style={{
            marginBottom: baselineLift(MS, { size: label.size, height: MS_LABEL_HEIGHT }, locale),
          }}>
          {t('clock.ms')}
        </Line>
      </View>
    </View>
  );
}
