export type AppLocale = 'fa' | 'en';
export type WritingDirection = 'rtl' | 'ltr';

export function chooseLocale(value: string | undefined): AppLocale {
  return value === 'en' ? 'en' : 'fa';
}

export function directionForLocale(locale: AppLocale): WritingDirection {
  return locale === 'fa' ? 'rtl' : 'ltr';
}

export function shouldReloadForLocaleChange(previous: AppLocale, next: AppLocale): boolean {
  return directionForLocale(previous) !== directionForLocale(next);
}
