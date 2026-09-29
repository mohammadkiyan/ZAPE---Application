import type { PropsWithChildren } from 'react';
import { act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { i18n } from '@/localization/i18n';
import type { AppLocale } from '@/localization/locale';
import { preferencesStore, usePreferences } from '@/preferences/preferences';
import { toneForTheme, type Tone } from '@/theme/clock-themes';
import { ToneProvider } from '@/theme/theme';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Sets the app locale for a test the way the preferences store and i18n see it. */
export async function setTestLocale(locale: AppLocale): Promise<void> {
  await act(async () => {
    preferencesStore.setState({ locale });
    await i18n.changeLanguage(locale);
  });
}

function StoredTone({ children }: PropsWithChildren) {
  const theme = usePreferences((state) => state.clockTheme);
  return <ToneProvider tone={toneForTheme(theme)}>{children}</ToneProvider>;
}

/** Safe-area metrics plus a tone: a fixed one, or `stored` to follow the preferences like the app. */
export function TestProviders({
  tone = 'dark',
  children,
}: PropsWithChildren<{ tone?: Tone | 'stored' }>) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      {tone === 'stored' ? (
        <StoredTone>{children}</StoredTone>
      ) : (
        <ToneProvider tone={tone}>{children}</ToneProvider>
      )}
    </SafeAreaProvider>
  );
}
