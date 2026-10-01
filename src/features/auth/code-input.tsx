import { forwardRef, useEffect, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { localizeDigits } from '@/localization/format';
import type { AppLocale } from '@/localization/locale';
import { BURGUNDY } from '@/theme/clock-themes';
import { useReducedMotion } from '@/theme/motion';
import { sanitizeCode } from './phone';

export interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  accessibilityLabel: string;
  locale: AppLocale;
  editable?: boolean;
  /** Paints the boxes in the error state. */
  invalid?: boolean;
  /** Each new value shakes the boxes once (skipped under reduced motion). */
  shakeKey?: number;
}

const SHAKE_OFFSETS = [-9, 8, -6, 4, -2, 0];

/** A short horizontal shake, the familiar "that code was wrong" cue. */
function useShake(shakeKey: number | undefined) {
  const reduced = useReducedMotion();
  const offset = useSharedValue(0);
  useEffect(() => {
    if (!shakeKey || reduced) return;
    offset.value = withSequence(
      ...SHAKE_OFFSETS.map((value) =>
        withTiming(value, { duration: 55, easing: Easing.inOut(Easing.quad) })
      )
    );
  }, [shakeKey, reduced, offset]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
}

/**
 * Six digit boxes (3 + 3, always left-to-right) over one transparent `TextInput`, so the
 * platform's one-time-code autofill, paste and Persian keyboards all just work.
 */
export const CodeInput = forwardRef<TextInput, CodeInputProps>(function CodeInput(
  { value, onChange, accessibilityLabel, locale, editable = true, invalid = false, shakeKey },
  ref
) {
  const [focused, setFocused] = useState(false);
  const shakeStyle = useShake(shakeKey);
  return (
    <View style={{ alignSelf: 'center', direction: 'ltr' }}>
      <Animated.View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[{ flexDirection: 'row', gap: 8 }, shakeStyle]}>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const digit = value[index];
          const active =
            !invalid && focused && index === Math.min(value.length, 5) && value.length < 6;
          return (
            <View
              key={index}
              testID={`code-box-${index}`}
              style={{
                width: 46,
                height: 58,
                marginRight: index === 2 ? 8 : 0,
                borderRadius: 12,
                borderWidth: active || invalid ? 1.5 : 1,
                borderColor: invalid
                  ? 'rgba(101, 0, 28, 0.55)'
                  : active
                    ? BURGUNDY
                    : digit
                      ? 'rgba(21, 21, 21, 0.14)'
                      : 'rgba(21, 21, 21, 0.1)',
                backgroundColor: invalid ? '#fdf7f8' : '#ffffff',
                boxShadow: active
                  ? '0 0 0 4px rgba(101, 0, 28, 0.08), 0 8px 20px rgba(21, 21, 21, 0.06)'
                  : '0 1px 2px rgba(21, 21, 21, 0.05), 0 8px 20px rgba(21, 21, 21, 0.06)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {digit ? (
                // No lineHeight: Noto Sans Arabic's line box is ~2.1em, and squeezing it lifts
                // Persian digits off-centre on iOS. The box centres the natural line instead.
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: 26,
                    textAlign: 'center',
                    includeFontPadding: false,
                    color: invalid ? BURGUNDY : undefined,
                    fontVariant: ['tabular-nums'],
                  }}>
                  {localizeDigits(digit, locale)}
                </Text>
              ) : active ? (
                <View style={{ width: 1.5, height: 26, backgroundColor: BURGUNDY }} />
              ) : null}
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={ref}
        testID="code-input"
        value={value}
        onChangeText={(text) => onChange(sanitizeCode(text))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={editable}
        accessibilityLabel={accessibilityLabel}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={24}
        caretHidden
        contextMenuHidden={false}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          color: 'transparent',
          opacity: 0.02,
          fontSize: 1,
        }}
      />
    </View>
  );
});
