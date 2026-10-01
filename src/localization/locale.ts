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

// Hebrew, Arabic (incl. Persian letters and digits) and their presentation forms.
const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const STRONG_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿A-Za-zÀ-ɏ]/;

/** Direction of the first strongly directional character, or `undefined` for neutral text. */
export function detectWritingDirection(text: string): WritingDirection | undefined {
  const match = STRONG_CHAR.exec(text);
  if (!match) return undefined;
  return RTL_CHAR.test(match[0]) ? 'rtl' : 'ltr';
}
