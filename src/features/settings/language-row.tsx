import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import type { AppLocale } from '@/localization/locale';
import { preferencesStore, usePreferences } from '@/preferences/preferences';
import { useTone } from '@/theme/theme';
import { Button } from '@/components/ui/button';

/** Each language is named in itself, so it reads the same whichever one is active. */
const LANGUAGES: { locale: AppLocale; name: string }[] = [
  { locale: 'fa', name: 'فارسی' },
  { locale: 'en', name: 'English' },
];

/** The More tab's Language row. The hydration gate reloads the app when the direction changes. */
export function LanguageRow() {
  const { t } = useTranslation('shell');
  const current = usePreferences((state) => state.locale);
  const { palette } = useTone();
  return (
    <View
      testID="more-language"
      className="mx-4 min-h-14 items-center justify-between rounded-2xl px-4"
      style={{ borderWidth: 1, borderColor: palette.glassEdge, backgroundColor: palette.glass }}>
      <Text nativeID="more-language-label" className="font-medium">
        {t('language')}
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabelledBy="more-language-label"
        style={{
          flexDirection: 'row',
          padding: 4,
          gap: 4,
          borderRadius: 999,
          backgroundColor: palette.off,
        }}>
        {LANGUAGES.map(({ locale, name }) => {
          const selected = locale === current;
          return (
            <Button
              key={locale}
              testID={`more-language-${locale}`}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              accessibilityLanguage={locale}
              onPress={() => {
                if (!selected) void preferencesStore.getState().setLocale(locale);
              }}
              style={{
                minHeight: 36,
                paddingHorizontal: 14,
                borderRadius: 999,
                justifyContent: 'center',
                backgroundColor: selected ? palette.segSel : 'transparent',
              }}>
              <Text
                className={locale === 'en' ? 'font-latin font-medium' : 'font-medium'}
                style={{ fontSize: 13, color: selected ? palette.fg : palette.muted }}>
                {name}
              </Text>
            </Button>
          );
        })}
      </View>
    </View>
  );
}
