import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BURGUNDY } from '@/theme/clock-themes';
import { dialValue } from '../format';
import {
  FACE_TONES,
  FACE_WIDTH,
  Line,
  Millis,
  baselineLift,
  directionOf,
  unitType,
  type FaceProps,
} from './face-kit';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// The device face puts label, rule and value on one line. A phone is too narrow for that, so
// each unit keeps its label and value above a full-width rule.
const X0 = 28;
const X1 = FACE_WIDTH - 28;
const BASE = 18;
const RULE_HEIGHT = 32;
const TOP = 104;
const PITCH = 72;
/** Unit, divisions along the rule, and how often a division is a major tick. */
const RULES = [
  ['y', 12, 3],
  ['mo', 12, 3],
  ['d', 30, 5],
  ['h', 24, 6],
  ['mi', 60, 5],
  ['s', 60, 5],
] as const;
const VALUE = { size: 28, height: 34 };
const FRACTION = { size: 15, height: 20 };
const LABEL_HEIGHT = 16;

const round = (n: number) => {
  'worklet';
  return Math.round(n * 10) / 10;
};

const TICKS = RULES.map(([, divisions, every]) => {
  let minor = '';
  let major = '';
  for (let j = 0; j <= divisions; j++) {
    const x = round(X0 + ((X1 - X0) * j) / divisions);
    if (j % every === 0) major += `M${x} ${BASE}v9`;
    else minor += `M${x} ${BASE}v5`;
  }
  return { minor, major };
});

function cursorX(p: number): number {
  'worklet';
  return round(X0 + (X1 - X0) * Math.min(1, Math.max(0, p)));
}
function fillPath(p: number): string {
  'worklet';
  return `M${X0} ${BASE}H${cursorX(p)}`;
}
function cursorPath(p: number): string {
  'worklet';
  return `M${cursorX(p)} ${BASE - 10}V${BASE + 12}`;
}
function pointerPath(p: number): string {
  'worklet';
  return `M${round(cursorX(p) - 4)} ${BASE - 17}h8l-4 6z`;
}

/** The burgundy fill, cursor and pointer of one rule. */
function Cursor({ progress }: { progress: number | SharedValue<number> }) {
  const shared = typeof progress === 'number' ? null : progress;
  const fixed = shared ? 0 : (progress as number);
  const fill = useAnimatedProps(() => ({ d: fillPath(shared ? shared.value : fixed) }));
  const cursor = useAnimatedProps(() => ({ d: cursorPath(shared ? shared.value : fixed) }));
  const pointer = useAnimatedProps(() => ({ d: pointerPath(shared ? shared.value : fixed) }));
  if (!shared) {
    return (
      <>
        <Path
          testID="rule-fill"
          d={fillPath(fixed)}
          fill="none"
          stroke={BURGUNDY}
          strokeWidth={2}
        />
        <Path d={cursorPath(fixed)} fill="none" stroke={BURGUNDY} strokeWidth={1.5} />
        <Path d={pointerPath(fixed)} fill={BURGUNDY} />
      </>
    );
  }
  return (
    <>
      <AnimatedPath
        testID="rule-fill"
        animatedProps={fill}
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={2}
      />
      <AnimatedPath animatedProps={cursor} fill="none" stroke={BURGUNDY} strokeWidth={1.5} />
      <AnimatedPath animatedProps={pointer} fill={BURGUNDY} />
    </>
  );
}

/** Ruler: six graduated rules, each with a cursor at the unit's progress. */
export function RulerFace({ tone, locale, elapsed, progress, secondProgress, dayMs }: FaceProps) {
  const { t } = useTranslation('relationship');
  const P = FACE_TONES[tone];
  const label = unitType(locale, { fa: 13, en: 11 });

  return (
    <View testID="face-ruler" style={StyleSheet.absoluteFill}>
      {RULES.map(([unit], index) => (
        <View
          key={unit}
          testID={`clock-dial-${unit}`}
          style={{ position: 'absolute', left: 0, top: TOP + index * PITCH, width: FACE_WIDTH }}>
          <View
            style={{
              height: VALUE.height,
              marginHorizontal: X0,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              direction: directionOf(locale),
            }}>
            <Line
              {...label}
              height={LABEL_HEIGHT}
              color={P.muted}
              style={{
                marginBottom: baselineLift(
                  VALUE,
                  { size: label.size, height: LABEL_HEIGHT },
                  locale
                ),
              }}>
              {t(`clock.${unit}`)}
            </Line>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', direction: 'ltr' }}>
              <Line {...VALUE} weight={500} color={P.fg}>
                {dialValue(elapsed[unit], locale)}
              </Line>
              {unit === 's' ? (
                <Millis
                  dayMs={dayMs}
                  locale={locale}
                  {...FRACTION}
                  color={P.muted}
                  style={{ marginBottom: baselineLift(VALUE, FRACTION, locale) }}
                />
              ) : null}
            </View>
          </View>
          <Svg width={FACE_WIDTH} height={RULE_HEIGHT} style={{ marginTop: 2 }}>
            <Path
              d={`M${X0} ${BASE}H${X1}`}
              fill="none"
              stroke={P.ink}
              strokeOpacity={0.3 * P.k}
              strokeWidth={1}
            />
            <Path
              d={TICKS[index]!.minor}
              fill="none"
              stroke={P.ink}
              strokeOpacity={0.28 * P.k}
              strokeWidth={1}
            />
            <Path
              d={TICKS[index]!.major}
              fill="none"
              stroke={P.ink}
              strokeOpacity={0.6 * P.k}
              strokeWidth={1}
            />
            <Cursor progress={unit === 's' ? secondProgress : progress[unit]} />
          </Svg>
        </View>
      ))}
    </View>
  );
}
