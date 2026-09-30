// The ZAPE "born from meaning" blood-drop ident, ported (geometry + timing) from the web
// storefront's `ZapeStringIdent`. A drop falls, bursts at the centre and becomes the bead; the
// mark then grows outward from it. Every value is a pure worklet of the scene time `t`
// (seconds), so the UI thread can derive each SVG element's props per frame.
//
// The stage is the design's 3840×2160 canvas with the mark centred on (1919.5, 1079.5).

type Ease = (t: number) => number;

const clamp = (v: number, a: number, b: number) => {
  'worklet';
  return Math.max(a, Math.min(b, v));
};
const lerp = (a: number, b: number, t: number) => {
  'worklet';
  return a + (b - a) * t;
};
const easeInOutCubic: Ease = (t) => {
  'worklet';
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const easeOutCubic: Ease = (t) => {
  'worklet';
  return 1 - Math.pow(1 - t, 3);
};
const easeOutQuad: Ease = (t) => {
  'worklet';
  return 1 - (1 - t) * (1 - t);
};
const easeInOutSine: Ease = (t) => {
  'worklet';
  return -(Math.cos(Math.PI * t) - 1) / 2;
};
// No default parameter: the worklet plugin evaluates defaults before unpacking its closure, so
// `ease = easeInOutCubic` throws a ReferenceError on the UI thread.
const seg = (t: number, a: number, b: number, ease?: Ease) => {
  'worklet';
  const p = clamp((t - a) / (b - a), 0, 1);
  return ease ? ease(p) : easeInOutCubic(p);
};
const pulse = (t: number, a: number, peak: number, b: number) => {
  'worklet';
  if (t <= a || t >= b) return 0;
  return t < peak ? easeOutQuad((t - a) / (peak - a)) : easeOutQuad((b - t) / (b - peak));
};

export const STAGE = { width: 3840, height: 2160 };
const CX = 1919.5;
const CY = 1079.5;
export const DOT = { cx: CX, cy: CY, r: 14.5 };
/** The mark's bounding box, which the sheen sweeps across. */
export const MARK_BOX = { x: 1705, y: 568, w: 429, h: 1022 };

interface Bar {
  x: number;
  y: number;
  w: number;
  h: number;
  /** `up` anchors a vertical bar at its bottom; `rl` anchors a horizontal bar at its right. */
  grow: 'up' | 'down' | 'rl' | 'lr';
  s: number;
  e: number;
}

/**
 * Built from the centre out: both verticals, then the corner bars, then the floating outer
 * bars, top and bottom in step.
 */
export const BARS: readonly Bar[] = [
  { x: 1906, y: 631, w: 27, h: 398, grow: 'up', s: 2.35, e: 3.3 },
  { x: 1906, y: 1130, w: 27, h: 398, grow: 'down', s: 2.35, e: 3.3 },
  { x: 1721, y: 631, w: 212, h: 27, grow: 'rl', s: 3.2, e: 3.92 },
  { x: 1906, y: 1501, w: 212, h: 27, grow: 'lr', s: 3.2, e: 3.92 },
  { x: 1721, y: 584, w: 213, h: 27, grow: 'rl', s: 3.58, e: 4.18 },
  { x: 1905, y: 1548, w: 213, h: 27, grow: 'lr', s: 3.58, e: 4.18 },
];

/** Scene seconds per real second (the storefront's intro plays at the same rate). */
export const IDENT_SPEED = 1.5;
/** The mark is settled here; from then on a shimmer sweeps it repeatedly until the wait ends. */
const SHIMMER_START = 4.35;
const SHIMMER_SWEEP = 1.4;
const SHIMMER_PERIOD = 2;
/** The scene time at which the logo motion is complete: the drop has become the finished mark. */
export const IDENT_BUILT = SHIMMER_START;
/** The settled mark between two sweeps, for reduced motion. */
export const IDENT_REST = SHIMMER_START + SHIMMER_SWEEP + 0.3;

/** Maps elapsed scene seconds to the frame to draw: the build plays once, then the shimmer repeats. */
export const identTime = (elapsed: number) => {
  'worklet';
  if (elapsed < SHIMMER_START) return elapsed;
  return SHIMMER_START + ((elapsed - SHIMMER_START) % SHIMMER_PERIOD);
};

// One settle into place as assembly finishes, then rock-steady.
const settle = (t: number) => {
  'worklet';
  return 1 + 0.012 * (1 - seg(t, 3.15, 4.35, easeOutCubic));
};

export const atmosphereOpacity = (t: number) => {
  'worklet';
  return seg(t, 0, 0.8, easeOutQuad);
};

export const barRect = (bar: Bar, t: number) => {
  'worklet';
  const p = seg(t, bar.s, bar.e, easeInOutSine);
  let { x, y, w, h } = bar;
  if (bar.grow === 'rl' || bar.grow === 'lr') {
    const nw = w * p;
    if (bar.grow === 'rl') x += w - nw;
    w = nw;
  } else {
    const nh = h * p;
    if (bar.grow === 'up') y += h - nh;
    h = nh;
  }
  const k = settle(t);
  return {
    x: CX + (x - CX) * k,
    y: CY + (y - CY) * k,
    width: Math.max(w * k, 0.01),
    height: Math.max(h * k, 0.01),
    opacity: p > 0.0001 ? 1 : 0,
  };
};

// The drop: one gravity fall from above the frame, landing on the centre.
const DROP_Y0 = -80;
const DROP_T0 = 0.3;
const DROP_FALL = 1.2;
const GRAVITY = (2 * (CY - DROP_Y0)) / (DROP_FALL * DROP_FALL);
const LAND = DROP_T0 + DROP_FALL;
const MORPH_S = LAND + 0.02;
const MORPH_E = LAND + 0.22;
const TAIL_MAX = DOT.r * 2.6;

const dropY = (t: number) => {
  'worklet';
  if (t <= DROP_T0) return DROP_Y0;
  if (t >= LAND) return CY;
  const dt = t - DROP_T0;
  return DROP_Y0 + 0.5 * GRAVITY * dt * dt;
};
const dropSpeed = (t: number) => {
  'worklet';
  return t <= DROP_T0 || t >= LAND ? 0 : GRAVITY * (t - DROP_T0);
};
const squash = (t: number) => {
  'worklet';
  return pulse(t, LAND - 0.015, LAND + 0.04, LAND + 0.2);
};

const n = (v: number) => {
  'worklet';
  return v.toFixed(2);
};

/** Teardrop with its bulb (radius r) at (cx, cy) and its tip `tail` above, scaled about the bulb. */
const teardrop = (cx: number, cy: number, r: number, tail: number, sx: number, sy: number) => {
  'worklet';
  const P = (x: number, y: number) => `${n(cx + (x - cx) * sx)} ${n(cy + (y - cy) * sy)}`;
  const tp = cy - tail;
  const midY = cy - r * 0.5;
  const hx = r * 0.68;
  return (
    `M ${P(cx, tp)}` +
    ` C ${P(cx + hx, tp + tail * 0.34)}, ${P(cx + r, midY)}, ${P(cx + r, cy)}` +
    ` C ${P(cx + r, cy + r * 0.55)}, ${P(cx + r * 0.55, cy + r)}, ${P(cx, cy + r)}` +
    ` C ${P(cx - r * 0.55, cy + r)}, ${P(cx - r, cy + r * 0.55)}, ${P(cx - r, cy)}` +
    ` C ${P(cx - r, midY)}, ${P(cx - hx, tp + tail * 0.34)}, ${P(cx, tp)} Z`
  );
};

export const dropProps = (t: number) => {
  'worklet';
  const y = dropY(t);
  const sq = squash(t);
  const morph = seg(t, MORPH_S, MORPH_E, easeOutCubic);
  const speed = t < LAND ? dropSpeed(t) : GRAVITY * DROP_FALL;
  const tail = DOT.r + lerp(clamp(speed * 0.011, 0, TAIL_MAX), 0, morph);
  return {
    d: teardrop(CX, y, DOT.r, tail, 1 + 0.34 * sq, 1 - 0.3 * sq),
    opacity: seg(t, DROP_T0, DROP_T0 + 0.14, easeOutQuad) * (1 - morph),
  };
};

/** The drop resolved into the bead, which from then on is the mark's centre dot. */
export const beadProps = (t: number) => {
  'worklet';
  const sq = squash(t);
  return {
    cy: dropY(t),
    rx: DOT.r * (1 + 0.3 * sq),
    ry: DOT.r * (1 - 0.26 * sq),
    opacity: seg(t, MORPH_S, MORPH_E, easeOutCubic),
  };
};

interface Droplet {
  ang: number;
  spd: number;
  rad: number;
  life: number;
  delay: number;
}

/** The impact splatter, seeded so every run is identical. */
export const SPLATTER: readonly Droplet[] = (() => {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const count = 22;
  return Array.from({ length: count }, (_, i) => ({
    ang: (i / count) * Math.PI * 2 + (rnd() - 0.5) * 0.5,
    spd: 420 + rnd() * 1350,
    rad: 4.5 + rnd() * 13,
    life: 0.34 + rnd() * 0.34,
    delay: rnd() * 0.02,
  }));
})();

/** A droplet flung from the impact, stretched along its travel and drooping under gravity. */
export const dropletProps = (p: Droplet, t: number) => {
  'worklet';
  const lt = t - LAND - p.delay;
  if (lt <= 0 || lt >= p.life) return { d: 'M0 0', opacity: 0 };
  const prog = lt / p.life;
  const dist = p.spd * lt * (1 - 0.28 * prog);
  const dx = Math.cos(p.ang) * dist;
  const dy = Math.sin(p.ang) * dist + 0.5 * 1700 * lt * lt;
  const px = CX + dx;
  const py = CY + dy;
  const ry = Math.max(0.8, p.rad * (1 - 0.38 * prog));
  const rx = ry * (1 + clamp(p.spd / 850, 0, 1.7) * (1 - easeOutQuad(prog)));
  // A rotated ellipse as two half-arcs between the ends of its long axis.
  const a = Math.atan2(dy, dx);
  const ux = Math.cos(a) * rx;
  const uy = Math.sin(a) * rx;
  const deg = n((a * 180) / Math.PI);
  const start = `${n(px - ux)} ${n(py - uy)}`;
  const end = `${n(px + ux)} ${n(py + uy)}`;
  const arc = `${n(rx)} ${n(ry)} ${deg} 0 1`;
  return {
    d: `M ${start} A ${arc} ${end} A ${arc} ${start} Z`,
    opacity: 0.92 * (1 - easeOutQuad(prog)),
  };
};

/** The three impact rings: two burst rings, then a slower ripple. */
export const ringProps = (index: 0 | 1 | 2, t: number) => {
  'worklet';
  if (index === 2) {
    const ring = clamp((t - (LAND + 0.02)) / 0.85, 0, 1);
    const live = ring > 0 && ring < 1;
    return {
      r: 16 + ring * 78,
      strokeWidth: 2.6 * (1 - ring) + 0.6,
      opacity: live ? 0.42 * (1 - easeOutQuad(ring)) : 0,
    };
  }
  const ex = clamp((t - LAND) / 0.34, 0, 1);
  const live = ex > 0 && ex < 1;
  if (index === 0) {
    return {
      r: DOT.r + ex * 275,
      strokeWidth: 5 * (1 - ex) + 0.5,
      opacity: live ? 0.6 * (1 - easeOutQuad(ex)) : 0,
    };
  }
  return {
    r: DOT.r + easeOutCubic(ex) * 150,
    strokeWidth: 2.4 * (1 - ex),
    opacity: live ? 0.5 * (1 - ex) : 0,
  };
};

/** The warm flash as the drop lands. */
export const flashOpacity = (t: number) => {
  'worklet';
  return 0.85 * pulse(t, LAND - 0.05, LAND + 0.13, LAND + 0.5);
};

/** Width of the shimmer band's rect; its bright centre is a fraction of this. */
export const SHEEN_WIDTH = 620;

/** The shimmer crossing the finished mark, once per period, for as long as the wait lasts. */
export const sheenProps = (t: number) => {
  'worklet';
  if (t < SHIMMER_START) return { x: 0, opacity: 0 };
  const sweep = clamp(((t - SHIMMER_START) % SHIMMER_PERIOD) / SHIMMER_SWEEP, 0, 1);
  return {
    // From fully left of the mark to fully right of it.
    x: MARK_BOX.x - SHEEN_WIDTH + easeInOutSine(sweep) * (MARK_BOX.w + SHEEN_WIDTH),
    opacity: sweep > 0 && sweep < 1 ? 1 : 0,
  };
};

/**
 * The guiding lights at the growing ends: 0/1 ride the upper/lower verticals, 2/3 the
 * top/bottom corner bars.
 */
export const tipProps = (index: 0 | 1 | 2 | 3, t: number) => {
  'worklet';
  const bar = BARS[index]!;
  const p = seg(t, bar.s, bar.e, easeInOutSine);
  const vertical = index < 2;
  const vis = vertical
    ? t >= 2.35 && t < 3.48
      ? seg(t, 2.35, 2.52) * (1 - seg(t, 3.22, 3.48))
      : 0
    : t >= 3.2 && t < 4.06
      ? seg(t, 3.2, 3.36) * (1 - seg(t, 3.84, 4.06))
      : 0;
  let x: number;
  let y: number;
  if (index === 0) [x, y] = [CX, 631 + 398 * (1 - p)];
  else if (index === 1) [x, y] = [CX, 1130 + 398 * p];
  else if (index === 2) [x, y] = [1933 - 212 * p, 644.5];
  else [x, y] = [1906 + 212 * p, 1514.5];
  const k = settle(t);
  return { cx: CX + (x - CX) * k, cy: CY + (y - CY) * k, opacity: p > 0.001 ? vis : 0 };
};
