import { formatClock, type DateParts } from '@/localization/format';
import type { AppLocale } from '@/localization/locale';
import { useCachedRelationship } from '@/features/relationship/use-relationship';
import { wallClock } from './elapsed';

const DAY = 86_400_000;

/**
 * The zone shared times are read in: the relationship's, so both partners see the same hour
 * and the same "today" the server lists. Falls back to the phone's zone until it is known.
 */
export function useRelationshipTimeZone(): string {
  const zone = useCachedRelationship()?.start.timeZone;
  return zone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** The wall-clock hour and minute in `timeZone` at `at`: «۱۶:۱۵» / "16:15". */
export function formatZoneClock(
  at: string | number | Date,
  timeZone: string,
  locale: AppLocale
): string {
  const wall = new Date(wallClock(new Date(at).getTime(), timeZone));
  return formatClock(wall.getUTCHours(), wall.getUTCMinutes(), locale);
}

/** Whole calendar days in `timeZone` between `at` and `now`: 0 is today, 1 is yesterday. */
export function zoneDaysAgo(at: string | number | Date, now: number, timeZone: string): number {
  const day = (ms: number) => Math.floor(wallClock(ms, timeZone) / DAY);
  return day(now) - day(new Date(at).getTime());
}

/** The Gregorian calendar date in `timeZone` at `at`. */
export function zoneDateParts(at: string | number | Date, timeZone: string): DateParts {
  const wall = new Date(wallClock(new Date(at).getTime(), timeZone));
  return [wall.getUTCFullYear(), wall.getUTCMonth() + 1, wall.getUTCDate()];
}
