import { countGraphemes } from '@/localization/graphemes';
import {
  NOTE_MAX_CODE_UNITS,
  NOTE_MAX_GRAPHEMES,
  NOTE_VERSION_CHANGED,
  noteBoardSchema,
  noteReadSchema,
  noteSchema,
  type Note,
} from '../../contracts/notes';
import { registerPartnerControl } from '../partner-controls';
import { MockHttpError, registerMockRoute } from '../router';
import type { MockState } from '../state';
import { MOCK_CANVAS_RELATIONSHIP_ID, authorize } from './auth';
import { boardContext, canvasCouple, mutationKey, partnerContext } from './boards';

interface MockNoteVersion {
  /** Opaque, and new on every save. */
  id: string;
  relationshipId: string;
  accountId: string;
  text: string;
  updatedAt: string;
  edited: boolean;
  /** When the other person first read this version. */
  seenAt: string | null;
  /** True once the author saved a replacement; kept so a stale read can be told apart. */
  superseded: boolean;
  /** The save's `Idempotency-Key`; absent on seeded and partner-control notes. */
  key?: string;
}

export interface MockNotesSlice {
  versions: MockNoteVersion[];
}

const MINUTE = 60_000;

function noteId(): string {
  const part = () => Math.random().toString(36).slice(2, 13).padEnd(11, '0');
  return `nv_${part()}${part()}`;
}

/** The notes slice, seeded with the canvas notes: yours seen this morning, the partner's new. */
export function mockNotes(state: MockState): MockNotesSlice {
  if (!state.notes) {
    const slice: MockNotesSlice = { versions: [] };
    const couple = canvasCouple(state);
    if (couple) {
      const [you, partner] = couple;
      const now = Date.now();
      slice.versions.push(
        {
          id: noteId(),
          relationshipId: MOCK_CANVAS_RELATIONSHIP_ID,
          accountId: you,
          text: 'امروز در جلسه‌ات موفق باشی ❤️',
          updatedAt: new Date(now - 403 * MINUTE).toISOString(),
          edited: false,
          seenAt: new Date(now - 380 * MINUTE).toISOString(),
          superseded: false,
        },
        {
          id: noteId(),
          relationshipId: MOCK_CANVAS_RELATIONSHIP_ID,
          accountId: partner,
          text: 'به تو فکر می‌کنم.',
          updatedAt: new Date(now - 12 * MINUTE).toISOString(),
          edited: false,
          seenAt: null,
          superseded: false,
        }
      );
    }
    state.notes = slice;
  }
  return state.notes as MockNotesSlice;
}

function currentNote(
  versions: MockNoteVersion[],
  relationshipId: string,
  accountId: string | undefined
): MockNoteVersion | undefined {
  return versions.find(
    (version) =>
      version.relationshipId === relationshipId &&
      version.accountId === accountId &&
      !version.superseded
  );
}

function toNote(version: MockNoteVersion): Note {
  return noteSchema.parse({
    id: version.id,
    text: version.text,
    updatedAt: version.updatedAt,
    edited: version.edited,
    seenAt: version.seenAt,
  });
}

/** Replaces `accountId`'s current note with a new version, which starts unread. */
function saveVersion(
  versions: MockNoteVersion[],
  relationshipId: string,
  accountId: string,
  text: string,
  key?: string
): MockNoteVersion {
  const replaced = currentNote(versions, relationshipId, accountId);
  if (replaced) replaced.superseded = true;
  const version: MockNoteVersion = {
    id: noteId(),
    relationshipId,
    accountId,
    text,
    updatedAt: new Date().toISOString(),
    edited: Boolean(replaced),
    seenAt: null,
    superseded: false,
    key,
  };
  versions.push(version);
  return version;
}

registerMockRoute('GET /relationships/current/notes', (request, state) => {
  const { relationship, youId, partnerId } = boardContext(request, state);
  const { versions } = mockNotes(state);
  const you = currentNote(versions, relationship.id, youId);
  const partner = currentNote(versions, relationship.id, partnerId);
  // Fetching the board reads nothing: `seenAt` only changes through the read route.
  return {
    body: noteBoardSchema.parse({
      you: you ? toNote(you) : null,
      partner: partner ? toNote(partner) : null,
    }),
  };
});

registerMockRoute('PUT /me/note', (request, state) => {
  // ZAPE's order: the session, the key, the text, then the relationship.
  authorize(request, state);
  const key = mutationKey(request);
  const raw = (request.body as { text?: unknown } | undefined)?.text;
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) throw new MockHttpError(400, 'note empty', 'note_empty');
  if (text.length > NOTE_MAX_CODE_UNITS || countGraphemes(text) > NOTE_MAX_GRAPHEMES) {
    throw new MockHttpError(400, 'note too long', 'note_too_long');
  }
  const { relationship, youId } = boardContext(request, state);
  const { versions } = mockNotes(state);
  const earlier = versions.find(
    (version) =>
      version.relationshipId === relationship.id &&
      version.accountId === youId &&
      version.key === key
  );
  if (earlier) {
    if (earlier.text !== text) {
      throw new MockHttpError(422, 'idempotency key reused', 'idempotency_key_reused');
    }
    // A retry of the same save: the original version, and no second one.
    return { body: toNote(earlier) };
  }
  return { body: toNote(saveVersion(versions, relationship.id, youId, text, key)) };
});

registerMockRoute('POST /relationships/current/notes/:noteId/read', (request, state) => {
  const { relationship, partnerId } = boardContext(request, state);
  const version = mockNotes(state).versions.find(
    (candidate) =>
      candidate.id === request.params.noteId && candidate.relationshipId === relationship.id
  );
  // Only the partner's note can be read: not your own, and not another relationship's.
  if (!version || !partnerId || version.accountId !== partnerId) {
    throw new MockHttpError(404, 'note not found', 'note_not_found');
  }
  if (version.superseded) {
    throw new MockHttpError(409, 'note version changed', NOTE_VERSION_CHANGED);
  }
  // The first read fixes the time; a repeat returns it.
  version.seenAt ??= new Date().toISOString();
  return { body: noteReadSchema.parse({ id: version.id, seenAt: version.seenAt }) };
});

const PARTNER_NOTES = ['دلم برات تنگ شده.', 'شام با من 🍝', 'امروز زود برمی‌گردم.'];

registerPartnerControl({
  id: 'notes.partner-leaves',
  label: { fa: 'همراه یادداشتی می‌گذارد', en: 'Partner leaves a note' },
  run(state) {
    const context = partnerContext(state);
    if (!context) return;
    const { versions } = mockNotes(state);
    const current = currentNote(versions, context.relationship.id, context.partnerId)?.text;
    // The next line in rotation, so every run is a visibly new note.
    const text = PARTNER_NOTES[(PARTNER_NOTES.indexOf(current ?? '') + 1) % PARTNER_NOTES.length]!;
    saveVersion(versions, context.relationship.id, context.partnerId, text);
  },
});

registerPartnerControl({
  id: 'notes.partner-reads',
  label: { fa: 'همراه یادداشت مرا می‌خواند', en: 'Partner reads my note' },
  run(state) {
    const context = partnerContext(state);
    if (!context) return;
    const mine = currentNote(mockNotes(state).versions, context.relationship.id, context.youId);
    if (mine) mine.seenAt ??= new Date().toISOString();
  },
});
