import type { RelationshipCalendar } from '@/api/contracts/relationship';
import {
  gregorianToJalali,
  jalaliToGregorian,
  localizeDigits,
  type DateParts,
} from '@/localization/format';
import type { AppLocale } from '@/localization/locale';
import { wallClock } from '@/features/relationship-clock/elapsed';

export type DateUnit = 'year' | 'month' | 'day';

/** Common zones offered after the phone's own. */
export const COMMON_TIME_ZONES = [
  'Asia/Tehran',
  'Asia/Dubai',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Stockholm',
  'America/Toronto',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
] as const;

export function phoneTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** The phone's zone first, then the common ones. */
export function curatedTimeZones(phone = phoneTimeZone()): string[] {
  return [phone, ...COMMON_TIME_ZONES.filter((zone) => zone !== phone)];
}

function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function isJalaliLeap(year: number): boolean {
  const [gy, gm, gd] = jalaliToGregorian(year, 12, 30);
  return gregorianToJalali(gy, gm, gd)[2] === 30;
}

export function monthLength(year: number, month: number, calendar: RelationshipCalendar): number {
  if (calendar === 'gregorian') {
    return [31, isGregorianLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
      month - 1
    ]!;
  }
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeap(year) ? 30 : 29;
}

/** A Gregorian date shown in `calendar`. */
export function toCalendar([y, m, d]: DateParts, calendar: RelationshipCalendar): DateParts {
  return calendar === 'jalali' ? gregorianToJalali(y, m, d) : [y, m, d];
}

export function fromCalendar([y, m, d]: DateParts, calendar: RelationshipCalendar): DateParts {
  return calendar === 'jalali' ? jalaliToGregorian(y, m, d) : [y, m, d];
}

/**
 * Steps one field of a Gregorian date as the picker shows it in `calendar`: months and days
 * wrap within their range like a wheel, and the day is clamped to the month's length.
 */
export function stepDate(
  date: DateParts,
  unit: DateUnit,
  delta: number,
  calendar: RelationshipCalendar
): DateParts {
  let [y, m, d] = toCalendar(date, calendar);
  if (unit === 'year') y += delta;
  if (unit === 'month') m = ((m - 1 + delta + 1200) % 12) + 1;
  if (unit === 'day') {
    const length = monthLength(y, m, calendar);
    d = ((d - 1 + delta + length * 100) % length) + 1;
  }
  d = Math.min(d, monthLength(y, m, calendar));
  return fromCalendar([y, m, d], calendar);
}

export function toIsoDate([y, m, d]: DateParts): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Today's wall-clock date in `timeZone`. */
export function todayIn(timeZone: string, now = Date.now()): DateParts {
  const wall = new Date(wallClock(now, timeZone));
  return [wall.getUTCFullYear(), wall.getUTCMonth() + 1, wall.getUTCDate()];
}

export function isFutureDate(date: DateParts, timeZone: string, now = Date.now()): boolean {
  return toIsoDate(date) > toIsoDate(todayIn(timeZone, now));
}

/** `UTC+03:30` for `timeZone` on `date` (noon), with localized digits. */
export function utcOffsetLabel(timeZone: string, [y, m, d]: DateParts, locale: AppLocale): string {
  const instant = Date.UTC(y, m - 1, d, 12);
  const minutes = Math.round((wallClock(instant, timeZone) - instant) / 60_000);
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  const text = `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return localizeDigits(text, locale);
}

/** A readable city for zones outside the translated list: `America/Sao_Paulo` → `Sao Paulo`. */
export function zoneCityFallback(timeZone: string): string {
  return (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ');
}
