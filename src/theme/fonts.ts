import type { AppLocale } from '@/localization/locale';

export type FontWeight = 400 | 500 | 600;

// Each weight is registered as its own family: Android cannot pick a weight
// from a custom family, and iOS would otherwise synthesize bold.
export const FONT_FAMILY: Record<AppLocale, Record<FontWeight, string>> = {
  fa: { 400: 'NotoSansArabic', 500: 'NotoSansArabic-Medium', 600: 'NotoSansArabic-SemiBold' },
  en: { 400: 'Inter', 500: 'Inter-Medium', 600: 'Inter-SemiBold' },
};

/** Resolves the bundled family for a Tailwind class string (`font-medium`, `font-latin`, …). */
export function fontFamilyForClass(className: string, locale: AppLocale): string {
  const script: AppLocale = /(^|\s)font-latin(\s|$)/.test(className) ? 'en' : locale;
  const weight: FontWeight = /(^|\s)font-(semibold|bold|extrabold|black)(\s|$)/.test(className)
    ? 600
    : /(^|\s)font-medium(\s|$)/.test(className)
      ? 500
      : 400;
  return FONT_FAMILY[script][weight];
}
