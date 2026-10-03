import { recordServerDate, resetServerClock } from '@/api/server-clock';
import {
  formatClock,
  formatCountdown,
  formatDate,
  formatNumber,
  formatRelative,
  formatRelativeTime,
  gregorianToJalali,
  gregorianToJalaliArithmetic,
  jalaliToGregorian,
  toAsciiDigits,
  toPersianDigits,
} from './format';

describe('locale formatting', () => {
  it('uses Persian digits for fa only', () => {
    expect(toPersianDigits('2021-03-14')).toBe('۲۰۲۱-۰۳-۱۴');
    expect(formatNumber(1234, 'fa')).toBe('۱۲۳۴');
    expect(formatNumber(1234, 'en')).toBe('1234');
  });

  it('pins 1399-12-24 ↔ 2021-03-14 through ICU and the arithmetic fallback', () => {
    expect(gregorianToJalali(2021, 3, 14)).toEqual([1399, 12, 24]);
    expect(gregorianToJalaliArithmetic(2021, 3, 14)).toEqual([1399, 12, 24]);
    expect(jalaliToGregorian(1399, 12, 24)).toEqual([2021, 3, 14]);
  });

  it('agrees with ICU across Nowruz and leap years', () => {
    const samples: [number, number, number][] = [
      [2020, 3, 20],
      [2021, 3, 21],
      [2024, 3, 20],
      [2025, 3, 21],
      [2000, 2, 29],
      [2023, 12, 31],
    ];
    for (const [y, m, d] of samples) {
      const jalali = gregorianToJalaliArithmetic(y, m, d);
      expect(jalali).toEqual(gregorianToJalali(y, m, d));
      expect(jalaliToGregorian(...jalali)).toEqual([y, m, d]);
    }
  });

  it('formats dates as Jalali in Persian and Gregorian in English', () => {
    expect(formatDate([2021, 3, 14], 'fa')).toBe('۲۴ اسفند ۱۳۹۹');
    expect(formatDate([2021, 3, 14], 'fa', { withYear: false })).toBe('۲۴ اسفند');
    expect(formatDate([2021, 3, 14], 'en')).toBe('March 14, 2021');
    expect(formatDate([2021, 3, 14], 'en', { withYear: false })).toBe('March 14');
    expect(formatDate([2021, 3, 14], 'fa', { calendar: 'gregorian' })).toBe('۱۴ مارس ۲۰۲۱');
    expect(formatDate([2021, 3, 14], 'en', { calendar: 'jalali' })).toBe('March 14, 2021');
  });

  it('formats clock times', () => {
    expect(formatClock(20, 0, 'fa')).toBe('۲۰:۰۰');
    expect(formatClock(8, 5, 'en')).toBe('08:05');
  });

  it('formats relative times in full and compact forms', () => {
    expect(formatRelative(0, 'fa')).toBe('همین حالا');
    expect(formatRelative(0, 'en')).toBe('Just now');
    expect(formatRelative(5, 'fa')).toBe('۵ دقیقه پیش');
    expect(formatRelative(1, 'en')).toBe('1 minute ago');
    expect(formatRelative(5, 'en', { compact: true })).toBe('5m ago');
    expect(formatRelative(120, 'fa')).toBe('۲ ساعت پیش');
    expect(formatRelative(120, 'en')).toBe('2 hours ago');
    expect(formatRelative(120, 'en', { compact: true })).toBe('2h ago');
  });

  it('folds Persian and Arabic-Indic digits to ASCII', () => {
    expect(toAsciiDigits('۰۹۱۲ ۳۴۵ ٦٧٨٩')).toBe('0912 345 6789');
  });

  it('formats a resend countdown', () => {
    expect(formatCountdown(42, 'fa')).toBe('۰:۴۲');
    expect(formatCountdown(60, 'en')).toBe('1:00');
    expect(formatCountdown(41.2, 'en')).toBe('0:42');
    expect(formatCountdown(-3, 'en')).toBe('0:00');
  });
});

describe('relative time against the server clock', () => {
  const PHONE_NOW = Date.parse('2026-10-03T12:00:00.000Z');
  beforeEach(() => {
    resetServerClock();
    jest.spyOn(Date, 'now').mockReturnValue(PHONE_NOW);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    resetServerClock();
  });

  it('formats the age of a server timestamp', () => {
    expect(formatRelativeTime('2026-10-03T11:50:00.000Z', 'fa')).toBe('۱۰ دقیقه پیش');
    expect(formatRelativeTime('2026-10-03T11:50:00.000Z', 'en', { compact: true })).toBe('10m ago');
    expect(formatRelativeTime('2026-10-03T09:59:00.000Z', 'en')).toBe('2 hours ago');
    expect(formatRelativeTime('2026-10-03T11:59:40.000Z', 'en')).toBe('Just now');
  });

  it('uses the server offset, so a slow phone clock does not read "Just now" forever', () => {
    // The status was set at 12:05 server time; this phone still thinks it is 12:00.
    const at = '2026-10-03T12:05:00.000Z';
    expect(formatRelativeTime(at, 'en')).toBe('Just now');
    // A response arrives: the server's clock reads 12:15.
    recordServerDate('Sat, 03 Oct 2026 12:15:00 GMT', PHONE_NOW, PHONE_NOW);
    expect(formatRelativeTime(at, 'en')).toBe('10 minutes ago');
    expect(formatRelativeTime(at, 'fa')).toBe('۱۰ دقیقه پیش');
  });

  it('uses the server offset when the phone clock runs fast', () => {
    // The phone is an hour ahead: without the offset a new status would read "1 hour ago".
    recordServerDate('Sat, 03 Oct 2026 11:00:00 GMT', PHONE_NOW, PHONE_NOW);
    expect(formatRelativeTime('2026-10-03T10:58:00.000Z', 'en')).toBe('2 minutes ago');
  });

  it('never goes negative for a timestamp slightly in the future', () => {
    expect(formatRelativeTime('2026-10-03T12:00:30.000Z', 'fa')).toBe('همین حالا');
  });
});
