import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { AppLocale } from '@/localization/locale';
import type { ThemePreference } from '@/theme/theme';

const LOCALE_KEY = 'zape.locale';
const THEME_KEY = 'zape.theme';

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export interface PreferencesState {
  locale: AppLocale;
  theme: ThemePreference;
  hydrated: boolean;
  hydrate(): Promise<void>;
  setLocale(locale: AppLocale): Promise<void>;
  setTheme(theme: ThemePreference): Promise<void>;
}

export function createPreferencesStore(storage: Storage = AsyncStorage) {
  return createStore<PreferencesState>((set, get) => ({
    locale: 'fa',
    theme: 'system',
    hydrated: false,
    async hydrate() {
      if (get().hydrated) return;
      try {
        const [locale, theme] = await Promise.all([
          storage.getItem(LOCALE_KEY),
          storage.getItem(THEME_KEY),
        ]);
        set({
          locale: locale === 'en' ? 'en' : 'fa',
          theme: theme === 'dark' || theme === 'light' ? theme : 'system',
          hydrated: true,
        });
      } catch {
        // Read failures must not trap the app behind its splash screen.
        set({ hydrated: true });
      }
    },
    async setLocale(locale) {
      await storage.setItem(LOCALE_KEY, locale);
      set({ locale });
    },
    async setTheme(theme) {
      await storage.setItem(THEME_KEY, theme);
      set({ theme });
    },
  }));
}

export const preferencesStore = createPreferencesStore();
export function usePreferences<T>(selector: (state: PreferencesState) => T): T {
  return useStore(preferencesStore, selector);
}
