import type { AppLocale } from './locale';

export type DateParts = [year: number, month: number, day: number];

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const GREGORIAN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]!);
}

/** Localizes every digit in a string: Persian digits for `fa`, unchanged for `en`. */
export function localizeDigits(value: string | number, locale: AppLocale): string {
  return locale === 'fa' ? toPersianDigits(value) : String(value);
}

export function formatNumber(value: number, locale: AppLocale): string {
  return localizeDigits(value, locale);
}

/** Folds Persian (۰–۹) and Arabic-Indic (٠–٩) digits to ASCII, e.g. typed on a Persian keyboard. */
export function toAsciiDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

/** A short countdown, e.g. «۰:۴۲» / "0:42". */
export function formatCountdown(totalSeconds: number, locale: AppLocale): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  return localizeDigits(text, locale);
}

function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Arithmetic Gregorian → Jalali conversion, used when ICU lacks the Persian calendar. */
export function gregorianToJalaliArithmetic(gy: number, gm: number, gd: number): DateParts {
  const monthOffsets = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    monthOffsets[gm - 1]!;
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

/** Arithmetic Jalali → Gregorian conversion (ported from the design canvas). */
export function jalaliToGregorian(jy: number, jm: number, jd: number): DateParts {
  const y = jy + 1595;
  let days =
    -355668 +
    365 * y +
    Math.floor(y / 33) * 8 +
    Math.floor(((y % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    days -= 1;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days += 1;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const monthLengths = [31, isGregorianLeap(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm <= 12 && gd > monthLengths[gm - 1]!) {
    gd -= monthLengths[gm - 1]!;
    gm += 1;
  }
  return [gy, gm, gd];
}

let persianFormatter: Intl.DateTimeFormat | null | undefined;

function intlPersianFormatter(): Intl.DateTimeFormat | null {
  if (persianFormatter !== undefined) return persianFormatter;
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    persianFormatter = formatter.resolvedOptions().calendar === 'persian' ? formatter : null;
  } catch {
    persianFormatter = null;
  }
  return persianFormatter;
}

/** Gregorian → Jalali through ICU's Persian calendar, falling back to arithmetic. */
export function gregorianToJalali(gy: number, gm: number, gd: number): DateParts {
  const formatter = intlPersianFormatter();
  if (formatter) {
    const parts: Partial<Record<'year' | 'month' | 'day', number>> = {};
    for (const part of formatter.formatToParts(new Date(Date.UTC(gy, gm - 1, gd)))) {
      if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
        parts[part.type] = parseInt(part.value, 10);
      }
    }
    if (parts.year && parts.month && parts.day) return [parts.year, parts.month, parts.day];
  }
  return gregorianToJalaliArithmetic(gy, gm, gd);
}

/**
 * Formats a Gregorian calendar date: Jalali with Persian month names and digits for `fa`
 * («۲۴ اسفند ۱۳۹۹»), Gregorian for `en` ("March 14, 2021").
 */
export function formatDate(
  [year, month, day]: DateParts,
  locale: AppLocale,
  { withYear = true }: { withYear?: boolean } = {}
): string {
  if (locale === 'fa') {
    const [jy, jm, jd] = gregorianToJalali(year, month, day);
    const text = `${jd} ${JALALI_MONTHS[jm - 1]}${withYear ? ` ${jy}` : ''}`;
    return toPersianDigits(text);
  }
  return `${GREGORIAN_MONTHS[month - 1]} ${day}${withYear ? `, ${year}` : ''}`;
}

/** 24-hour clock time, e.g. «۲۰:۰۰» / "20:00". */
export function formatClock(hours: number, minutes: number, locale: AppLocale): string {
  const text = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return localizeDigits(text, locale);
}

/** Relative time from elapsed minutes: «۲ ساعت پیش», "2 hours ago", or compact "2h ago". */
export function formatRelative(
  elapsedMinutes: number,
  locale: AppLocale,
  { compact = false }: { compact?: boolean } = {}
): string {
  const minutes = Math.max(0, Math.floor(elapsedMinutes));
  const fa = locale === 'fa';
  if (minutes < 1) return fa ? 'همین حالا' : 'Just now';
  if (minutes < 60) {
    if (fa) return `${toPersianDigits(minutes)} دقیقه پیش`;
    if (compact) return `${minutes}m ago`;
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (fa) return `${toPersianDigits(hours)} ساعت پیش`;
  if (compact) return `${hours}h ago`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
}
