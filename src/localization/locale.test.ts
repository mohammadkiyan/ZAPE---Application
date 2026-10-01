import {
  chooseLocale,
  detectWritingDirection,
  directionForLocale,
  shouldReloadForLocaleChange,
} from './locale';

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

  it('detects direction from the first strongly directional character', () => {
    expect(detectWritingDirection('سلام دنیا')).toBe('rtl');
    expect(detectWritingDirection('Hello world')).toBe('ltr');
    expect(detectWritingDirection('12 — ZAPE زاپ')).toBe('ltr');
    expect(detectWritingDirection('۱۲ روز')).toBe('rtl');
    expect(detectWritingDirection('12:30 · !')).toBeUndefined();
  });
});
