import type { RelationshipStart } from '@/api/contracts/relationship';

export interface Elapsed {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
  ms: number;
  /** 0–1 from the last anniversary to the next one. */
  yearProgress: number;
  /** Length in days of the month now being counted (anchor to next anchor), for the days dial. */
  monthDays: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** The wall-clock time in `timeZone` at `utcMs`, as a naive UTC timestamp (same fields). */
export function wallClock(utcMs: number, timeZone: string): number {
  const fields: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(new Date(utcMs))) {
    if (part.type !== 'literal') fields[part.type] = parseInt(part.value, 10);
  }
  const ms = ((utcMs % 1000) + 1000) % 1000;
  return Date.UTC(
    fields.year!,
    fields.month! - 1,
    fields.day!,
    // Some engines print midnight as 24 even with h23.
    fields.hour! % 24,
    fields.minute!,
    fields.second!,
    ms
  );
}

/** The start's wall-clock moment as a naive UTC timestamp. */
export function startWall({ date, time }: Pick<RelationshipStart, 'date' | 'time'>): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  return Date.UTC(y, m - 1, d, hh, mm);
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** `start` moved by whole calendar months, clamping the day to the target month's last day. */
function addMonths(start: number, months: number): number {
  const s = new Date(start);
  const target = s.getUTCMonth() + months;
  const year = s.getUTCFullYear() + Math.floor(target / 12);
  const month = ((target % 12) + 12) % 12;
  const day = Math.min(s.getUTCDate(), daysInMonth(year, month));
  return Date.UTC(year, month, day, s.getUTCHours(), s.getUTCMinutes(), s.getUTCSeconds());
}

/** Calendar-aware time between two naive wall-clock timestamps. Zero when `now` is before `start`. */
export function elapsedBetween(start: number, now: number): Elapsed {
  if (now <= start) {
    const s = new Date(start);
    return {
      y: 0,
      mo: 0,
      d: 0,
      h: 0,
      mi: 0,
      s: 0,
      ms: 0,
      yearProgress: 0,
      monthDays: daysInMonth(s.getUTCFullYear(), s.getUTCMonth()),
    };
  }
  const a = new Date(start);
  const b = new Date(now);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  let anchor = addMonths(start, months);
  if (anchor > now) anchor = addMonths(start, --months);

  const y = Math.floor(months / 12);
  const lastAnniversary = addMonths(start, y * 12);
  const nextAnniversary = addMonths(start, (y + 1) * 12);
  let rest = now - anchor;
  const d = Math.floor(rest / DAY);
  rest -= d * DAY;
  const h = Math.floor(rest / HOUR);
  rest -= h * HOUR;
  const mi = Math.floor(rest / MINUTE);
  rest -= mi * MINUTE;
  const s = Math.floor(rest / 1000);
  return {
    y,
    mo: months % 12,
    d,
    h,
    mi,
    s,
    ms: rest - s * 1000,
    yearProgress: (now - lastAnniversary) / (nextAnniversary - lastAnniversary),
    monthDays: Math.round((addMonths(start, months + 1) - anchor) / DAY),
  };
}

/**
 * Time together from the start (wall clock in the relationship's zone) to the current wall clock
 * in that same zone, so both partners' phones agree whatever their own zones are.
 */
export function elapsed(start: RelationshipStart, nowUtcMs: number): Elapsed {
  return elapsedBetween(startWall(start), wallClock(nowUtcMs, start.timeZone));
}

/** Progress of each dial toward its next unit, 0–1. */
export function dialProgress(e: Elapsed) {
  return {
    y: e.yearProgress,
    mo: (e.mo + e.d / e.monthDays) / 12,
    d: (e.d + e.h / 24) / e.monthDays,
    h: (e.h + e.mi / 60) / 24,
    mi: (e.mi + e.s / 60) / 60,
    s: (e.s + e.ms / 1000) / 60,
  };
}
