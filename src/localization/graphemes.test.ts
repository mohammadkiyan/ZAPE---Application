import contract from '@/api/contracts/fixtures/zape-status-notes.contract.json';
import { countGraphemes, countGraphemesFallback } from './graphemes';

const HEART = '❤️';
const FAMILY = '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}';

describe('countGraphemes', () => {
  it('counts the shared ZAPE fixtures: emoji, ZWJ sequences, flags and Persian text', () => {
    expect(contract.graphemes.length).toBeGreaterThanOrEqual(10);
    for (const sample of contract.graphemes) {
      expect([sample.label, countGraphemes(sample.text)]).toEqual([sample.label, sample.count]);
    }
  });

  it('counts an emoji once, where code points would count it twice or more', () => {
    expect(countGraphemes(HEART)).toBe(1);
    expect(Array.from(HEART)).toHaveLength(2);
    expect(countGraphemes(FAMILY)).toBe(1);
    expect(Array.from(FAMILY)).toHaveLength(7);
  });

  it('counts 119 letters plus «❤️» as 120', () => {
    expect(countGraphemes('ب'.repeat(119) + HEART)).toBe(120);
    expect(countGraphemes('')).toBe(0);
  });

  it('keeps a Persian zero-width non-joiner inside its letter', () => {
    // «می‌کنم»: five letters, the half-space is not a character of its own.
    expect(countGraphemes('می‌کنم')).toBe(5);
    expect(countGraphemes('خوش‌آمدید')).toBe(8);
  });
});

describe('countGraphemesFallback', () => {
  it('agrees with the shared fixtures without Intl.Segmenter', () => {
    for (const sample of contract.graphemes) {
      expect([sample.label, countGraphemesFallback(sample.text)]).toEqual([
        sample.label,
        sample.count,
      ]);
    }
  });

  it('agrees with the engine on emoji sequences, marks and syllables', () => {
    const samples = [
      '',
      'hello',
      'tab\there',
      'two\nlines',
      `${HEART}${HEART}`,
      FAMILY.repeat(3),
      '\u{1F1EE}\u{1F1F7}\u{1F1E9}\u{1F1EA}\u{1F1EB}\u{1F1F7}',
      '\u{1F1EE}\u{1F1F7}a\u{1F1E9}\u{1F1EA}',
      '\u{1F469}\u{1F3FD}‍\u{1F4BB}\u{1F468}\u{1F3FF}‍\u{1F680}',
      '✌\u{1F3FC}',
      '#️⃣*️⃣',
      '\u{1F3F3}️‍\u{1F308}\u{1F3F4}‍☠️',
      '©️®️™️',
      'à́b',
      'مَحَبَّت و عِشق',
      'خوش‌آمدید \u{1F339}',
      '한국어',
      '한글',
      'ไทย',
      'x‍',
    ];
    for (const sample of samples) {
      expect([sample, countGraphemesFallback(sample)]).toEqual([sample, countGraphemes(sample)]);
    }
  });

  it('is what countGraphemes uses when the engine has no segmenter', () => {
    const intl = Intl as unknown as { Segmenter?: unknown };
    const original = intl.Segmenter;
    try {
      intl.Segmenter = undefined;
      jest.isolateModules(() => {
        const isolated = jest.requireActual<typeof import('./graphemes')>('./graphemes');
        expect(isolated.countGraphemes(FAMILY + HEART)).toBe(2);
        expect(isolated.countGraphemes('می‌کنم')).toBe(5);
      });
    } finally {
      intl.Segmenter = original;
    }
  });
});
