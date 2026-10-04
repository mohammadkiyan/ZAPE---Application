import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Mood } from '@/api/contracts/status';
import { Text } from '@/components/ui/text';
import { Sheet } from '@/features/relationship/sheet';
import { BURGUNDY } from '@/theme/clock-themes';
import { useTone } from '@/theme/theme';
import { MoodGlyph } from './mood-glyph';
import { MOOD_ORDER } from './mood-glyphs';

export interface MoodPickerProps {
  visible: boolean;
  /** Your current mood, marked in the grid. */
  current: Mood | undefined;
  onPick(mood: Mood): void;
  onClose(): void;
}

/** The mood picker sheet: the ten moods as a grid of labelled buttons, and a Close control. */
export function MoodPicker({ visible, current, onPick, onClose }: MoodPickerProps) {
  const { t } = useTranslation(['status', 'common']);
  const { palette } = useTone();
  return (
    <Sheet
      visible={visible}
      title={t('status:picker.title')}
      onClose={onClose}
      closeLabel={t('common:close')}
      testID="mood-picker">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
        {MOOD_ORDER.map((mood) => {
          const selected = mood === current;
          const label = t(`status:moods.${mood}`);
          return (
            <View key={mood} style={{ width: '20%', padding: 4 }}>
              <Pressable
                testID={`mood-${mood}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={selected ? t('status:picker.current', { mood: label }) : label}
                onPress={() => onPick(mood)}
                style={{
                  height: 88,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderColor: selected ? 'transparent' : palette.line,
                  backgroundColor: selected ? BURGUNDY : palette.off,
                }}>
                <MoodGlyph mood={mood} size={28} color={selected ? '#ffffff' : palette.fg} />
                <Text
                  numberOfLines={1}
                  className={selected ? 'font-semibold' : 'font-medium'}
                  style={{
                    paddingTop: 0,
                    textAlign: 'center',
                    fontSize: 12,
                    lineHeight: 18,
                    color: selected ? '#ffffff' : palette.fg,
                  }}>
                  {label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text className="text-sm leading-6 text-muted-foreground">{t('status:picker.hint')}</Text>
    </Sheet>
  );
}
