import type { Note, NoteBoard } from '@/api/contracts/notes';

/**
 * The one definition of "unread": your partner has a current note and you have not read that
 * version. It drives the Note tab's NEW badge, the Home badge and the tab bar dot alike.
 */
export function hasUnreadPartnerNote(board: NoteBoard | null | undefined): boolean {
  return Boolean(board?.partner && !board.partner.seenAt);
}

export interface LatestNote {
  owner: 'you' | 'partner';
  note: Note;
  unread: boolean;
}

/**
 * The note Home shows: your partner's while it is unread, otherwise whichever current note is
 * newer. Null when neither of you has one.
 */
export function latestNote(board: NoteBoard | null | undefined): LatestNote | null {
  const you = board?.you;
  const partner = board?.partner;
  if (partner && !partner.seenAt) return { owner: 'partner', note: partner, unread: true };
  if (you && partner) {
    return Date.parse(you.updatedAt) >= Date.parse(partner.updatedAt)
      ? { owner: 'you', note: you, unread: false }
      : { owner: 'partner', note: partner, unread: false };
  }
  if (you) return { owner: 'you', note: you, unread: false };
  if (partner) return { owner: 'partner', note: partner, unread: false };
  return null;
}
