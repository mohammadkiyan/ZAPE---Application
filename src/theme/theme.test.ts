import { resolveTheme } from './theme';

describe('theme resolution', () => {
  it('uses the system theme when preference is system', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', 'light')).toBe('light');
  });

  it('uses explicit preference regardless of system appearance', () => {
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });
});
