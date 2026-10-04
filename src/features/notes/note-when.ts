import type { TFunction } from 'i18next';
import {
  formatZoneClock,
  zoneDateParts,
  zoneDaysAgo,
} from '@/features/relationship-clock/zone-time';
import { formatDate, formatRelativeTime } from '@/localization/format';
import type { AppLocale } from '@/localization/locale';

interface WhenOptions {
  timeZone: string;
  locale: AppLocale;
  now: number;
  t: TFunction<'notes'>;
}

/** When a note was written: «امروز · ۱۶:۱۳», «دیروز · ۱۶:۱۳», or a date for an older note. */
export function formatNoteDay(at: string, { timeZone, locale, now, t }: WhenOptions): string {
  const days = zoneDaysAgo(at, now, timeZone);
  const time = formatZoneClock(at, timeZone, locale);
  if (days <= 0) return t('today', { time });
  if (days === 1) return t('yesterday', { time });
  return formatDate(zoneDateParts(at, timeZone), locale, { withYear: false });
}

/** A time on your own note's line: just «۱۰:۰۵» today, the day as well once it is older. */
export function formatNoteMoment(at: string, options: WhenOptions): string {
  return zoneDaysAgo(at, options.now, options.timeZone) <= 0
    ? formatZoneClock(at, options.timeZone, options.locale)
    : formatNoteDay(at, options);
}

/** The Home card's time: relative within the last hour, then the day and hour. */
export function formatNoteRecent(at: string, options: WhenOptions): string {
  const age = options.now - Date.parse(at);
  return age < 60 * 60_000
    ? formatRelativeTime(at, options.locale, { now: options.now })
    : formatNoteDay(at, options);
}
