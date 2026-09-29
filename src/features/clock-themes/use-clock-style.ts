import { usePreferences } from '@/preferences/preferences';
import {
  THEMES,
  resolveBackground,
  type BackgroundId,
  type ThemeId,
  type Tone,
} from '@/theme/clock-themes';

export interface ClockStyle {
  theme: ThemeId;
  tone: Tone;
  /** The pattern actually shown: the explicit choice, or the theme's default when auto. */
  background: BackgroundId;
  backgroundIsAuto: boolean;
}

/** The phone's current clock style, from local preferences. */
export function useClockStyle(): ClockStyle {
  const theme = usePreferences((state) => state.clockTheme);
  const choice = usePreferences((state) => state.background);
  return {
    theme,
    tone: THEMES[theme].tone,
    background: resolveBackground(theme, choice),
    backgroundIsAuto: choice === 'auto',
  };
}
