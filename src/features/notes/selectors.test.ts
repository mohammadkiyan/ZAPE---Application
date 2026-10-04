import type { Note, NoteBoard } from '@/api/contracts/notes';
import { hasUnreadPartnerNote, latestNote } from './selectors';

function note(overrides: Partial<Note>): Note {
  return {
    id: 'nv_1',
    text: 'به تو فکر می‌کنم.',
    updatedAt: '2026-10-03T12:43:00.000Z',
    edited: false,
    seenAt: null,
    ...overrides,
  };
}

describe('unread selector', () => {
  it('is true only for a partner note you have not read', () => {
    expect(hasUnreadPartnerNote(undefined)).toBe(false);
    expect(hasUnreadPartnerNote({ you: null, partner: null })).toBe(false);
    expect(hasUnreadPartnerNote({ you: note({}), partner: null })).toBe(false);
    expect(hasUnreadPartnerNote({ you: null, partner: note({}) })).toBe(true);
    expect(
      hasUnreadPartnerNote({
        you: null,
        partner: note({ seenAt: '2026-10-03T13:07:02.000Z' }),
      })
    ).toBe(false);
  });

  it('ignores whether your own note was seen', () => {
    const board: NoteBoard = { you: note({ seenAt: null }), partner: null };
    expect(hasUnreadPartnerNote(board)).toBe(false);
  });
});

describe('latest note for Home', () => {
  const seen = '2026-10-03T13:07:02.000Z';

  it('is nothing when neither of you has a note', () => {
    expect(latestNote(undefined)).toBeNull();
    expect(latestNote({ you: null, partner: null })).toBeNull();
  });

  it('is the partner’s unread note even when yours is newer', () => {
    const partner = note({ id: 'nv_p', updatedAt: '2026-10-03T08:00:00.000Z' });
    const you = note({ id: 'nv_y', updatedAt: '2026-10-03T12:00:00.000Z' });
    expect(latestNote({ you, partner })).toEqual({ owner: 'partner', note: partner, unread: true });
  });

  it('is whichever note is newer once the partner’s is read', () => {
    const partner = note({ id: 'nv_p', updatedAt: '2026-10-03T08:00:00.000Z', seenAt: seen });
    const newerYou = note({ id: 'nv_y', updatedAt: '2026-10-03T12:00:00.000Z' });
    expect(latestNote({ you: newerYou, partner })).toEqual({
      owner: 'you',
      note: newerYou,
      unread: false,
    });
    const olderYou = note({ id: 'nv_y', updatedAt: '2026-10-02T12:00:00.000Z' });
    expect(latestNote({ you: olderYou, partner })).toEqual({
      owner: 'partner',
      note: partner,
      unread: false,
    });
  });

  it('is the only note there is', () => {
    const you = note({ id: 'nv_y' });
    expect(latestNote({ you, partner: null })).toEqual({ owner: 'you', note: you, unread: false });
    const partner = note({ id: 'nv_p', seenAt: seen });
    expect(latestNote({ you: null, partner })).toEqual({
      owner: 'partner',
      note: partner,
      unread: false,
    });
  });
});
