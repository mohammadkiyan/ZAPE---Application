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
  circlePath,
  directionOf,
  ringPoint,
  unitType,
  type FaceProps,
} from './face-kit';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// The device face's orbits at 0.8, centred; its side legends move into one row below.
const CX = 195;
const CY = 262;
const ORBIT = { y: 141, mo: 120, d: 99, h: 78, mi: 58, s: 38 } as const;
const PLANET = { y: 5.2, mo: 4, d: 3.5, h: 3, mi: 2.6, s: 2.6 } as const;
const SLOW = ['y', 'mo', 'd', 'h', 'mi'] as const;
const ORBITS = Object.values(ORBIT)
  .map((r) => circlePath(CX, CY, r))
  .join('');

/** The graduated limb outside the outer orbit: 72 ticks, every sixth one longer. */
function buildLimb() {
  let minor = '';
  let major = '';
  for (let i = 0; i < 72; i++) {
    const isMajor = i % 6 === 0;
    const from = ringPoint(CX, CY, 144, i / 72);
    const to = ringPoint(CX, CY, isMajor ? 152 : 147, i / 72);
    const segment = `M${from.x} ${from.y}L${to.x} ${to.y}`;
    if (isMajor) major += segment;
    else minor += segment;
  }
  return { minor, major };
}
const LIMB = buildLimb();

/**
 * Astrolabe: each unit is a planet on its own orbit, at its progress around the ring, and the
 * thread joins them from years in to seconds.
 */
export function AstrolabeFace({
  tone,
  locale,
  elapsed,
  progress,
  secondProgress,
  dayMs,
}: FaceProps) {
  const { t } = useTranslation('relationship');
  const P = FACE_TONES[tone];
  const label = unitType(locale);
  const planets = SLOW.map((unit) => ({
    unit,
    ...ringPoint(CX, CY, ORBIT[unit], progress[unit]),
  }));
  const threadStart = planets
    .map((planet, index) => `${index === 0 ? 'M' : 'L'}${planet.x} ${planet.y}`)
    .join('');
  const thread = useAnimatedProps(() => {
    const point = ringPoint(CX, CY, ORBIT.s, secondProgress.value);
    return { d: `${threadStart}L${point.x} ${point.y}` };
  });
  const seconds = useAnimatedProps(() => {
    const point = ringPoint(CX, CY, ORBIT.s, secondProgress.value);
    return { cx: point.x, cy: point.y };
  });
  const two = (unit: 'h' | 'mi' | 's') => dialValue(elapsed[unit], locale);

  return (
    <View testID="face-astrolabe" style={StyleSheet.absoluteFill}>
      <Svg width={FACE_WIDTH} height={FACE_HEIGHT} style={StyleSheet.absoluteFill}>
        <Path d={ORBITS} fill="none" stroke={P.ink} strokeOpacity={0.14 * P.k} strokeWidth={1} />
        <Path
          d={LIMB.minor}
          fill="none"
          stroke={P.ink}
          strokeOpacity={0.22 * P.k}
          strokeWidth={1}
        />
        <Path
          d={LIMB.major}
          fill="none"
          stroke={P.ink}
          strokeOpacity={0.45 * P.k}
          strokeWidth={1.25}
        />
        <AnimatedPath
          testID="astrolabe-thread"
          animatedProps={thread}
          fill="none"
          stroke={BURGUNDY}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {planets.slice(1).map((planet) => (
          <Circle
            key={planet.unit}
            testID={`planet-${planet.unit}`}
            cx={planet.x}
            cy={planet.y}
            r={PLANET[planet.unit]}
            fill={P.fg}
          />
        ))}
        <AnimatedCircle testID="planet-s" animatedProps={seconds} r={PLANET.s} fill={P.fg} />
        <Circle
          testID="planet-y"
          cx={planets[0]!.x}
          cy={planets[0]!.y}
          r={PLANET.y}
          fill={BURGUNDY}
          stroke={P.fg}
          strokeWidth={1.5}
        />
      </Svg>
      <View
        testID="clock-dial-y"
        style={{ position: 'absolute', left: CX - 40, top: CY - 26, width: 80 }}>
        <Line size={32} height={36} weight={500} color={P.fg} align="center" halo={P.bg}>
          {dialValue(elapsed.y, locale)}
        </Line>
        <Line {...label} height={16} color={P.muted} align="center">
          {t('clock.y')}
        </Line>
      </View>
      <View
        style={{
          position: 'absolute',
          left: 20,
          top: 438,
          width: FACE_WIDTH - 40,
          flexDirection: 'row',
          justifyContent: 'space-between',
          direction: directionOf(locale),
        }}>
        {(['mo', 'd'] as const).map((unit) => (
          <View key={unit} testID={`clock-dial-${unit}`} style={{ alignItems: 'center' }}>
            <Line size={26} height={36} weight={500} color={P.fg}>
              {dialValue(elapsed[unit], locale)}
            </Line>
            <Line {...label} height={16} color={P.muted}>
              {t(`clock.${unit}`)}
            </Line>
          </View>
        ))}
        <View testID="clock-time" style={{ alignItems: 'center' }}>
          <Line size={22} height={36} weight={500} color={P.fg}>
            {`${two('h')}:${two('mi')}:${two('s')}`}
          </Line>
          <Line {...label} height={16} color={P.muted}>
            {t('clock.hms')}
          </Line>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Millis dayMs={dayMs} locale={locale} format="ms" size={18} height={36} color={P.muted} />
          <Line {...label} height={16} color={P.muted}>
            {t('clock.ms')}
          </Line>
        </View>
      </View>
    </View>
  );
}
