import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { BURGUNDY } from '@/theme/clock-themes';
import { useReducedMotion } from '@/theme/motion';
import { useTone } from '@/theme/theme';
import {
  BARS,
  DOT,
  IDENT_BUILT,
  IDENT_REST,
  IDENT_SPEED,
  MARK_BOX,
  SHEEN_WIDTH,
  SPLATTER,
  STAGE,
  atmosphereOpacity,
  barRect,
  beadProps,
  dropProps,
  dropletProps,
  flashOpacity,
  identTime,
  ringProps,
  sheenProps,
  tipProps,
} from './zape-ident';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

type Time = SharedValue<number>;

function Atmosphere({ t }: { t: Time }) {
  const props = useAnimatedProps(() => ({ opacity: atmosphereOpacity(t.get()) }));
  return (
    <AnimatedRect
      width={STAGE.width}
      height={STAGE.height}
      fill="url(#zape-atmos)"
      animatedProps={props}
    />
  );
}

function Bar({ index, t, color }: { index: number; t: Time; color: string }) {
  const bar = BARS[index]!;
  const props = useAnimatedProps(() => barRect(bar, t.get()));
  return <AnimatedRect fill={color} animatedProps={props} />;
}

function Drop({ t, color }: { t: Time; color: string }) {
  const props = useAnimatedProps(() => dropProps(t.get()));
  return <AnimatedPath fill={color} animatedProps={props} />;
}

function Droplet({ index, t, color }: { index: number; t: Time; color: string }) {
  const droplet = SPLATTER[index]!;
  const props = useAnimatedProps(() => dropletProps(droplet, t.get()));
  return <AnimatedPath fill={color} animatedProps={props} />;
}

function Ring({ index, t, color }: { index: 0 | 1 | 2; t: Time; color: string }) {
  const props = useAnimatedProps(() => ringProps(index, t.get()));
  return (
    <AnimatedCircle cx={DOT.cx} cy={DOT.cy} fill="none" stroke={color} animatedProps={props} />
  );
}

function Bead({ t, color }: { t: Time; color: string }) {
  const props = useAnimatedProps(() => beadProps(t.get()));
  return <AnimatedEllipse cx={DOT.cx} fill={color} animatedProps={props} />;
}

function Flash({ t }: { t: Time }) {
  const props = useAnimatedProps(() => ({ opacity: flashOpacity(t.get()) }));
  return (
    <AnimatedCircle cx={DOT.cx} cy={DOT.cy} r={130} fill="url(#zape-glow)" animatedProps={props} />
  );
}

function Sheen({ t }: { t: Time }) {
  const props = useAnimatedProps(() => sheenProps(t.get()));
  return (
    <AnimatedRect
      y={MARK_BOX.y - 40}
      width={SHEEN_WIDTH}
      height={MARK_BOX.h + 80}
      fill="url(#zape-sheen)"
      animatedProps={props}
    />
  );
}

function Tip({ index, t }: { index: 0 | 1 | 2 | 3; t: Time }) {
  const glow = useAnimatedProps(() => tipProps(index, t.get()));
  const core = useAnimatedProps(() => tipProps(index, t.get()));
  return (
    <>
      <AnimatedCircle r={42} fill="url(#zape-glow)" animatedProps={glow} />
      <AnimatedCircle r={5} fill="#ffe9e0" animatedProps={core} />
    </>
  );
}

/**
 * The ZAPE blood-drop ident as a full-screen loader: the drop falls, bursts into the bead and
 * the mark grows out of it, then a shimmer sweeps the finished mark again and again until the
 * wait ends. With reduced motion it shows the settled mark only.
 *
 * `onBuilt` fires once the mark is complete (straight away with reduced motion); pass a stable
 * function.
 */
export function ZapeLoader({
  label,
  testID,
  onBuilt,
}: {
  label: string;
  testID?: string;
  onBuilt?: () => void;
}) {
  const { tone, palette } = useTone();
  const reduceMotion = useReducedMotion();
  // Burgundy is unreadable on the dark tone, which uses its ink instead (like `primary`).
  const color = tone === 'dark' ? palette.ink : BURGUNDY;
  // The shimmer has to contrast with the mark: light over burgundy, dark over the light ink.
  const sheen = tone === 'dark' ? palette.bg : '#fffaf7';
  const t = useSharedValue(0);
  const frame = useFrameCallback(({ timeSinceFirstFrame }) => {
    t.set(identTime((timeSinceFirstFrame / 1000) * IDENT_SPEED));
  }, false);
  useAnimatedReaction(
    () => t.get() >= IDENT_BUILT,
    (built, wasBuilt) => {
      if (built && !wasBuilt && onBuilt) scheduleOnRN(onBuilt);
    },
    [onBuilt]
  );
  useEffect(() => {
    if (reduceMotion) t.set(IDENT_REST);
    frame.setActive(!reduceMotion);
  }, [reduceMotion, frame, t]);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={StyleSheet.absoluteFill}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
        // Covers the screen, so on a portrait phone the mark fills the height.
        preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="zape-atmos" cx="50%" cy="46%" r="72%">
            <Stop offset="0" stopColor="#000000" stopOpacity={0} />
            <Stop offset="0.6" stopColor="#000000" stopOpacity={0.03} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.09} />
          </RadialGradient>
          <RadialGradient id="zape-glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#ffece4" stopOpacity={0.95} />
            <Stop offset="0.3" stopColor="#ff9678" stopOpacity={0.5} />
            <Stop offset="0.7" stopColor="#b4282d" stopOpacity={0.14} />
            <Stop offset="1" stopColor="#b4282d" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="zape-sheen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0.3" stopColor={sheen} stopOpacity={0} />
            <Stop offset="0.5" stopColor={sheen} stopOpacity={0.6} />
            <Stop offset="0.7" stopColor={sheen} stopOpacity={0} />
          </LinearGradient>
          <ClipPath id="zape-mark">
            {BARS.map((bar, i) => (
              <Rect key={i} x={bar.x} y={bar.y} width={bar.w} height={bar.h} />
            ))}
            <Circle cx={DOT.cx} cy={DOT.cy} r={DOT.r} />
          </ClipPath>
        </Defs>
        <Atmosphere t={t} />
        {BARS.map((_, i) => (
          <Bar key={i} index={i} t={t} color={color} />
        ))}
        <Drop t={t} color={color} />
        {SPLATTER.map((_, i) => (
          <Droplet key={i} index={i} t={t} color={color} />
        ))}
        <Ring index={0} t={t} color={color} />
        <Ring index={1} t={t} color={color} />
        <Bead t={t} color={color} />
        <G clipPath="url(#zape-mark)">
          <Sheen t={t} />
        </G>
        <Ring index={2} t={t} color={color} />
        <Flash t={t} />
        {([0, 1, 2, 3] as const).map((i) => (
          <Tip key={i} index={i} t={t} />
        ))}
      </Svg>
    </View>
  );
}
