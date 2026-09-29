import { fa } from './fa';
import { en } from './en';
import { i18n } from '../i18n';

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe('translation resources', () => {
  it('has every Persian key in English', () => {
    const english = new Set(keys(en));
    const missing = keys(fa).filter((key) => !english.has(key));
    expect(missing).toEqual([]);
  });

  it('defaults to Persian and falls back to English', () => {
    expect(i18n.options.lng).toBe('fa');
    expect(i18n.options.fallbackLng).toEqual(['en']);
    expect(i18n.t('shell:tabs.clock', { lng: 'fa' })).toBe('زمان ما');
    expect(i18n.t('shell:tabs.clock', { lng: 'en' })).toBe('Rel Clock');
    expect(i18n.t('back', { lng: 'en' })).toBe('Back');
  });
});
