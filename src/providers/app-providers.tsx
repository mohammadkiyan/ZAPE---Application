import { useEffect, useState, type PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nManager, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from 'expo-router/react-navigation';
import { Vazirmatn_400Regular } from '@expo-google-fonts/vazirmatn';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { CormorantGaramond_400Regular } from '@expo-google-fonts/cormorant-garamond';
import { i18n } from '@/localization/i18n';
import { directionForLocale } from '@/localization/locale';
import { preferencesStore, usePreferences } from '@/preferences/preferences';
import { resolveTheme } from '@/theme/theme';
import { NAV_THEME } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

const DIRECTION_RELOAD_ATTEMPT_KEY = 'zape.direction-reload-attempt';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppHydrationGate>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AppHydrationGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function AppHydrationGate({ children }: PropsWithChildren) {
  const [directionReloadFailed, setDirectionReloadFailed] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Vazirmatn: Vazirmatn_400Regular,
    Inter: Inter_400Regular,
    CormorantGaramond: CormorantGaramond_400Regular,
  });
  const hydrated = usePreferences((state) => state.hydrated);
  const locale = usePreferences((state) => state.locale);
  const preference = usePreferences((state) => state.theme);
  const systemAppearance = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const resolvedTheme = resolveTheme(preference, systemAppearance);
  const needsDirectionReload = I18nManager.isRTL !== (directionForLocale(locale) === 'rtl');

  useEffect(() => {
    void preferencesStore.getState().hydrate();
  }, []);
  useEffect(() => {
    setColorScheme(resolvedTheme);
  }, [resolvedTheme, setColorScheme]);
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
        I18nManager.allowRTL(true);
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
  return (
    <ThemeProvider value={NAV_THEME[resolvedTheme]}>
      {children}
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
