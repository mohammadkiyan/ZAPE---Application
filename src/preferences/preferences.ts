import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { AppLocale } from '@/localization/locale';
import {
  DEFAULT_THEME,
  isBackgroundId,
  isThemeId,
  type BackgroundChoice,
  type ThemeId,
} from '@/theme/clock-themes';

const LOCALE_KEY = 'zape.locale';
const CLOCK_THEME_KEY = 'zape.clock-theme';
const BACKGROUND_KEY = 'zape.background';
/** Light/dark/system preference replaced by the clock theme; deleted without migration. */
const LEGACY_THEME_KEY = 'zape.theme';

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;

export interface PreferencesState {
  locale: AppLocale;
  clockTheme: ThemeId;
  background: BackgroundChoice;
  hydrated: boolean;
  hydrate(): Promise<void>;
  setLocale(locale: AppLocale): Promise<void>;
  /** Picking a theme also returns the background to the theme's default. */
  setClockTheme(theme: ThemeId): Promise<void>;
  setBackground(background: BackgroundChoice): Promise<void>;
}

export function createPreferencesStore(storage: Storage = AsyncStorage) {
  return createStore<PreferencesState>((set, get) => ({
    locale: 'fa',
    clockTheme: DEFAULT_THEME,
    background: 'auto',
    hydrated: false,
    async hydrate() {
      if (get().hydrated) return;
      try {
        const [locale, clockTheme, background] = await Promise.all([
          storage.getItem(LOCALE_KEY),
          storage.getItem(CLOCK_THEME_KEY),
          storage.getItem(BACKGROUND_KEY),
        ]);
        set({
          locale: locale === 'en' ? 'en' : 'fa',
          clockTheme: isThemeId(clockTheme) ? clockTheme : DEFAULT_THEME,
          background: isBackgroundId(background) ? background : 'auto',
          hydrated: true,
        });
      } catch {
        // Read failures must not trap the app behind its splash screen.
        set({ hydrated: true });
      }
      void storage.removeItem(LEGACY_THEME_KEY).catch(() => undefined);
    },
    async setLocale(locale) {
      await storage.setItem(LOCALE_KEY, locale);
      set({ locale });
    },
    async setClockTheme(clockTheme) {
      set({ clockTheme, background: 'auto' });
      await Promise.all([
        storage.setItem(CLOCK_THEME_KEY, clockTheme),
        storage.setItem(BACKGROUND_KEY, 'auto'),
      ]);
    },
    async setBackground(background) {
      set({ background });
      await storage.setItem(BACKGROUND_KEY, background);
    },
  }));
}

export const preferencesStore = createPreferencesStore();
export function usePreferences<T>(selector: (state: PreferencesState) => T): T {
  return useStore(preferencesStore, selector);
}
