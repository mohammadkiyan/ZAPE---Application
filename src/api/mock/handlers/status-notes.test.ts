import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, createApiClient, type ApiClient } from '../../client';
import contract from '../../contracts/fixtures/zape-status-notes.contract.json';
import { noteBoardSchema, noteReadSchema, noteSchema } from '../../contracts/notes';
import { statusBoardSchema, statusSchema } from '../../contracts/status';
import { requestOtp, verifyOtp } from '../../endpoints/auth';
import { getNoteBoard, markNoteRead, saveNote } from '../../endpoints/notes';
import { acceptInvite, createRelationship, endRelationship } from '../../endpoints/relationship';
import { getStatusBoard, setStatus } from '../../endpoints/status';
import { listPartnerControls, runPartnerControl } from '../partner-controls';
import { createMockFetcher } from '../router';
import { createMockStore, type MockStore } from '../state';
import { mockStore } from '..';
import { MOCK_OTP_CODE, MOCK_SEED_PHONE } from './auth';
import { MOCK_PARTNER_PHONE } from './relationship';

const BASE = 'https://mock.zape.invalid/';
const START = { date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' };
const KEY_1 = '3f0c6c1e-8c0b-4d6b-9a55-0e9a9a4d7d21';
const KEY_2 = '9b1e2a44-0a6f-4f6e-8a55-5a0f2f3f4c11';
const HEART = '❤️';

function client(store: MockStore, accessToken?: string): ApiClient {
  return createApiClient({
    baseUrl: BASE,
    fetcher: createMockFetcher({ baseUrl: BASE, store }),
    getAuthorization: () => (accessToken ? `Bearer ${accessToken}` : null),
  });
}

async function signIn(store: MockStore, phoneNumber: string): Promise<ApiClient> {
  const { flowId } = await requestOtp(client(store), { phoneNumber });
  const { session } = await verifyOtp(client(store), { flowId, code: MOCK_OTP_CODE });
  return client(store, session.accessToken);
}

/** A new couple with empty boards: the creator and the partner who accepted the invite. */
async function couple(store: MockStore): Promise<[ApiClient, ApiClient]> {
  const you = await signIn(store, '+989351230001');
  const partner = await signIn(store, '+989351230002');
  const created = await createRelationship(you, { start: START, calendar: 'jalali' });
  await acceptInvite(partner, created.invite!.code);
  return [you, partner];
}

async function failure(
  promise: Promise<unknown>
): Promise<[number | undefined, string | undefined]> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return [(error as ApiError).status, (error as ApiError).serverCode];
}

/** Moves the mock's clock: every server timestamp it writes comes from `Date.now()`. */
function at(iso: string) {
  jest.setSystemTime(new Date(iso));
}

describe('mock status backend', () => {
  let store: MockStore;
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'setImmediate', 'nextTick', 'queueMicrotask'] });
    at('2026-10-03T12:00:00.000Z');
    store = createMockStore();
  });
  afterEach(() => jest.useRealTimers());

  it('gives both members one board, each from their own side, with server timestamps', async () => {
    const [you, partner] = await couple(store);
    expect(await getStatusBoard(you)).toEqual({ you: null, partner: null, today: [] });

    at('2026-10-03T12:23:00.000Z');
    await setStatus(partner, 'calm', KEY_1);
    at('2026-10-03T12:45:00.000Z');
    expect(await setStatus(you, 'happy', KEY_2)).toEqual({
      mood: 'happy',
      at: '2026-10-03T12:45:00.000Z',
    });

    const mine = await getStatusBoard(you);
    expect(mine).toEqual({
      you: { mood: 'happy', at: '2026-10-03T12:45:00.000Z' },
      partner: { mood: 'calm', at: '2026-10-03T12:23:00.000Z' },
      today: [
        { owner: 'you', mood: 'happy', at: '2026-10-03T12:45:00.000Z' },
        { owner: 'partner', mood: 'calm', at: '2026-10-03T12:23:00.000Z' },
      ],
    });
    const theirs = await getStatusBoard(partner);
    expect(theirs.you).toEqual(mine.partner);
    expect(theirs.partner).toEqual(mine.you);
    expect(theirs.today.map((event) => event.owner)).toEqual(['partner', 'you']);
  });

  it('answers a retried save with the first result and one history event', async () => {
    const [you] = await couple(store);
    const first = await setStatus(you, 'tired', KEY_1);
    // The response was lost; the same save is sent again a minute later.
    at('2026-10-03T12:01:00.000Z');
    expect(await setStatus(you, 'tired', KEY_1)).toEqual(first);
    const board = await getStatusBoard(you);
    expect(board.today).toHaveLength(1);
    expect(board.you).toEqual({ mood: 'tired', at: '2026-10-03T12:00:00.000Z' });
  });

  it('refuses a key reused for a different mood, and a save without a key', async () => {
    const [you] = await couple(store);
    await setStatus(you, 'tired', KEY_1);
    expect(await failure(setStatus(you, 'happy', KEY_1))).toEqual([422, 'idempotency_key_reused']);
    expect(await failure(setStatus(you, 'happy', ''))).toEqual([400, 'idempotency_key_required']);
    expect(
      await failure(you.request('me/status', { method: 'PUT', body: { mood: 'happy' } }))
    ).toEqual([400, 'idempotency_key_required']);
    expect((await getStatusBoard(you)).today).toHaveLength(1);
  });

  it('refuses a mood outside the catalog and ignores an owner or time in the body', async () => {
    const [you, partner] = await couple(store);
    const put = (body: unknown, key: string) =>
      you.request('me/status', { method: 'PUT', headers: { 'Idempotency-Key': key }, body });
    expect(await failure(put({ mood: 'angry' }, KEY_1))).toEqual([400, 'invalid_mood']);
    expect(await failure(put({}, KEY_1))).toEqual([400, 'invalid_mood']);

    await put({ mood: 'loved', owner: 'partner', at: '2020-01-01T00:00:00.000Z' }, KEY_2);
    const board = await getStatusBoard(partner);
    expect(board.partner).toEqual({ mood: 'loved', at: '2026-10-03T12:00:00.000Z' });
    expect(board.you).toBeNull();
  });

  it("empties today at midnight in the relationship's zone and keeps the statuses", async () => {
    const [you, partner] = await couple(store);
    // 23:50 in Tehran.
    at('2026-10-03T20:20:00.000Z');
    await setStatus(you, 'tired', KEY_1);
    expect((await getStatusBoard(partner)).today).toHaveLength(1);
    // 00:10 the next day in Tehran; still the 3rd in UTC.
    at('2026-10-03T20:40:00.000Z');
    expect(await getStatusBoard(partner)).toEqual({
      you: null,
      partner: { mood: 'tired', at: '2026-10-03T20:20:00.000Z' },
      today: [],
    });
  });

  it('closes the board once the relationship ends, and a new one starts empty', async () => {
    const [you, partner] = await couple(store);
    await setStatus(you, 'happy', KEY_1);
    await endRelationship(partner);
    for (const member of [you, partner]) {
      expect(await failure(getStatusBoard(member))).toEqual([404, 'no_relationship']);
      expect(await failure(setStatus(member, 'sad', KEY_2))).toEqual([404, 'no_relationship']);
    }
    await createRelationship(you, { start: START, calendar: 'jalali' });
    expect(await getStatusBoard(you)).toEqual({ you: null, partner: null, today: [] });
  });

  it('requires a session', async () => {
    expect(await failure(getStatusBoard(client(store)))).toEqual([401, 'unauthorised']);
    expect(await failure(setStatus(client(store), 'calm', KEY_1))).toEqual([401, 'unauthorised']);
  });

  it('seeds the canvas couple: «شاد» ten minutes ago and «آرام» before it', async () => {
    const you = await signIn(store, MOCK_SEED_PHONE);
    const board = await getStatusBoard(you);
    expect(board.you).toEqual({ mood: 'happy', at: '2026-10-03T11:50:00.000Z' });
    expect(board.partner).toEqual({ mood: 'calm', at: '2026-10-03T11:28:00.000Z' });
    expect(board.today[0]).toEqual({ owner: 'you', mood: 'happy', at: '2026-10-03T11:50:00.000Z' });
    expect(board.today.length).toBeGreaterThan(2);
    // The partner sees the same day from the other side.
    const partner = await signIn(store, MOCK_PARTNER_PHONE);
    expect((await getStatusBoard(partner)).you).toEqual(board.partner);
  });
});

describe('mock notes backend', () => {
  let store: MockStore;
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'setImmediate', 'nextTick', 'queueMicrotask'] });
    at('2026-10-03T12:00:00.000Z');
    store = createMockStore();
  });
  afterEach(() => jest.useRealTimers());

  it('shows each member their own note and their partner’s', async () => {
    const [you, partner] = await couple(store);
    expect(await getNoteBoard(you)).toEqual({ you: null, partner: null });
    const saved = await saveNote(you, `  امروز در جلسه‌ات موفق باشی ${HEART} `, KEY_1);
    expect(saved).toEqual({
      id: expect.stringMatching(/^nv_/),
      text: `امروز در جلسه‌ات موفق باشی ${HEART}`,
      updatedAt: '2026-10-03T12:00:00.000Z',
      edited: false,
      seenAt: null,
    });
    expect(await getNoteBoard(you)).toEqual({ you: saved, partner: null });
    expect(await getNoteBoard(partner)).toEqual({ you: null, partner: saved });
  });

  it('gives every save a new id and resets seenAt', async () => {
    const [you, partner] = await couple(store);
    const first = await saveNote(you, 'first', KEY_1);
    at('2026-10-03T12:05:00.000Z');
    expect(await markNoteRead(partner, first.id)).toEqual({
      id: first.id,
      seenAt: '2026-10-03T12:05:00.000Z',
    });
    expect((await getNoteBoard(you)).you?.seenAt).toBe('2026-10-03T12:05:00.000Z');

    at('2026-10-03T12:30:00.000Z');
    const second = await saveNote(you, 'به تو فکر می‌کنم.', KEY_2);
    expect(second.id).not.toBe(first.id);
    expect(second).toMatchObject({ edited: true, seenAt: null });
    // Neither phone is shown the older note again.
    expect(await getNoteBoard(you)).toEqual({ you: second, partner: null });
    expect(await getNoteBoard(partner)).toEqual({ you: null, partner: second });
  });

  it('answers a retried save with the original version', async () => {
    const [you, partner] = await couple(store);
    const first = await saveNote(you, 'به تو فکر می‌کنم.', KEY_1);
    at('2026-10-03T12:02:00.000Z');
    expect(await saveNote(you, 'به تو فکر می‌کنم.', KEY_1)).toEqual(first);
    expect((await getNoteBoard(partner)).partner).toEqual(first);
    expect(await failure(saveNote(you, 'something else', KEY_1))).toEqual([
      422,
      'idempotency_key_reused',
    ]);
  });

  it('accepts 120 characters with an emoji and refuses 121, keeping the earlier note', async () => {
    const [you, partner] = await couple(store);
    const exactly = 'ب'.repeat(119) + HEART;
    const kept = await saveNote(you, exactly, KEY_1);
    expect(kept.text).toBe(exactly);
    expect(await failure(saveNote(you, 'ب'.repeat(120) + HEART, KEY_2))).toEqual([
      400,
      'note_too_long',
    ]);
    expect(await failure(saveNote(you, '   ', KEY_2))).toEqual([400, 'note_empty']);
    expect(await failure(saveNote(you, 'hello', 'short'))).toEqual([
      400,
      'idempotency_key_required',
    ]);
    expect((await getNoteBoard(partner)).partner).toEqual(kept);
  });

  it('does not mark a note read when the board is only fetched', async () => {
    const [you, partner] = await couple(store);
    await saveNote(you, 'unread until opened', KEY_1);
    await getNoteBoard(partner);
    await getNoteBoard(partner);
    expect((await getNoteBoard(partner)).partner?.seenAt).toBeNull();
  });

  it('fixes seenAt at the first read; only the recipient can mark it', async () => {
    const [you, partner] = await couple(store);
    const note = await saveNote(you, 'for you', KEY_1);
    expect(await failure(markNoteRead(you, note.id))).toEqual([404, 'note_not_found']);
    expect(await failure(markNoteRead(partner, 'nv_unknown'))).toEqual([404, 'note_not_found']);

    at('2026-10-03T13:07:02.000Z');
    const read = await markNoteRead(partner, note.id);
    at('2026-10-03T14:00:00.000Z');
    expect(await markNoteRead(partner, note.id)).toEqual(read);
    expect(read.seenAt).toBe('2026-10-03T13:07:02.000Z');
  });

  it('refuses a read for a replaced version and leaves the new note unread', async () => {
    const [you, partner] = await couple(store);
    const old = await saveNote(you, 'first', KEY_1);
    // The partner saw it offline; the receipt is still queued when the author edits.
    const replacement = await saveNote(you, 'edited', KEY_2);
    expect(await failure(markNoteRead(partner, old.id))).toEqual([409, 'note_version_changed']);
    expect((await getNoteBoard(partner)).partner).toEqual(replacement);
    expect(replacement.seenAt).toBeNull();
  });

  it('closes the board once the relationship ends', async () => {
    const [you, partner] = await couple(store);
    const note = await saveNote(you, 'private words', KEY_1);
    await endRelationship(you);
    for (const member of [you, partner]) {
      expect(await failure(getNoteBoard(member))).toEqual([404, 'no_relationship']);
      expect(await failure(saveNote(member, 'still here?', KEY_2))).toEqual([
        404,
        'no_relationship',
      ]);
      expect(await failure(markNoteRead(member, note.id))).toEqual([404, 'no_relationship']);
    }
  });

  it('seeds the canvas notes: yours seen, the partner’s new', async () => {
    const you = await signIn(store, MOCK_SEED_PHONE);
    const board = await getNoteBoard(you);
    expect(board.you).toMatchObject({
      text: `امروز در جلسه‌ات موفق باشی ${HEART}`,
      edited: false,
      seenAt: expect.any(String),
    });
    expect(board.partner).toMatchObject({ text: 'به تو فکر می‌کنم.', seenAt: null });
  });
});

describe('mock responses and the ZAPE contract', () => {
  let store: MockStore;
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useRealTimers();
    store = createMockStore();
  });

  /** Runs a request through the mock transport and returns the raw JSON it answered with. */
  async function raw(
    api: ApiClient,
    path: string,
    options: Parameters<ApiClient['request']>[1] = {}
  ) {
    return api.request(path, options);
  }

  it('answers every route with a body the same schemas parse as ZAPE’s fixtures', async () => {
    const [you, partner] = await couple(store);
    const key = { 'Idempotency-Key': KEY_1 };
    const status = await raw(you, 'me/status', {
      method: 'PUT',
      headers: key,
      body: { mood: 'tired' },
    });
    const note = await raw(partner, 'me/note', {
      method: 'PUT',
      headers: key,
      body: { text: 'hi' },
    });
    const statuses = await raw(you, 'relationships/current/statuses');
    const notes = await raw(you, 'relationships/current/notes');
    const read = await raw(you, `relationships/current/notes/${(note as { id: string }).id}/read`, {
      method: 'POST',
    });

    const pairs = [
      [statusSchema, status, contract.responses.status],
      [statusBoardSchema, statuses, contract.responses.statusBoard],
      [noteSchema, note, contract.responses.note],
      [noteBoardSchema, notes, contract.responses.noteBoard],
      [noteReadSchema, read, contract.responses.noteRead],
    ] as const;
    for (const [schema, mock, zape] of pairs) {
      expect(schema.safeParse(mock).success).toBe(true);
      expect(schema.safeParse(zape).success).toBe(true);
      // Same fields on both sides: the mock adds none and omits none.
      expect(Object.keys(mock as object).sort()).toEqual(Object.keys(zape).sort());
    }
  });

  it('answers each error with the status and code in ZAPE’s table', async () => {
    const [you, partner] = await couple(store);
    const stranger = await signIn(store, '+989351230003');
    const first = await saveNote(you, 'first', KEY_1);
    await saveNote(you, 'second', KEY_2);
    const errors = contract.errors;
    const cases: Array<[keyof typeof errors, Promise<unknown>]> = [
      ['no_relationship', getStatusBoard(stranger)],
      ['invalid_mood', setStatus(you, 'angry' as never, KEY_1)],
      ['note_empty', saveNote(you, ' ', 'key-00000003')],
      ['note_too_long', saveNote(you, 'a'.repeat(121), 'key-00000004')],
      ['note_not_found', markNoteRead(partner, 'nv_unknown')],
      ['note_version_changed', markNoteRead(partner, first.id)],
      ['idempotency_key_required', saveNote(you, 'x', '')],
      ['idempotency_key_reused', saveNote(you, 'changed', KEY_1)],
    ];
    expect(cases.map(([code]) => code).sort()).toEqual(Object.keys(errors).sort());
    for (const [code, request] of cases) {
      expect(await failure(request)).toEqual([errors[code], code]);
    }
  });
});

describe('partner controls', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useRealTimers();
    await mockStore.reset();
  });

  /** The app-wide mock store, signed in as the canvas «محمد». */
  async function canvasUser(): Promise<ApiClient> {
    return signIn(mockStore, MOCK_SEED_PHONE);
  }

  it('registers the three status and note controls with both labels', () => {
    const controls = Object.fromEntries(listPartnerControls().map((c) => [c.id, c.label]));
    expect(controls['status.partner-sets']).toEqual({
      fa: 'همراه حالش را می‌گذارد',
      en: 'Partner sets a status',
    });
    expect(controls['notes.partner-leaves']).toEqual({
      fa: 'همراه یادداشتی می‌گذارد',
      en: 'Partner leaves a note',
    });
    expect(controls['notes.partner-reads']).toEqual({
      fa: 'همراه یادداشت مرا می‌خواند',
      en: 'Partner reads my note',
    });
  });

  it('"Partner sets a status" changes the partner’s status and adds a history entry', async () => {
    const you = await canvasUser();
    const before = await getStatusBoard(you);
    await runPartnerControl('status.partner-sets');
    const after = await getStatusBoard(you);
    expect(after.partner?.mood).not.toBe(before.partner?.mood);
    expect(after.today).toHaveLength(before.today.length + 1);
    expect(after.today[0]).toMatchObject({ owner: 'partner', mood: after.partner?.mood });
    expect(after.you).toEqual(before.you);
  });

  it('"Partner leaves a note" replaces their note with a new unread version', async () => {
    const you = await canvasUser();
    const before = await getNoteBoard(you);
    await markNoteRead(you, before.partner!.id);
    await runPartnerControl('notes.partner-leaves');
    const after = await getNoteBoard(you);
    expect(after.partner?.id).not.toBe(before.partner?.id);
    expect(after.partner).toMatchObject({ edited: true, seenAt: null });
    expect(after.partner?.text).not.toBe(before.partner?.text);
    // The receipt for the old version is stale now.
    expect(await failure(markNoteRead(you, before.partner!.id))).toEqual([
      409,
      'note_version_changed',
    ]);
  });

  it('"Partner reads my note" sets the seen receipt on my current note once', async () => {
    const you = await canvasUser();
    const mine = await saveNote(you, 'did you see this?', KEY_1);
    expect(mine.seenAt).toBeNull();
    await runPartnerControl('notes.partner-reads');
    const seen = (await getNoteBoard(you)).you;
    expect(seen?.id).toBe(mine.id);
    expect(seen?.seenAt).toEqual(expect.any(String));
    await runPartnerControl('notes.partner-reads');
    expect((await getNoteBoard(you)).you?.seenAt).toBe(seen?.seenAt);
  });

  it('do nothing before the partner has joined', async () => {
    const you = await signIn(mockStore, '+989351230009');
    await createRelationship(you, { start: START, calendar: 'jalali' });
    await runPartnerControl('status.partner-sets');
    await runPartnerControl('notes.partner-leaves');
    await runPartnerControl('notes.partner-reads');
    expect(await getStatusBoard(you)).toEqual({ you: null, partner: null, today: [] });
    expect(await getNoteBoard(you)).toEqual({ you: null, partner: null });
  });
});
