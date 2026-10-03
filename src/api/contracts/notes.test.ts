import contract from './fixtures/zape-status-notes.contract.json';
import {
  NOTE_ERROR_CODES,
  NOTE_MAX_CODE_UNITS,
  NOTE_VERSION_CHANGED,
  isValidNoteText,
  noteBoardSchema,
  noteReadSchema,
  noteSchema,
  saveNoteSchema,
} from './notes';
import { STATUS_ERROR_CODES } from './status';

const HEART = '❤️';
const FAMILY = '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}';

describe('notes contract', () => {
  it('parses the note board ZAPE returns', () => {
    const board = noteBoardSchema.parse(contract.responses.noteBoard);
    expect(board).toEqual(contract.responses.noteBoard);
    // Your note was read; the partner's edited note is a new, unread version.
    expect(board.you?.seenAt).toBe('2026-10-03T06:35:00.000Z');
    expect(board.partner).toMatchObject({ edited: true, seenAt: null });
  });

  it('parses an empty board, a saved note and a read receipt', () => {
    expect(noteBoardSchema.parse(contract.responses.noteBoardEmpty)).toEqual({
      you: null,
      partner: null,
    });
    expect(noteSchema.parse(contract.responses.note)).toEqual(contract.responses.note);
    expect(noteReadSchema.parse(contract.responses.noteRead)).toEqual({
      id: 'nv_p4Jd0sXe6TqUa2Wm9Bv5Lg',
      seenAt: '2026-10-03T13:07:02.000Z',
    });
  });

  it('rejects a note without an id, with empty text or with a local time', () => {
    const note = contract.responses.note;
    expect(noteSchema.safeParse({ ...note, id: '' }).success).toBe(false);
    expect(noteSchema.safeParse({ ...note, text: '' }).success).toBe(false);
    expect(noteSchema.safeParse({ ...note, updatedAt: '2026-10-03 16:36' }).success).toBe(false);
    expect(noteSchema.safeParse({ ...note, seenAt: undefined }).success).toBe(false);
  });

  it('accepts exactly 120 characters, counting an emoji as one', () => {
    const text = 'ب'.repeat(119) + HEART;
    expect(saveNoteSchema.parse({ text })).toEqual({ text });
    expect(isValidNoteText(FAMILY.repeat(120))).toBe(true);
  });

  it('rejects a 121-grapheme note, also when the extra characters are emoji sequences', () => {
    expect(saveNoteSchema.safeParse({ text: 'ب'.repeat(121) }).success).toBe(false);
    expect(saveNoteSchema.safeParse({ text: 'ب'.repeat(120) + HEART }).success).toBe(false);
    expect(saveNoteSchema.safeParse({ text: FAMILY.repeat(121) }).success).toBe(false);
  });

  it('trims the text and rejects a note that is then empty', () => {
    expect(saveNoteSchema.parse({ text: '  به تو فکر می‌کنم.\n' })).toEqual({
      text: 'به تو فکر می‌کنم.',
    });
    expect(saveNoteSchema.safeParse({ text: '  \n ' }).success).toBe(false);
    expect(isValidNoteText(`  ${'a'.repeat(120)}  `)).toBe(true);
  });

  it('rejects stacked combining marks past the storage bound', () => {
    expect(isValidNoteText('a' + '́'.repeat(NOTE_MAX_CODE_UNITS))).toBe(false);
  });

  it('knows the stale-read code and every note error code ZAPE answers with', () => {
    expect(NOTE_VERSION_CHANGED).toBe('note_version_changed');
    expect(contract.errors.note_version_changed).toBe(409);
    expect(contract.errors.note_too_long).toBe(400);
    for (const code of NOTE_ERROR_CODES) {
      expect(contract.errors).toHaveProperty(code);
    }
    // Between them the two contracts cover every code in ZAPE's table but `no_relationship`.
    expect(
      Object.keys(contract.errors)
        .filter((code) => code !== 'no_relationship')
        .sort()
    ).toEqual([...new Set([...NOTE_ERROR_CODES, ...STATUS_ERROR_CODES])].sort());
  });
});
