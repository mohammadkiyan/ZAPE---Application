import {
  BARS,
  DOT,
  IDENT_REST,
  barRect,
  beadProps,
  dropProps,
  identTime,
  sheenProps,
  tipProps,
} from './zape-ident';

describe('ZAPE ident', () => {
  it('plays the build once, then loops the settled mark', () => {
    expect(identTime(2)).toBe(2);
    expect(identTime(4.35)).toBeCloseTo(4.35);
    expect(identTime(4.35 + 2 * 3 + 0.5)).toBeCloseTo(4.85);
    expect(identTime(1000)).toBeGreaterThanOrEqual(4.35);
    expect(identTime(1000)).toBeLessThan(6.35);
  });

  it('keeps shimmering across the mark while the wait lasts', () => {
    expect(sheenProps(4)).toMatchObject({ opacity: 0 });
    // Mid-sweep in the first, the tenth and the hundredth loop.
    for (const loop of [0, 10, 100]) {
      const sweep = sheenProps(identTime(4.35 + loop * 2 + 0.7));
      expect(sweep.opacity).toBe(1);
      expect(sweep.x).toBeGreaterThan(1705 - 620);
      expect(sweep.x).toBeLessThan(1705 + 429);
    }
  });

  it('starts with nothing drawn and the drop above the frame', () => {
    expect(dropProps(0).opacity).toBe(0);
    expect(beadProps(0).opacity).toBe(0);
    for (const bar of BARS) expect(barRect(bar, 0).opacity).toBe(0);
  });

  it('rests on the fully built mark with no moving light', () => {
    BARS.forEach((bar) => {
      const rect = barRect(bar, IDENT_REST);
      expect(rect).toEqual({ x: bar.x, y: bar.y, width: bar.w, height: bar.h, opacity: 1 });
    });
    expect(beadProps(IDENT_REST)).toEqual({ cy: DOT.cy, rx: DOT.r, ry: DOT.r, opacity: 1 });
    expect(dropProps(IDENT_REST).opacity).toBe(0);
    expect(sheenProps(IDENT_REST).opacity).toBe(0);
    for (const i of [0, 1, 2, 3] as const) expect(tipProps(i, IDENT_REST).opacity).toBe(0);
  });
});
