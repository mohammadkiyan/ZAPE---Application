import type { TFunction } from 'i18next';
import type { RelationshipCalendar, RelationshipStart } from '@/api/contracts/relationship';
import { formatDate, localizeDigits, parseIsoDate } from '@/localization/format';
import type { AppLocale } from '@/localization/locale';
import type { Elapsed } from './elapsed';

const UNIT_KEYS = { y: 'year', mo: 'month', d: 'day' } as const;

/**
 * «۵ سال، ۶ ماه و ۱۲ روز» / "5 years, 6 months and 12 days". Zero parts are left out; all zero
 * reads as zero days.
 */
export function formatElapsedSummary(
  e: Pick<Elapsed, 'y' | 'mo' | 'd'>,
  t: TFunction<'relationship'>,
  locale: AppLocale,
  parts: readonly ('y' | 'mo' | 'd')[] = ['y', 'mo', 'd']
): string {
  const words = parts
    .filter((part) => e[part] > 0)
    .map((part) => localizeDigits(t(`units.${UNIT_KEYS[part]}`, { count: e[part] }), locale));
  if (words.length === 0) {
    return localizeDigits(t('units.day', { count: 0 }), locale);
  }
  const last = words.pop()!;
  return words.length === 0 ? last : `${words.join(t('units.comma'))}${t('units.and')}${last}`;
}

/** The start date in the relationship's calendar for Persian, Gregorian for English. */
export function formatStartDate(
  start: Pick<RelationshipStart, 'date'>,
  calendar: RelationshipCalendar,
  locale: AppLocale
): string {
  return formatDate(parseIsoDate(start.date), locale, { calendar });
}

/** A two-digit dial value, e.g. «۰۵». */
export function dialValue(value: number, locale: AppLocale): string {
  return localizeDigits(String(value).padStart(2, '0'), locale);
}
