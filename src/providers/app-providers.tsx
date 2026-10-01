import { useEffect, useState, type PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
} from '@expo-google-fonts/noto-sans-arabic';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { createQueryClient, wireQueryManagers } from '@/api/query-client';
import { i18n } from '@/localization/i18n';
import { directionForLocale } from '@/localization/locale';
import { preferencesStore, usePreferences } from '@/preferences/preferences';
import { ToneProvider } from '@/theme/theme';
import { toneForTheme } from '@/theme/clock-themes';
import { FONT_FAMILY } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

const DIRECTION_RELOAD_ATTEMPT_KEY = 'zape.direction-reload-attempt';
const BUNDLED_FONTS = {
  [FONT_FAMILY.fa[400]]: NotoSansArabic_400Regular,
  [FONT_FAMILY.fa[500]]: NotoSansArabic_500Medium,
  [FONT_FAMILY.fa[600]]: NotoSansArabic_600SemiBold,
  [FONT_FAMILY.en[400]]: Inter_400Regular,
  [FONT_FAMILY.en[500]]: Inter_500Medium,
  [FONT_FAMILY.en[600]]: Inter_600SemiBold,
};

/** Async reads that must finish before the splash hides (e.g. the stored session). */
export type HydrationTask = () => Promise<void>;
const NO_TASKS: readonly HydrationTask[] = [];

interface HydrationProps {
  /** Registered by the root layout, so core providers never import features. Read once on mount. */
  hydrationTasks?: readonly HydrationTask[];
}

export function AppProviders({ children, hydrationTasks }: PropsWithChildren<HydrationProps>) {
  const [queryClient] = useState(createQueryClient);
  useEffect(() => wireQueryManagers(), []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppHydrationGate hydrationTasks={hydrationTasks}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AppHydrationGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function AppHydrationGate({
  children,
  hydrationTasks = NO_TASKS,
}: PropsWithChildren<HydrationProps>) {
  const [directionReloadFailed, setDirectionReloadFailed] = useState(false);
  const [initialTasks] = useState(hydrationTasks);
  const [tasksDone, setTasksDone] = useState(initialTasks.length === 0);
  const [fontsLoaded, fontError] = useFonts(BUNDLED_FONTS);
  const preferencesHydrated = usePreferences((state) => state.hydrated);
  const hydrated = preferencesHydrated && tasksDone;
  const locale = usePreferences((state) => state.locale);
  const clockTheme = usePreferences((state) => state.clockTheme);
  const needsDirectionReload = I18nManager.isRTL !== (directionForLocale(locale) === 'rtl');

  useEffect(() => {
    void preferencesStore.getState().hydrate();
  }, []);
  useEffect(() => {
    if (initialTasks.length === 0) return;
    let active = true;
    // A failed task must not trap the app behind its splash; each task owns its fallback.
    void Promise.allSettled(initialTasks.map((task) => task())).then(() => {
      if (active) setTasksDone(true);
    });
    return () => {
      active = false;
    };
  }, [initialTasks]);
  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);
  useEffect(() => {
    if (!hydrated) return;
    if (!needsDirectionReload) {
      void AsyncStorage.removeItem(DIRECTION_RELOAD_ATTEMPT_KEY)
        .catch(() => undefined)
        .then(() => setDirectionReloadFailed(false));
      return;
    }
    if (directionReloadFailed) return;

    let active = true;
    void (async () => {
      try {
        const direction = directionForLocale(locale);
        const previousAttempt = await AsyncStorage.getItem(DIRECTION_RELOAD_ATTEMPT_KEY);
        if (!active) return;
        if (previousAttempt === direction) {
          setDirectionReloadFailed(true);
          return;
        }
        await AsyncStorage.setItem(DIRECTION_RELOAD_ATTEMPT_KEY, direction);
        if (!active) return;
        // Allowing RTL lets an RTL device language keep the layout RTL, so LTR must disallow it.
        I18nManager.allowRTL(direction === 'rtl');
        I18nManager.forceRTL(direction === 'rtl');
        await reloadAppAsync();
      } catch {
        if (active) setDirectionReloadFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [hydrated, locale, needsDirectionReload, directionReloadFailed]);
  useEffect(() => {
    if (
      hydrated &&
      (fontsLoaded || fontError) &&
      (!needsDirectionReload || directionReloadFailed)
    ) {
      void SplashScreen.hideAsync();
    }
  }, [hydrated, fontsLoaded, fontError, needsDirectionReload, directionReloadFailed]);

  if (!hydrated || (!fontsLoaded && !fontError) || (needsDirectionReload && !directionReloadFailed))
    return null;
  return <ToneProvider tone={toneForTheme(clockTheme)}>{children}</ToneProvider>;
}
