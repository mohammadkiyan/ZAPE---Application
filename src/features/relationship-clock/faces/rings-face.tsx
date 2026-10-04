import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BURGUNDY } from '@/theme/clock-themes';
import { dialValue } from '../format';
import {
  FACE_HEIGHT,
  FACE_TONES,
  FACE_WIDTH,
  Line,
  Millis,
  baselineLift,
  circlePath,
  directionOf,
  ringArc,
  ringPoint,
  unitType,
  type FaceProps,
} from './face-kit';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// The device face's rings at 0.8, centred; its legend moves from beside the rings to below.
const CX = 195;
const CY = 228;
const RADII = [120, 104, 88, 72, 56, 40] as const;
const SECONDS_RADIUS = RADII[5];
const TRACKS = RADII.map((r) => circlePath(CX, CY, r)).join('');
/** Years outermost, fading inward; seconds are the burgundy ring. */
const ARCS = [
  { unit: 'y', opacity: 0.92, width: 2 },
  { unit: 'mo', opacity: 0.8, width: 1.75 },
  { unit: 'd', opacity: 0.7, width: 1.75 },
  { unit: 'h', opacity: 0.6, width: 1.5 },
  { unit: 'mi', opacity: 0.5, width: 1.5 },
] as const;
const LEGEND = ['mo', 'd', 'h', 'mi', 's'] as const;
const VALUE = { size: 22, height: 28 };
const FRACTION = { size: 13, height: 18 };

/** Rings: six concentric rings, years in the middle and the other units listed below. */
export function RingsFace({ tone, locale, elapsed, progress, secondProgress, dayMs }: FaceProps) {
  const { t } = useTranslation('relationship');
  const P = FACE_TONES[tone];
  const label = unitType(locale);
  const secondsArc = useAnimatedProps(() => ({
    d: ringArc(CX, CY, SECONDS_RADIUS, secondProgress.value),
  }));
  const bead = useAnimatedProps(() => {
    const point = ringPoint(CX, CY, SECONDS_RADIUS, secondProgress.value);
    return { cx: point.x, cy: point.y };
  });

  return (
    <View testID="face-rings" style={StyleSheet.absoluteFill}>
      <Svg width={FACE_WIDTH} height={FACE_HEIGHT} style={StyleSheet.absoluteFill}>
        <Path d={TRACKS} fill="none" stroke={P.ink} strokeOpacity={0.12 * P.k} strokeWidth={1} />
        <Path
          d={`M${CX} ${CY - 32}V${CY - 126}`}
          fill="none"
          stroke={P.ink}
          strokeOpacity={0.3 * P.k}
          strokeWidth={1}
        />
        {ARCS.map((arc, index) => (
          <Path
            key={arc.unit}
            testID={`ring-${arc.unit}`}
            d={ringArc(CX, CY, RADII[index]!, progress[arc.unit])}
            fill="none"
            stroke={P.fg}
            strokeOpacity={arc.opacity}
            strokeWidth={arc.width}
            strokeLinecap="round"
          />
        ))}
        <AnimatedPath
          testID="ring-s"
          animatedProps={secondsArc}
          fill="none"
          stroke={BURGUNDY}
          strokeWidth={2.25}
          strokeLinecap="round"
        />
        <AnimatedCircle
          animatedProps={bead}
          r={3.5}
          fill={BURGUNDY}
          stroke={P.fg}
          strokeWidth={1}
        />
      </Svg>
      <View
        testID="clock-dial-y"
        style={{ position: 'absolute', left: CX - 48, top: CY - 28, width: 96 }}>
        <Line size={36} height={40} weight={500} color={P.fg} align="center">
          {dialValue(elapsed.y, locale)}
        </Line>
        <Line {...label} height={16} color={P.muted} align="center">
          {t('clock.y')}
        </Line>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 40,
          top: 370,
          width: FACE_WIDTH - 80,
          direction: directionOf(locale),
        }}>
        {LEGEND.map((unit, index) => (
          <View
            key={unit}
            testID={`clock-dial-${unit}`}
            style={{
              height: 34,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: index === LEGEND.length - 1 ? 'transparent' : P.line,
            }}>
            <Line {...label} height={16} color={P.muted}>
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
        ))}
      </View>
    </View>
  );
}
