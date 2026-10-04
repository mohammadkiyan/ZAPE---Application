/**
 * Counts what a reader sees as characters: extended grapheme clusters (UAX #29). An emoji, a
 * flag, a family joined by zero-width joiners or a letter with its marks each count once. The
 * 120-character note limit is measured this way on the phone and in ZAPE.
 *
 * `Intl.Segmenter` does the counting where the engine has it. Where it does not, the fallback
 * below applies the same rules from compact tables. `Array.from` is not a fallback: it counts
 * code points, so «❤️» would be two and a family emoji seven.
 */

/** Code point ranges as `start` or `start-length`, in base 36, comma separated. */
function parseRanges(encoded: string): number[] {
  const bounds: number[] = [];
  for (const part of encoded.split(',')) {
    const [start, extra] = part.split('-');
    const first = parseInt(start!, 36);
    bounds.push(first, first + (extra ? parseInt(extra, 36) : 0));
  }
  return bounds;
}

function inRanges(bounds: number[], codePoint: number): boolean {
  let low = 0;
  let high = bounds.length / 2 - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (codePoint < bounds[middle * 2]!) high = middle - 1;
    else if (codePoint > bounds[middle * 2 + 1]!) low = middle + 1;
    else return true;
  }
  return false;
}

// The three tables are Unicode 17.0 data: Grapheme_Cluster_Break = Extend or SpacingMark,
// Extended_Pictographic, and Control (without CR, LF and the joiners).
const ATTACHING = parseRanges(
  'lc-33,w3-6,13l-18,14v,14x-1,150-1,153,174-a,18r-k,19s,1cm-6,1cv-5,1d3-1,1d6-3,1e9,' +
    '1f4-q,1ie-a,1kb-8,1kt,1li-3,1ln-8,1lx-2,1m1-4,1nd-2,1p3-8,1qi-n,1r7-w,1tm-2,1tq-h,' +
    '1u9-6,1uq-1,1vl-2,1x8,1xa-6,1xj-1,1xn-2,1xz,1ya-1,1z2,1z5-2,20s,20u-4,213-1,217-2,' +
    '21d,228-1,22d,22p-2,24c,24e-7,24n-2,24r-2,25e-1,262-5,269-2,27w,27y-6,287-1,28b-2,' +
    '28l-2,28y-1,29u,2bi-4,2bq-2,2bu-3,2c7,2dc-4,2f0,2f2-6,2fa-2,2fe-3,2fp-1,2g2-1,2gx-2,' +
    '2ik,2im-6,2iu-2,2iy-3,2j9-1,2jm-1,2k3,2kg-3,2m3-1,2m6-6,2me-2,2mi-3,2mv,2n6-1,2o1-2,' +
    '2q2,2q7-5,2qe,2qg-7,2r6-1,2sx,2sz-7,2tj-7,2wh,2wj-9,2x4-6,2zc-1,305,307,309,30e-1,' +
    '31t-j,32e-1,32l-a,32x-z,346,371-a,37d-5,386-3,38e-2,38x-3,39e,39g-2,39p,3a5,3tp-2,' +
    '4k2-3,4ky-2,4lu-1,4mq-1,4ok-v,4pp,4qz-2,4r3,4ud-1,4vd,4yo-b,4z4-b,55j-4,579-9,57k,' +
    '57m,57p-n,58f,59s-19,5b4-b,5c0-4,5dg-g,5ez-8,5fk-2,5gh-c,5ie-d,5k4-j,5ow-2,5p0-k,5pp,' +
    '5pw,5pz-2,5vk-1r,6bw,6hc-w,8vj-2,8zj,928-v,9ii-5,9ll-1,wvj-3,wvo-9,wwu-1,wz4-1,x6q,' +
    'x6u,x6z,x7n-4,x7w,xa8-1,xbo-h,xcw-h,xdr,xeu-7,xfr-c,xhc-3,xir-d,xk5,xm1-d,xmr,xn0-1,' +
    'xoc,xps,xpu-2,xpz-1,xq6-1,xq9,xrf-4,xrp-1,xyb-7,xyk-1,1dlq,1e68-f,1e74-f,1ehq-1,1eyl,' +
    '1f4w,1f92-4,1gjl-2,1gjp-1,1gjw-3,1gl4-2,1glb,1gpx-1,1h5w-3,1h7t-4,1hgr-1,1hiy-5,' +
    '1hl2-a,1hmq-3,1hq8-2,1hrs-e,1htc,1htf-1,1htr-3,1hv4-a,1hvm,1hxc-2,1hyf-d,1hz9-1,1i0j,' +
    '1i0w-2,1i2b-d,1i2x-3,1i32-1,1i5o-b,1i66,1i69,1ian-b,1ibk-3,1id7-1,1ida-6,1idj-1,' +
    '1idn-2,1idz,1iea-1,1iee-6,1ieo-4,1igo-8,1igy,1ih1,1ih3-3,1ih8-4,1ihe,1iht-1,1ik5-h,' +
    '1ila,1ink-j,1iun-6,1iuw-8,1ivw-1,1iy8-g,1j1n-c,1j4t-2,1j4y-9,1jcc-e,1jjk-5,1jjr-1,' +
    '1jjv-3,1jk0,1jk2-1,1jo1-6,1joa-6,1jok,1jpd-9,1jqr-6,1jqz-3,1jrb,1jrl-a,1jt6-f,1jz4-7,' +
    '1k4v-7,1k54-7,1k7m-l,1k89-d,1kc1-5,1kca,1kcc-1,1kcf-6,1kcn,1kei-4,1keo-1,1ker-4,' +
    '1koj-3,1kow-1,1koz,1kqc-6,1kqm-4,1kre,1ow0,1ow7-e,1xr2-h,1zow-4,1zqo-6,20jz,20k1-1i,' +
    '20lr-3,20o4,20og-1,2ftp-1,2jgg-19,2jhs-m,2jxh-4,2jxp-5,2jy3-7,2jyd-6,2jze-3,2k3m-2,' +
    '2lmo-1i,2lob-1d,2lpx,2lqc,2lqz-4,2lr5-e,2mtc-6,2mtk-g,2mu3-6,2mub-1,2mue-4,2mxb,' +
    '2n1s-6,2nce,2ne4-3,2nsc-3,2nzi-1,2o6b,2o6e,2o6m-1,2o6t,2ok0-6,2on8-6,2qrf-4,jnz4-2n,' +
    'jo5c-6n'
);
const PICTOGRAPHIC = parseRanges(
  '4p,4u,6d8,6dl,6jm,6k9,6ms-5,6nd-1,6xm-1,6y0,72n,73d-a,73s-2,79e,7fu-1,7g6,7gg,7i3-3,' +
    '7i8-4,7im,7ip,7is-1,7iw,7j1,7j4,7j6-1,7ja,7je,7ji-1,7js-2,7k0,7k2,7k8-b,7kv-1,7kz,' +
    '7l1-1,7l4,7ln,7lq-1,7ma-5,7mh,7mj-1,7mo-1,7mv,7my-1,7n4-1,7nh-1,7no-1,7ns,7ny-1,7o1,' +
    '7o3-1,7op-1,7ow-5,7p3-3,7p9,7pe,7ph,7pk-5,7pr,7pu,7pw,7py,7q5,7q9,7qg,7qr-1,7r8,7rb,' +
    '7rg,7ri,7rn-2,7rr,7s3-1,7th-2,7tt,7u8,7un,850-1,8hx-2,8ij-1,8k0,8k5,9io,9j1,9zr,9zt,' +
    '2pz8,2q0c-3,2q38-b,2q3z-1,2q4g,2q4v-1,2q5y-9,2q9c-1,2q9q-1,2qa6,2qa9-9,2qb2-1j,' +
    '2qdd-e,2qe2,2qen,2qeq-8,2qf0-3,2qfd-m,2qg6-57,2qlg-33,2qom-1,2qop-2,2qou-2a,2qr7-2,' +
    '2qrb-3,2qrk-71,2qyn-1q,2r0p-5,2r0w-n,2r1r-1,2r1v-7,2r2f,2r2i-3,2r2o,2r2t-1,2r38-1,' +
    '2r3c,2r3l-1,2r3w,2r42-2,2r4h-2,2r4s-2,2r4x,2r4z,2r54,2r5b,2r5f,2r5m-2d,2r9c-1x,' +
    '2rbf-7,2rbp-g,2rc9,2rcb-5,2rcj-c,2riy-11,2rkc-3,2rm0-7,2rmi-5,2rns-7,2rou-1,2rp8-3,' +
    '2rpe-d,2rq1-12,2rrg-1a,2rss-9,2rt3-54,2s0o-7,2s1a-41,2scg-sd'
);
const CONTROL = parseRanges(
  '0-9,b-1,e-h,3j-w,4t,17g,4r2,6bv,6by-1,6co-6,6e8-f,1edb,1ek0-b,1ovk-f,2fts-3,2jxv-7,' +
    'jny8-v,jo1s-3j,joc0-2rz'
);

const CR = 0x0d;
const LF = 0x0a;
const ZWJ = 0x200d;

type Kind =
  | 'cr'
  | 'lf'
  | 'control'
  | 'attaching'
  | 'zwj'
  | 'flag'
  | 'pictographic'
  | 'l'
  | 'v'
  | 't'
  | 'lv'
  | 'lvt'
  | 'other';

function kindOf(codePoint: number): Kind {
  if (codePoint === CR) return 'cr';
  if (codePoint === LF) return 'lf';
  if (codePoint === ZWJ) return 'zwj';
  if (inRanges(CONTROL, codePoint)) return 'control';
  if (inRanges(ATTACHING, codePoint)) return 'attaching';
  if (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) return 'flag';
  // Hangul jamo and syllables join into one syllable block (GB6–GB8).
  if (inSpan(codePoint, 0x1100, 0x115f) || inSpan(codePoint, 0xa960, 0xa97c)) return 'l';
  if (inSpan(codePoint, 0x1160, 0x11a7) || inSpan(codePoint, 0xd7b0, 0xd7c6)) return 'v';
  if (inSpan(codePoint, 0x11a8, 0x11ff) || inSpan(codePoint, 0xd7cb, 0xd7fb)) return 't';
  if (inSpan(codePoint, 0xac00, 0xd7a3)) return (codePoint - 0xac00) % 28 ? 'lvt' : 'lv';
  return inRanges(PICTOGRAPHIC, codePoint) ? 'pictographic' : 'other';
}

function inSpan(codePoint: number, first: number, last: number): boolean {
  return codePoint >= first && codePoint <= last;
}

/** The table-driven count, exported so tests can hold it to the same fixtures as the engine's. */
export function countGraphemesFallback(text: string): number {
  let count = 0;
  let previous: Kind | undefined;
  /** Regional indicators seen in a row: flags are pairs (GB12, GB13). */
  let flagRun = 0;
  /** A pictograph, its marks and then a joiner: the next pictograph continues it (GB11). */
  let emojiChain: 'none' | 'open' | 'joined' = 'none';
  for (const character of text) {
    const kind = kindOf(character.codePointAt(0)!);
    let boundary = true;
    if (previous === undefined) boundary = true;
    else if (previous === 'cr' && kind === 'lf') boundary = false;
    else if (isBreak(previous) || isBreak(kind)) boundary = true;
    else if (kind === 'attaching' || kind === 'zwj') boundary = false;
    else if (kind === 'pictographic' && emojiChain === 'joined') boundary = false;
    else if (kind === 'flag' && previous === 'flag' && flagRun % 2 === 1) boundary = false;
    else if (previous === 'l' && (kind === 'l' || kind === 'v' || kind === 'lv' || kind === 'lvt'))
      boundary = false;
    else if ((previous === 'lv' || previous === 'v') && (kind === 'v' || kind === 't'))
      boundary = false;
    else if ((previous === 'lvt' || previous === 't') && kind === 't') boundary = false;
    if (boundary) count += 1;

    flagRun = kind === 'flag' ? flagRun + 1 : 0;
    if (kind === 'pictographic') emojiChain = 'open';
    else if (kind === 'zwj' && emojiChain === 'open') emojiChain = 'joined';
    else if (!(kind === 'attaching' && emojiChain === 'open')) emojiChain = 'none';
    previous = kind;
  }
  return count;
}

function isBreak(kind: Kind): boolean {
  return kind === 'cr' || kind === 'lf' || kind === 'control';
}

interface GraphemeSegmenter {
  segment(input: string): Iterable<unknown>;
}

let segmenter: GraphemeSegmenter | null | undefined;

function engineSegmenter(): GraphemeSegmenter | null {
  if (segmenter === undefined) {
    try {
      const Segmenter = (
        Intl as unknown as {
          Segmenter?: new (
            locale?: string,
            options?: { granularity: 'grapheme' }
          ) => GraphemeSegmenter;
        }
      ).Segmenter;
      segmenter = Segmenter ? new Segmenter(undefined, { granularity: 'grapheme' }) : null;
    } catch {
      segmenter = null;
    }
  }
  return segmenter;
}

/** The number of grapheme clusters in `text`. */
export function countGraphemes(text: string): number {
  const engine = engineSegmenter();
  if (!engine) return countGraphemesFallback(text);
  let count = 0;
  const clusters = engine.segment(text)[Symbol.iterator]();
  while (!clusters.next().done) count += 1;
  return count;
}
