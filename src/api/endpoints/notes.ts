import type { ApiClient } from '../client';
import {
  noteBoardSchema,
  noteReadSchema,
  noteSchema,
  type Note,
  type NoteBoard,
  type NoteRead,
} from '../contracts/notes';
import { IDEMPOTENCY_HEADER } from '../idempotency';

/** Both people's current notes; 404 `no_relationship` when there is none. */
export function getNoteBoard(api: ApiClient, signal?: AbortSignal): Promise<NoteBoard> {
  return api.request('relationships/current/notes', { schema: noteBoardSchema, signal });
}

/**
 * Saves your note as a new version. `idempotencyKey` names this save: pass the same key when
 * retrying it, and ZAPE answers with the original version instead of creating another.
 */
export function saveNote(api: ApiClient, text: string, idempotencyKey: string): Promise<Note> {
  return api.request('me/note', {
    method: 'PUT',
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
    body: { text },
    schema: noteSchema,
  });
}

/**
 * Tells ZAPE you read this version of your partner's note. Repeating it is harmless; 409
 * `note_version_changed` means the note was replaced and the new version is still unread.
 */
export function markNoteRead(api: ApiClient, noteId: string): Promise<NoteRead> {
  return api.request(`relationships/current/notes/${encodeURIComponent(noteId)}/read`, {
    method: 'POST',
    schema: noteReadSchema,
  });
}
