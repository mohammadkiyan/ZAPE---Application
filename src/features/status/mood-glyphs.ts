import { MOODS, type Mood } from '@/api/contracts/status';

/**
 * One line glyph per mood, copied from the design canvas's `G` map: SVG path data on a 24×24
 * view box, drawn as a stroke. The RelTime device draws the same shapes.
 */
export const MOOD_GLYPHS: Record<Mood, string> = {
  happy:
    'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.64 5.64l1.77 1.77M16.6 16.6l1.77 1.77M18.36 5.64 16.6 7.4M7.4 16.6l-1.77 1.77',
  calm: 'M3 9c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M3 15c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0',
  loved: 'M12 19.25 5.42 11.3A4 4 0 1 1 12 6.81a4 4 0 1 1 6.58 4.49z',
  missing: 'M6.5 3h11M6.5 21h11M8 3c0 4.5 4 6 4 9s-4 4.5-4 9M16 3c0 4.5-4 6-4 9s4 4.5 4 9',
  focused:
    'M4.5 8.5v-4h4M15.5 4.5h4v4M19.5 15.5v4h-4M8.5 19.5h-4v-4M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
  tired: 'M11.71 3.11A8 8 0 1 0 20.89 12.29a6.5 6.5 0 0 1-9.18-9.18z',
  sad: 'M12 2.5 16.76 10.75A5.5 5.5 0 1 1 7.24 10.75z',
  upset: 'M13 2.5 5 13.5h6.5l-1 8 8.5-11h-6.5l.5-8z',
  stressed:
    'M12 11.1a1.8 1.8 0 0 1 3.6 0a3.6 3.6 0 0 1-7.2 0a5.4 5.4 0 0 1 10.8 0a7.2 7.2 0 0 1-14.4 0',
  unwell: 'M9.5 14.38V5.5a2.5 2.5 0 0 1 5 0v8.88a4 4 0 1 1-5 0zM12 16V9',
};

/** The catalog in picker order. */
export const MOOD_ORDER: readonly Mood[] = MOODS;
