import {
  BACKGROUND_IDS,
  BACKGROUNDS,
  DEFAULT_THEME,
  THEME_IDS,
  THEMES,
  TONE_IDS,
  TONES,
  isBackgroundId,
  isThemeId,
  resolveBackground,
} from './clock-themes';

describe('clock theme catalog', () => {
  it('offers ten themes and ten backgrounds with localized names', () => {
    expect(THEME_IDS).toHaveLength(10);
    expect(BACKGROUND_IDS).toHaveLength(10);
    for (const id of THEME_IDS) {
      expect(THEMES[id].name.fa).toBeTruthy();
      expect(THEMES[id].name.en).toBeTruthy();
    }
    for (const id of BACKGROUND_IDS) {
      expect(BACKGROUNDS[id].name.fa).toBeTruthy();
      expect(BACKGROUNDS[id].name.en).toBeTruthy();
    }
  });

  it('maps every theme to a valid tone, background, dial and face', () => {
    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      expect(TONE_IDS).toContain(theme.tone);
      expect(isBackgroundId(theme.background)).toBe(true);
      expect(['classic', 'chrono', 'hairline']).toContain(theme.dial);
      expect(['dials', 'rings', 'astrolabe', 'ruler', 'editorial', 'flap', 'bracelet']).toContain(
        theme.face
      );
    }
  });

  it('pins the canvas mapping', () => {
    expect(THEMES.constellation).toMatchObject({ tone: 'dark', background: 'orbits' });
    expect(THEMES.mist).toMatchObject({ tone: 'gray', background: 'contour', dial: 'hairline' });
    expect(THEMES.ruler).toMatchObject({ tone: 'light', background: 'graticule' });
    expect(THEMES.chronograph.dial).toBe('chrono');
  });

  it('defaults to Constellation and resolves auto backgrounds from the theme', () => {
    expect(DEFAULT_THEME).toBe('constellation');
    expect(resolveBackground('mist', 'auto')).toBe('contour');
    expect(resolveBackground('mist', 'stars')).toBe('stars');
  });

  it('uses the specified tone backgrounds and primary text', () => {
    expect(TONES.dark).toMatchObject({ bg: '#151515', fg: '#ffffff' });
    expect(TONES.light).toMatchObject({ bg: '#ffffff', fg: '#151515' });
    expect(TONES.gray).toMatchObject({ bg: '#e8eced', fg: '#151515' });
  });

  it('rejects unknown ids', () => {
    expect(isThemeId('constellation')).toBe(true);
    expect(isThemeId('system')).toBe(false);
    expect(isBackgroundId('auto')).toBe(false);
  });
});
