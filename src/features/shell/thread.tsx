import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import { BURGUNDY } from '@/theme/clock-themes';
import { useReducedMotion } from '@/theme/motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface ThreadProps {
  d: string;
  /** Approximate path length, used for the draw-in dash. */
  length: number;
  strokeWidth?: number;
  durationMs?: number;
  delayMs?: number;
  opacity?: number;
  testID?: string;
}

/** The red thread, drawn in on mount. Renders fully drawn when the OS asks for reduced motion. */
export function Thread({
  d,
  length,
  strokeWidth = 2,
  durationMs = 900,
  delayMs = 0,
  opacity,
  testID,
}: ThreadProps) {
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(length);
  useEffect(() => {
    if (reduceMotion) return;
    offset.value = length;
    offset.value = withDelay(
      delayMs,
      withTiming(0, { duration: durationMs, easing: Easing.out(Easing.cubic) })
    );
  }, [reduceMotion, length, durationMs, delayMs, offset]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  if (reduceMotion) {
    return (
      <Path
        testID={testID}
        d={d}
        fill="none"
        stroke={BURGUNDY}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        strokeLinecap="round"
      />
    );
  }
  return (
    <AnimatedPath
      testID={testID}
      d={d}
      fill="none"
      stroke={BURGUNDY}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeDasharray={[length, length]}
      animatedProps={animatedProps}
    />
  );
}
