import { forwardRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { localizeDigits } from '@/localization/format';
import type { AppLocale } from '@/localization/locale';
import { BURGUNDY } from '@/theme/clock-themes';
import { sanitizeCode } from './phone';

export interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  accessibilityLabel: string;
  locale: AppLocale;
  editable?: boolean;
}

/**
 * Six digit boxes (3 + 3, always left-to-right) over one transparent `TextInput`, so the
 * platform's one-time-code autofill, paste and Persian keyboards all just work.
 */
export const CodeInput = forwardRef<TextInput, CodeInputProps>(function CodeInput(
  { value, onChange, accessibilityLabel, locale, editable = true },
  ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ alignSelf: 'center', direction: 'ltr' }}>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const digit = value[index];
          const active = focused && index === Math.min(value.length, 5) && value.length < 6;
          return (
            <View
              key={index}
              testID={`code-box-${index}`}
              style={{
                width: 46,
                height: 58,
                marginRight: index === 2 ? 8 : 0,
                borderRadius: 12,
                borderWidth: active ? 1.5 : 1,
                borderColor: active
                  ? BURGUNDY
                  : digit
                    ? 'rgba(21, 21, 21, 0.14)'
                    : 'rgba(21, 21, 21, 0.1)',
                backgroundColor: '#ffffff',
                boxShadow: active
                  ? '0 0 0 4px rgba(101, 0, 28, 0.08), 0 8px 20px rgba(21, 21, 21, 0.06)'
                  : '0 1px 2px rgba(21, 21, 21, 0.05), 0 8px 20px rgba(21, 21, 21, 0.06)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {digit ? (
                <Text
                  className="font-semibold"
                  style={{ fontSize: 26, lineHeight: 32, fontVariant: ['tabular-nums'] }}>
                  {localizeDigits(digit, locale)}
                </Text>
              ) : active ? (
                <View style={{ width: 1.5, height: 26, backgroundColor: BURGUNDY }} />
              ) : null}
            </View>
          );
        })}
      </View>
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
