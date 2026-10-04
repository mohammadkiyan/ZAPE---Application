import { MOODS } from '@/api/contracts/status';
import { en } from '@/localization/resources/en';
import { fa } from '@/localization/resources/fa';
import { MOOD_GLYPHS, MOOD_ORDER } from './mood-glyphs';

describe('mood catalog', () => {
  it('has a glyph and both labels for each of the ten moods', () => {
    expect(MOODS).toHaveLength(10);
    for (const mood of MOODS) {
      expect([mood, MOOD_GLYPHS[mood]]).toEqual([mood, expect.stringMatching(/^M[\d. -]/)]);
      expect([mood, fa.status.moods[mood]]).toEqual([mood, expect.stringMatching(/\S/)]);
      expect([mood, en.status.moods[mood]]).toEqual([mood, expect.stringMatching(/\S/)]);
    }
    expect(Object.keys(MOOD_GLYPHS).sort()).toEqual([...MOODS].sort());
    expect(Object.keys(fa.status.moods).sort()).toEqual([...MOODS].sort());
    expect(Object.keys(en.status.moods).sort()).toEqual([...MOODS].sort());
  });

  it('gives every mood its own glyph and its own label', () => {
    expect(new Set(Object.values(MOOD_GLYPHS)).size).toBe(10);
    expect(new Set(Object.values(fa.status.moods)).size).toBe(10);
    expect(new Set(Object.values(en.status.moods)).size).toBe(10);
  });

  it('labels the moods as the spec names them, in picker order', () => {
    expect(MOOD_ORDER.map((mood) => [mood, fa.status.moods[mood], en.status.moods[mood]])).toEqual([
      ['happy', 'شاد', 'Happy'],
      ['calm', 'آرام', 'Calm'],
      ['loved', 'عاشق', 'Loved'],
      ['missing', 'دلتنگ', 'Missing you'],
      ['focused', 'متمرکز', 'Focused'],
      ['tired', 'خسته', 'Tired'],
      ['sad', 'غمگین', 'Sad'],
      ['upset', 'دلخور', 'Upset'],
      ['stressed', 'نگران', 'Stressed'],
      ['unwell', 'ناخوش', 'Unwell'],
    ]);
  });

  it('keeps each glyph inside the 24×24 view box', () => {
    for (const mood of MOODS) {
      // Absolute coordinates only: every `M` and capital command stays within 0–24.
      const starts = [...MOOD_GLYPHS[mood].matchAll(/M(-?[\d.]+)[ ,](-?[\d.]+)/g)];
      expect(starts.length).toBeGreaterThan(0);
      for (const [, x, y] of starts) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(x)).toBeLessThanOrEqual(24);
        expect(Number(y)).toBeGreaterThanOrEqual(0);
        expect(Number(y)).toBeLessThanOrEqual(24);
      }
    }
  });
});
