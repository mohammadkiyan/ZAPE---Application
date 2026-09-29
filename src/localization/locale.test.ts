import { directionForLocale, shouldReloadForLocaleChange, chooseLocale } from './locale';

describe('locale direction', () => {
  it('defaults to Persian with English as fallback', () => {
    expect(chooseLocale(undefined)).toBe('fa');
    expect(chooseLocale('de')).toBe('fa');
    expect(chooseLocale('en')).toBe('en');
  });

  it('reloads only on a writing direction change', () => {
    expect(directionForLocale('fa')).toBe('rtl');
    expect(directionForLocale('en')).toBe('ltr');
    expect(shouldReloadForLocaleChange('fa', 'en')).toBe(true);
    expect(shouldReloadForLocaleChange('fa', 'fa')).toBe(false);
  });
});
