import { elapsed, elapsedBetween, wallClock } from './elapsed';

const canvasStart = { date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' };

describe('elapsed', () => {
  it('matches the canvas example', () => {
    // 2026-09-26 23:31:11.508 in Tehran (UTC+03:30).
    const now = Date.UTC(2026, 8, 26, 20, 1, 11, 508);
    expect(elapsed(canvasStart, now)).toMatchObject({
      y: 5,
      mo: 6,
      d: 12,
      h: 3,
      mi: 31,
      s: 11,
      ms: 508,
    });
  });

  it('gives both partners the same values whatever their phone zone', () => {
    const now = Date.UTC(2026, 8, 26, 20, 1, 11, 508);
    const previous = process.env.TZ;
    process.env.TZ = 'Europe/Berlin';
    const berlin = elapsed(canvasStart, now);
    process.env.TZ = previous;
    expect(berlin).toEqual(elapsed(canvasStart, now));
  });

  it('clamps to the month end: Jan 31 → Mar 1 is one month and one day', () => {
    const start = { date: '2023-01-31', time: '00:00', timeZone: 'UTC' };
    expect(elapsed(start, Date.UTC(2023, 2, 1))).toMatchObject({ y: 0, mo: 1, d: 1, h: 0 });
    // A start on the 31st anniversaries on the 30th in 30-day months.
    expect(elapsed(start, Date.UTC(2023, 3, 30))).toMatchObject({ mo: 3, d: 0 });
  });

  it('anniversaries a Feb 29 start on Feb 28 in common years', () => {
    const start = { date: '2020-02-29', time: '00:00', timeZone: 'UTC' };
    expect(elapsed(start, Date.UTC(2021, 1, 28))).toMatchObject({ y: 1, mo: 0, d: 0 });
    expect(elapsed(start, Date.UTC(2021, 2, 1))).toMatchObject({ y: 1, mo: 0, d: 1 });
    expect(elapsed(start, Date.UTC(2021, 1, 27, 23))).toMatchObject({ y: 0, mo: 11, d: 29 });
  });

  it('counts wall-clock time across a Europe/Berlin DST change', () => {
    // Clocks went forward at 02:00 on 2024-03-31, so only 23 real hours pass.
    const start = { date: '2024-03-30', time: '12:00', timeZone: 'Europe/Berlin' };
    const now = Date.UTC(2024, 2, 31, 10); // 12:00 CEST
    expect(now - Date.UTC(2024, 2, 30, 11)).toBe(23 * 3600_000);
    expect(elapsed(start, now)).toMatchObject({ d: 1, h: 0, mi: 0 });
  });

  it('is zero at the start and before it', () => {
    const start = Date.UTC(2021, 2, 14, 20);
    const zero = { y: 0, mo: 0, d: 0, h: 0, mi: 0, s: 0, ms: 0, yearProgress: 0 };
    expect(elapsedBetween(start, start)).toMatchObject(zero);
    expect(elapsedBetween(start, start - 1000)).toMatchObject(zero);
  });

  it('reports year progress toward the next anniversary', () => {
    const start = { date: '2021-01-01', time: '00:00', timeZone: 'UTC' };
    // 182.5 days into the 365-day year 2022.
    const halfway = Date.UTC(2022, 0, 1) + 182.5 * 86_400_000;
    expect(elapsed(start, halfway).yearProgress).toBeCloseTo(0.5, 6);
  });

  it('knows the Asia/Tehran and Europe/Berlin offsets (ICU time-zone data)', () => {
    const noon = Date.UTC(2026, 0, 15, 12);
    expect(wallClock(noon, 'Asia/Tehran') - noon).toBe(3.5 * 3600_000);
    expect(wallClock(noon, 'Europe/Berlin') - noon).toBe(3600_000);
    const summer = Date.UTC(2026, 6, 15, 12);
    expect(wallClock(summer, 'Europe/Berlin') - summer).toBe(2 * 3600_000);
  });
});
