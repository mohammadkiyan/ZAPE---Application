import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BURGUNDY, type Tone } from '@/theme/clock-themes';
import { dialValue } from '../format';
import { FACE_TONES, FACE_WIDTH, Line, Millis, unitType, type FaceProps } from './face-kit';

/** Tiles are the inverse of the tone, with a hairline where the flap splits. */
const TILE: Record<Tone, { bg: string; fg: string; split: string }> = {
  dark: { bg: '#e8eced', fg: '#151515', split: 'rgba(21, 21, 21, 0.18)' },
  light: { bg: '#151515', fg: '#ffffff', split: 'rgba(232, 236, 237, 0.22)' },
  gray: { bg: '#151515', fg: '#ffffff', split: 'rgba(232, 236, 237, 0.22)' },
};
const LARGE = { width: 62, height: 86, size: 60, gap: 6 };
const MEDIUM = { width: 46, height: 62, size: 42, gap: 5 };
const SMALL = { width: 34, height: 46, size: 30, gap: 4 };

interface TilesProps {
  value: string;
  tone: Tone;
  tile: typeof LARGE;
}

/** One value as a row of flap tiles, a digit each. */
function Tiles({ value, tone, tile }: TilesProps) {
  const C = TILE[tone];
  return (
    <View style={{ flexDirection: 'row', gap: tile.gap }}>
      {Array.from(value).map((digit, index) => (
        <View
          key={index}
          testID="flap-tile"
          style={{
            width: tile.width,
            height: tile.height,
            borderRadius: 2,
            backgroundColor: C.bg,
          }}>
          <Line size={tile.size} height={tile.height} weight={500} color={C.fg} align="center">
            {digit}
          </Line>
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: tile.height / 2,
              height: 1,
              backgroundColor: C.split,
            }}
          />
        </View>
      ))}
    </View>
  );
}

/** Split-flap: every unit on flap tiles, years largest, as on the device face. */
export function FlapFace({ tone, locale, elapsed, dayMs }: FaceProps) {
  const { t } = useTranslation('relationship');
  const P = FACE_TONES[tone];
  const label = unitType(locale);
  const small = unitType(locale, { fa: 12, en: 9 });

  return (
    <View testID="face-flap" style={StyleSheet.absoluteFill}>
      {/* Tiles read left to right in either language, like the dials. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 161,
          width: FACE_WIDTH,
          alignItems: 'center',
          direction: 'ltr',
        }}>
        <View testID="clock-dial-y" style={{ alignItems: 'center' }}>
          <Tiles value={dialValue(elapsed.y, locale)} tone={tone} tile={LARGE} />
          <Line {...label} height={16} color={P.muted} style={{ marginTop: 10 }}>
            {t('clock.y')}
          </Line>
        </View>
        <View style={{ width: 36, height: 2, marginTop: 14, backgroundColor: BURGUNDY }} />
        <View style={{ marginTop: 16, flexDirection: 'row', gap: 44 }}>
          {(['mo', 'd'] as const).map((unit) => (
            <View key={unit} testID={`clock-dial-${unit}`} style={{ alignItems: 'center' }}>
              <Tiles value={dialValue(elapsed[unit], locale)} tone={tone} tile={MEDIUM} />
              <Line {...label} height={16} color={P.muted} style={{ marginTop: 8 }}>
                {t(`clock.${unit}`)}
              </Line>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          {(['h', 'mi', 's'] as const).map((unit) => (
            <View key={unit} testID={`clock-dial-${unit}`} style={{ alignItems: 'center' }}>
              <Tiles value={dialValue(elapsed[unit], locale)} tone={tone} tile={SMALL} />
              <Line {...small} height={14} color={P.muted} style={{ marginTop: 7 }}>
                {t(`clock.${unit}`)}
              </Line>
            </View>
          ))}
          <Millis
            dayMs={dayMs}
            locale={locale}
            size={20}
            height={24}
            color={P.muted}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </View>
  );
}
