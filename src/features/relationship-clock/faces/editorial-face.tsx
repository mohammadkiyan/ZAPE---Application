import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { localizeDigits } from '@/localization/format';
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

/** The device face's rule colours are a touch stronger than the other faces'. */
const RULE = {
  dark: 'rgba(232, 236, 237, 0.12)',
  light: 'rgba(21, 21, 21, 0.14)',
  gray: 'rgba(21, 21, 21, 0.16)',
} as const;
const NUMBER = { size: 36, height: 44 };
const WORD = { size: 15, height: 24 };
const FRACTION = { size: 18, height: 24 };

/**
 * Editorial: the years as a headline numeral over a burgundy rule, then months, days and the
 * running time set as text. The device face runs these in two columns; here they stack.
 */
export function EditorialFace({ tone, locale, elapsed, dayMs }: FaceProps) {
  const { t } = useTranslation('relationship');
  const P = FACE_TONES[tone];
  const fa = locale === 'fa';
  const years = localizeDigits(elapsed.y, locale);
  const big = years.length > 1 ? { size: 120, height: 120 } : { size: 152, height: 144 };
  const two = (unit: 'h' | 'mi' | 's') => dialValue(elapsed[unit], locale);
  const rows = [
    { unit: 'mo', word: t('clock.monthWord', { count: elapsed.mo }) },
    { unit: 'd', word: t('clock.dayWord', { count: elapsed.d }) },
  ] as const;

  return (
    <View testID="face-editorial" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: 'absolute',
          left: 40,
          top: 108,
          width: FACE_WIDTH - 80,
          direction: directionOf(locale),
        }}>
        <View testID="clock-dial-y" style={{ alignSelf: 'flex-start' }}>
          <Line
            {...big}
            weight={600}
            tracking={fa ? 0 : -0.05 * big.size}
            color={P.fg}
            testID="editorial-years">
            {years}
          </Line>
          <View style={{ height: 2, marginTop: 12, backgroundColor: BURGUNDY }} />
          <Line size={18} height={26} color={P.muted} style={{ marginTop: 10 }}>
            {t('clock.yearsTogether', { count: elapsed.y })}
          </Line>
        </View>
        <View style={{ marginTop: 16 }}>
          {rows.map((row) => (
            <View
              key={row.unit}
              testID={`clock-dial-${row.unit}`}
              style={{
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 10,
                borderBottomWidth: 1,
                borderBottomColor: RULE[tone],
              }}>
              <Line {...NUMBER} weight={500} color={P.fg}>
                {localizeDigits(elapsed[row.unit], locale)}
              </Line>
              <Line
                {...WORD}
                color={P.muted}
                style={{ marginBottom: baselineLift(NUMBER, WORD, locale) }}>
                {row.word}
              </Line>
            </View>
          ))}
          <View style={{ paddingTop: 10, gap: 4 }}>
            <View
              testID="clock-time"
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'flex-end',
                direction: 'ltr',
              }}>
              <Line {...NUMBER} weight={500} color={P.fg}>
                {`${two('h')}:${two('mi')}:${two('s')}`}
              </Line>
              <Millis
                dayMs={dayMs}
                locale={locale}
                {...FRACTION}
                color={P.muted}
                style={{ marginBottom: baselineLift(NUMBER, FRACTION, locale) }}
              />
            </View>
            <Line {...unitType(locale, { fa: 13, en: 11 })} height={18} color={P.muted}>
              {t('clock.hmsLong')}
            </Line>
          </View>
        </View>
      </View>
    </View>
  );
}
