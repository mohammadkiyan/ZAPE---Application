import { TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import type { AppLocale } from '@/localization/locale';
import { FONT_FAMILY, type FontWeight } from '@/theme/fonts';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

function pad(value: number, length: number): string {
  'worklet';
  let text = String(value);
  while (text.length < length) text = `0${text}`;
  return text;
}

export type TickingFormat = 'full' | 'ms' | 'fraction';

/** `hh:mm:ss.mmm`, `mmm` or `.mmm` for a time of day in ms, with Persian digits for `fa`. */
export function formatDayMs(dayMs: number, format: TickingFormat, persian: boolean): string {
  'worklet';
  const whole = Math.floor(dayMs);
  const ms = whole % 1000;
  const s = Math.floor(whole / 1000) % 60;
  const mi = Math.floor(whole / 60_000) % 60;
  const h = Math.floor(whole / 3_600_000);
  const text =
    format === 'ms'
      ? pad(ms, 3)
      : format === 'fraction'
        ? `.${pad(ms, 3)}`
        : `${pad(h, 2)}:${pad(mi, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
  if (!persian) return text;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 48;
    out += code >= 0 && code <= 9 ? PERSIAN[code] : text[i];
  }
  return out;
}

export interface TickingTextProps {
  dayMs: SharedValue<number>;
  format?: TickingFormat;
  locale: AppLocale;
  weight?: FontWeight;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * Text that changes every frame without re-rendering React: a read-only input whose `text`
 * is set from a worklet. Hidden from screen readers so ticks are never announced.
 */
export function TickingText({
  dayMs,
  format = 'full',
  locale,
  weight = 500,
  style,
  testID,
}: TickingTextProps) {
  const persian = locale === 'fa';
  const animatedProps = useAnimatedProps(
    () => ({ text: formatDayMs(dayMs.get(), format, persian) }) as never
  );
  return (
    <AnimatedTextInput
      testID={testID}
      editable={false}
      pointerEvents="none"
      caretHidden
      underlineColorAndroid="transparent"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      defaultValue={formatDayMs(dayMs.get(), format, persian)}
      animatedProps={animatedProps}
      style={[
        {
          padding: 0,
          margin: 0,
          fontFamily: FONT_FAMILY[locale][weight],
          fontVariant: ['tabular-nums'],
          writingDirection: 'ltr',
          textAlign: 'center',
        },
        style,
      ]}
    />
  );
}
