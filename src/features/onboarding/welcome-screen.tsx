import { useState } from 'react';
import { I18nManager, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { localizeDigits } from '@/localization/format';
import { directionForLocale, type AppLocale } from '@/localization/locale';
import { preferencesStore, usePreferences } from '@/preferences/preferences';
import { BURGUNDY } from '@/theme/clock-themes';
import { Thread } from '@/features/shell/thread';
import { TimeDial } from '@/features/shell/time-dial';
import { localStepStore } from './local-step';
import { OnboardingButton, OnboardingGlow, Orb } from './onboarding-parts';
import { Button } from '@/components/ui/button';

const THREAD =
  'M-20 40C20 72 50 98 80 106C120 117 160 140 195 140C230 140 270 117 310 106C340 98 370 72 410 40';

/** The ZAPE · RelTime wordmark; a Latin brand value that stays left-to-right. */
function Wordmark() {
  return (
    <Text
      accessibilityRole="header"
      accessibilityLabel="ZAPE RelTime"
      className="text-center font-latin"
      style={{ fontSize: 15, lineHeight: 20, writingDirection: 'ltr' }}>
      <Text className="font-latin font-semibold" style={{ fontSize: 15, letterSpacing: 0.3 }}>
        ZAPE
      </Text>
      <Text className="font-latin text-muted-foreground" style={{ fontSize: 15 }}>
        {' · RelTime'}
      </Text>
    </Text>
  );
}

/** You and your partner joined by the red thread around a time dial. Decorative. */
function Illustration({ locale }: { locale: AppLocale }) {
  const { t } = useTranslation('onboarding');
  // "You" sits where reading starts: right in Persian, left in English.
  const youStart = I18nManager.isRTL ? 278 : 48;
  const partnerStart = I18nManager.isRTL ? 48 : 278;
  const label = (x: number, text: string) => (
    <Text
      className="text-center text-muted-foreground"
      style={{
        position: 'absolute',
        left: x - 18,
        top: 144,
        width: 100,
        fontSize: 12,
        lineHeight: 20,
      }}>
      {text}
    </Text>
  );
  return (
    <View
      testID="welcome-illustration"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 390, height: 240, alignSelf: 'center', direction: 'ltr' }}>
      <Svg width={390} height={240} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Thread d={THREAD} length={484} strokeWidth={1.75} durationMs={700} />
      </Svg>
      <View style={{ position: 'absolute', left: youStart, top: 74 }}>
        <Orb kind="you" />
      </View>
      <View style={{ position: 'absolute', left: partnerStart, top: 74 }}>
        <Orb kind="partner" />
      </View>
      {label(youStart, t('welcome.you'))}
      {label(partnerStart, t('welcome.partner'))}
      <View
        style={{
          position: 'absolute',
          left: 139,
          top: 84,
          borderRadius: 56,
          boxShadow: '0 14px 34px rgba(21, 21, 21, 0.12)',
        }}>
        <TimeDial
          value={localizeDigits('05', locale)}
          unit={t('welcome.dialUnit')}
          progress={0.54}
          size={112}
          valueSize={38}
          labelSize={13}
          tone="light"
        />
      </View>
    </View>
  );
}

function LanguageOption({
  locale,
  label,
  selected,
  onSelect,
}: {
  locale: AppLocale;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      variant={'outline'}
      size={'default'}
      testID={`language-${locale}`}
      // Button sets role="button", which outranks accessibilityRole.
      role="radio"
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLanguage={locale}
      onPress={onSelect}
      className='flex-1'
     >
      <Text
        className={locale === 'en' ? 'font-latin font-semibold' : 'font-semibold'}
        style={{ fontSize: 16 }}>
        {label}
      </Text>
      {selected ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: BURGUNDY,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon as={Check} size={12} color="#ffffff" strokeWidth={2.6} />
        </View>
      ) : null}
    </Button>
  );
}

/** First screen: what RelTime is, and the language choice (applied on Continue). */
export function WelcomeScreen() {
  const { t } = useTranslation('onboarding');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = usePreferences((state) => state.locale);
  const [selected, setSelected] = useState<AppLocale>(locale);
  const [busy, setBusy] = useState(false);

  async function onContinue() {
    setBusy(true);
    try {
      // Written first: if the direction changes the app reloads and resumes at the Account step.
      await localStepStore.getState().setStep('account');
      // The gate reloads only for a new locale with the other direction. Re-confirming the current
      // one (e.g. after a reload that could not flip the direction) has nothing to wait for.
      const reloads =
        selected !== preferencesStore.getState().locale &&
        I18nManager.isRTL !== (directionForLocale(selected) === 'rtl');
      await preferencesStore.getState().setLocale(selected);
      if (!reloads) router.navigate('/sign-in');
    } finally {
      // A reload unmounts this screen; anything else must leave Continue pressable again.
      setBusy(false);
    }
  }

  return (
    <View testID="welcome" className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <OnboardingGlow />
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}>
          <Wordmark />
        <View>
          <Illustration locale={locale} />
        </View>
        <View style={{ marginTop: 24, paddingHorizontal: 24 }}>
          <Text
            accessibilityRole="header"
            className="text-center font-semibold"
            style={{ fontSize: 26, lineHeight: 42 }}>
            {t('welcome.headline')}
          </Text>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
      <View style={{ marginTop: 32, marginBottom: 16, paddingHorizontal: 2 }}>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabelledBy="welcome-language-label"
            style={{ marginTop: 10, flexDirection: 'row', gap: 12 }}>
            <LanguageOption
              locale="fa"
              label="فارسی"
              selected={selected === 'fa'}
              onSelect={() => setSelected('fa')}
            />
            <LanguageOption
              locale="en"
              label="English"
              selected={selected === 'en'}
              onSelect={() => setSelected('en')}
            />
          </View>
        </View>
        <OnboardingButton
          testID="welcome-continue"
          label={t('welcome.continue', { lng: selected })}
          latin={selected === 'en'}
          busy={busy}
          onPress={() => void onContinue()}
        />
      </View>
    </View>
  );
}
