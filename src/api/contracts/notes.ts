import { z } from 'zod';
import { countGraphemes } from '@/localization/graphemes';

/** A note is at most this many grapheme clusters, so an emoji counts as one character. */
export const NOTE_MAX_GRAPHEMES = 120;
/**
 * ZAPE's storage bound, checked before it counts. No 120-character note of letters and emoji
 * comes near it; only stacked combining marks do.
 */
export const NOTE_MAX_CODE_UNITS = 2048;

/** Whether a draft may be saved: non-empty once trimmed, and within both limits. */
export function isValidNoteText(draft: string): boolean {
  const text = draft.trim();
  return (
    text.length > 0 &&
    text.length <= NOTE_MAX_CODE_UNITS &&
    countGraphemes(text) <= NOTE_MAX_GRAPHEMES
  );
}

/**
 * One person's current note. `id` is opaque and changes on every save; `seenAt` is when the
 * other person first read this version, so a replacement always starts unread.
 */
export const noteSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  updatedAt: z.iso.datetime(),
  /** True when this save replaced an earlier note. */
  edited: z.boolean(),
  seenAt: z.iso.datetime().nullable(),
});
export type Note = z.infer<typeof noteSchema>;

/** `GET /relationships/current/notes`. Fetching it marks nothing read. */
export const noteBoardSchema = z.object({
  you: noteSchema.nullable(),
  partner: noteSchema.nullable(),
});
export type NoteBoard = z.infer<typeof noteBoardSchema>;

/** `PUT /me/note`. ZAPE trims the text and is the final authority on its length. */
export const saveNoteSchema = z.object({
  text: z.string().trim().refine(isValidNoteText, `A note is 1–${NOTE_MAX_GRAPHEMES} characters`),
});
export type SaveNote = z.infer<typeof saveNoteSchema>;

/** `POST /relationships/current/notes/{noteId}/read`: the receipt for that version. */
export const noteReadSchema = z.object({
  id: z.string().min(1),
  seenAt: z.iso.datetime(),
});
export type NoteRead = z.infer<typeof noteReadSchema>;

/**
 * `code` on a 409 from a read: the author replaced the note after this phone saw it. The
 * replacement stays unread; refetch the board.
 */
export const NOTE_VERSION_CHANGED = 'note_version_changed';

/**
 * `code` values on note errors:
 * - `note_empty` / `note_too_long` (400)
 * - `note_not_found` (404): no partner note with that id
 * - `note_version_changed` (409)
 * - `idempotency_key_required` (400) / `idempotency_key_reused` (422)
 */
export const NOTE_ERROR_CODES = [
  'note_empty',
  'note_too_long',
  'note_not_found',
  NOTE_VERSION_CHANGED,
  'idempotency_key_required',
  'idempotency_key_reused',
] as const;
export type NoteErrorCode = (typeof NOTE_ERROR_CODES)[number];
