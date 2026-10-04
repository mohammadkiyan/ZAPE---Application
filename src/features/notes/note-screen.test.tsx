import { act, fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import type { Note, NoteBoard } from '@/api/contracts/notes';
import * as notesEndpoints from '@/api/endpoints/notes';
import { createQueryClient } from '@/api/query-client';
import { resetServerClock } from '@/api/server-clock';
import { sessionStore } from '@/features/auth/session-store';
import { RELATIONSHIP_QUERY_KEY } from '@/features/relationship/use-relationship';
import { canvasRelationship } from '@/testing/relationship';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { TONES } from '@/theme/clock-themes';
import { NOTE_SAVED_MS, NoteScreen } from './note-screen';
import { READ_AFTER_VISIBLE_MS } from './use-mark-read';
import { NOTE_BOARD_QUERY_KEY } from './use-note-board';

// 16:25 in Tehran on 2026-10-03, the relationship's zone.
const NOW = Date.parse('2026-10-03T12:55:00.000Z');
const HEART = '❤️';

const YOURS: Note = {
  id: 'nv_yours',
  text: `امروز در جلسه‌ات موفق باشی ${HEART}`,
  updatedAt: '2026-10-03T06:12:00.000Z',
  edited: false,
  seenAt: '2026-10-03T06:35:00.000Z',
};
const PARTNERS: Note = {
  id: 'nv_partner',
  text: 'به تو فکر می‌کنم.',
  updatedAt: '2026-10-03T12:43:00.000Z',
  edited: false,
  seenAt: null,
};

let client: QueryClient;
/** What ZAPE holds: the board every fetch answers with. */
let server: NoteBoard;

function TestRoot() {
  return (
    <QueryClientProvider client={client}>
      <TestProviders tone="dark">
        <Slot />
      </TestProviders>
    </QueryClientProvider>
  );
}
const routes = { _layout: TestRoot, index: NoteScreen };

/** The app's query client (online-only writes, connectivity retries) that Jest can exit from. */
function newClient(): QueryClient {
  const created = createQueryClient();
  const defaults = created.getDefaultOptions();
  created.setDefaultOptions({
    queries: { ...defaults.queries, gcTime: Infinity, retry: false },
    mutations: { ...defaults.mutations, gcTime: Infinity },
  });
  return created;
}

function renderNotes(board: NoteBoard) {
  server = board;
  client = newClient();
  client.setQueryData(RELATIONSHIP_QUERY_KEY, canvasRelationship);
  client.setQueryData(NOTE_BOARD_QUERY_KEY, board);
  return renderRouter(routes, { initialUrl: '/' });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** Lets promise chains (mutation callbacks, refetches) settle. */
async function settle() {
  for (let round = 0; round < 6; round++) await advance(0);
}

/** Reports the layout a phone would: a full-height tab with the partner's card near the top. */
function layOut({ cardTop = 150, cardHeight = 160, viewport = 844 } = {}) {
  const layout = (y: number, height: number) => ({
    nativeEvent: { layout: { x: 0, y, width: 390, height } },
  });
  fireEvent(screen.getByTestId('tab-scroll-note'), 'layout', layout(0, viewport));
  fireEvent(screen.getByTestId('note-cards'), 'layout', layout(cardTop, 520));
  fireEvent(screen.getByTestId('note-partner-frame'), 'layout', layout(0, cardHeight));
}

function scrollTo(offset: number, viewport = 844) {
  fireEvent.scroll(screen.getByTestId('tab-scroll-note'), {
    nativeEvent: {
      contentOffset: { x: 0, y: offset },
      layoutMeasurement: { width: 390, height: viewport },
      contentSize: { width: 390, height: 2000 },
    },
  });
}

let saveNote: jest.SpiedFunction<typeof notesEndpoints.saveNote>;
let markNoteRead: jest.SpiedFunction<typeof notesEndpoints.markNoteRead>;

beforeEach(async () => {
  resetServerClock();
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  sessionStore.setState({
    status: 'signed-in',
    credential: { accessToken: 'test-access', refreshToken: 'test-refresh' },
  });
  jest.spyOn(notesEndpoints, 'getNoteBoard').mockImplementation(async () => server);
  // ZAPE's side of a save: a new version that replaces yours and starts unread.
  saveNote = jest.spyOn(notesEndpoints, 'saveNote').mockImplementation(async (_api, text) => {
    const saved: Note = {
      id: `nv_saved_${saveNote.mock.calls.length}`,
      text,
      updatedAt: new Date(NOW).toISOString(),
      edited: Boolean(server.you),
      seenAt: null,
    };
    server = { ...server, you: saved };
    return saved;
  });
  // ZAPE's side of a read: the receipt for the partner's current version, or a stale refusal.
  markNoteRead = jest
    .spyOn(notesEndpoints, 'markNoteRead')
    .mockImplementation(async (_api, noteId) => {
      if (server.partner?.id !== noteId) {
        throw new ApiError('note version changed', 'http_error', 409, undefined, {
          serverCode: 'note_version_changed',
        });
      }
      const seenAt = server.partner.seenAt ?? new Date(NOW).toISOString();
      server = { ...server, partner: { ...server.partner, seenAt } };
      return { id: noteId, seenAt };
    });
  await setTestLocale('fa');
});

afterEach(() => {
  act(() => onlineManager.setOnline(true));
  jest.restoreAllMocks();
  client.clear();
});

describe('Note tab cards', () => {
  it('shows the title, the subtitle and both notes', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    expect(screen.getByText('یادداشت‌ها')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'یادداشتی کوتاه، برای یکدیگر.' })).toBeTruthy();

    const partner = within(screen.getByTestId('note-partner'));
    expect(partner.getByText('یادداشت همراه')).toBeTruthy();
    expect(partner.getByText('به تو فکر می‌کنم.')).toBeTruthy();
    // 12:43 UTC is 16:13 in the relationship's zone.
    expect(partner.getByText('امروز · ۱۶:۱۳')).toBeTruthy();
    expect(partner.getByTestId('note-new')).toHaveTextContent('جدید');

    const yours = within(screen.getByTestId('note-yours'));
    expect(yours.getByText('یادداشت شما')).toBeTruthy();
    expect(yours.getByText(`امروز در جلسه‌ات موفق باشی ${HEART}`)).toBeTruthy();
    expect(yours.getByTestId('note-yours-when')).toHaveTextContent('آخرین تغییر ۰۹:۴۲');
    expect(yours.getByTestId('note-seen')).toHaveTextContent('همراه دید · ۱۰:۰۵');
    expect(within(screen.getByTestId('note-action')).getByText('ویرایش یادداشت')).toBeTruthy();
  });

  it('drops the NEW badge once the partner’s note is read', async () => {
    renderNotes({ you: YOURS, partner: { ...PARTNERS, seenAt: '2026-10-03T12:50:00.000Z' } });
    await settle();
    expect(screen.queryByTestId('note-new')).toBeNull();
    expect(screen.getByTestId('note-partner-text')).toHaveTextContent('به تو فکر می‌کنم.');
  });

  it('shows «ویرایش شده» and no receipt after an edit, until the partner reads the new version', async () => {
    renderNotes({
      you: {
        ...YOURS,
        id: 'nv_edit',
        edited: true,
        updatedAt: '2026-10-03T12:36:00.000Z',
        seenAt: null,
      },
      partner: PARTNERS,
    });
    await settle();
    expect(screen.getByTestId('note-yours-when')).toHaveTextContent('ویرایش شده · ۱۶:۰۶');
    expect(screen.queryByTestId('note-seen')).toBeNull();
  });

  it('shows both empty states and «نوشتن یادداشت»', async () => {
    renderNotes({ you: null, partner: null });
    await settle();
    expect(
      within(screen.getByTestId('note-partner')).getByText('هنوز یادداشتی نیست.')
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('note-yours')).getByText('هنوز یادداشتی نگذاشته‌اید.')
    ).toBeTruthy();
    expect(screen.queryByTestId('note-new')).toBeNull();
    expect(screen.queryByTestId('note-seen')).toBeNull();
    expect(within(screen.getByTestId('note-action')).getByText('نوشتن یادداشت')).toBeTruthy();
  });

  it('writes «دیروز» for yesterday’s note and a date for an older one', async () => {
    renderNotes({
      // 20:29 UTC on the 2nd is 23:59 on the 2nd in Tehran: yesterday.
      you: { ...YOURS, updatedAt: '2026-10-02T20:29:00.000Z', seenAt: null },
      partner: { ...PARTNERS, updatedAt: '2026-09-28T07:00:00.000Z' },
    });
    await settle();
    expect(screen.getByTestId('note-yours-when')).toHaveTextContent('آخرین تغییر دیروز · ۲۳:۵۹');
    // 2026-09-28 is 6 Mehr 1405.
    expect(within(screen.getByTestId('note-partner')).getByText('۶ مهر')).toBeTruthy();
  });

  it('follows the locale', async () => {
    await setTestLocale('en');
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    expect(
      screen.getByRole('header', { name: 'Something small to leave for each other.' })
    ).toBeTruthy();
    const partner = within(screen.getByTestId('note-partner'));
    expect(partner.getByText('Partner’s note')).toBeTruthy();
    expect(partner.getByText('Today · 16:13')).toBeTruthy();
    expect(partner.getByTestId('note-new')).toHaveTextContent('NEW');
    expect(screen.getByTestId('note-yours-when')).toHaveTextContent('Updated 09:42');
    expect(screen.getByTestId('note-seen')).toHaveTextContent('Seen by partner · 10:05');
    expect(within(screen.getByTestId('note-action')).getByText('Edit note')).toBeTruthy();
  });
});

describe('compose sheet', () => {
  it('opens prefilled with your note, the counter and the helper', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    expect(screen.queryByTestId('note-compose')).toBeNull();
    fireEvent.press(screen.getByTestId('note-action'));

    expect(screen.getByTestId('note-input').props.value).toBe(YOURS.text);
    // 27 characters: the heart with its variation selector counts once, and so does a letter
    // with its half-space.
    expect(screen.getByTestId('note-counter')).toHaveTextContent('۲۷ / ۱۲۰');
    expect(screen.getByTestId('note-counter')).toHaveStyle({ color: TONES.dark.muted });
    expect(screen.getByText('همراهتان آن را روی گوشی و RelTime خود می‌بیند.')).toBeTruthy();
    expect(within(screen.getByTestId('note-cancel')).getByText('انصراف')).toBeTruthy();
    expect(within(screen.getByTestId('note-save')).getByText('ثبت یادداشت')).toBeTruthy();
    expect(screen.getByTestId('note-save')).not.toBeDisabled();
  });

  it('opens empty when you have no note, with Save off', async () => {
    renderNotes({ you: null, partner: PARTNERS });
    await settle();
    fireEvent.press(screen.getByTestId('note-action'));
    expect(screen.getByTestId('note-input').props.value).toBe('');
    expect(screen.getByTestId('note-counter')).toHaveTextContent('۰ / ۱۲۰');
    expect(screen.getByTestId('note-save')).toBeDisabled();
    fireEvent.changeText(screen.getByTestId('note-input'), '   ');
    expect(screen.getByTestId('note-save')).toBeDisabled();
  });

  it('allows exactly 120 with an emoji and turns Save off at 121', async () => {
    renderNotes({ you: null, partner: null });
    await settle();
    fireEvent.press(screen.getByTestId('note-action'));
    fireEvent.changeText(screen.getByTestId('note-input'), 'ب'.repeat(119) + HEART);
    expect(screen.getByTestId('note-counter')).toHaveTextContent('۱۲۰ / ۱۲۰');
    expect(screen.getByTestId('note-save')).not.toBeDisabled();

    fireEvent.changeText(screen.getByTestId('note-input'), 'ب'.repeat(120) + HEART);
    expect(screen.getByTestId('note-counter')).toHaveTextContent('۱۲۱ / ۱۲۰');
    // Emphasized in the tone's own ink, never burgundy text on the dark tone.
    expect(screen.getByTestId('note-counter')).toHaveStyle({ color: TONES.dark.fg });
    expect(screen.getByTestId('note-input')).toHaveStyle({ borderColor: TONES.dark.fg });
    expect(screen.getByTestId('note-save')).toBeDisabled();
    fireEvent.press(screen.getByTestId('note-save'));
    expect(saveNote).not.toHaveBeenCalled();
  });

  it('saves: the sheet closes, the toast shows briefly and the note is replaced', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    fireEvent.press(screen.getByTestId('note-action'));
    fireEvent.changeText(screen.getByTestId('note-input'), '  امروز خیلی بهت فکر کردم.  ');
    fireEvent.press(screen.getByTestId('note-save'));
    await settle();

    expect(saveNote).toHaveBeenCalledTimes(1);
    expect(saveNote.mock.calls[0]![1]).toBe('امروز خیلی بهت فکر کردم.');
    expect(saveNote.mock.calls[0]![2]).toEqual(expect.stringMatching(/^[A-Za-z0-9._:-]{8,128}$/));
    expect(screen.queryByTestId('note-compose')).toBeNull();
    expect(screen.getByTestId('note-saved')).toHaveTextContent('یادداشت شما ثبت شد');

    // The older note is gone; the new version is an edit, with no receipt yet.
    expect(screen.getByTestId('note-yours-text')).toHaveTextContent('امروز خیلی بهت فکر کردم.');
    expect(screen.queryByText(YOURS.text)).toBeNull();
    expect(screen.getByTestId('note-yours-when')).toHaveTextContent('ویرایش شده · ۱۶:۲۵');
    expect(screen.queryByTestId('note-seen')).toBeNull();

    await advance(NOTE_SAVED_MS - 100);
    expect(screen.getByTestId('note-saved')).toBeTruthy();
    await advance(200);
    expect(screen.queryByTestId('note-saved')).toBeNull();
  });

  it('discards the draft on Cancel', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    fireEvent.press(screen.getByTestId('note-action'));
    fireEvent.changeText(screen.getByTestId('note-input'), 'never mind');
    fireEvent.press(screen.getByTestId('note-cancel'));
    await settle();
    expect(screen.queryByTestId('note-compose')).toBeNull();
    expect(saveNote).not.toHaveBeenCalled();
    expect(screen.getByTestId('note-yours-text')).toHaveTextContent(YOURS.text);

    fireEvent.press(screen.getByTestId('note-action'));
    expect(screen.getByTestId('note-input').props.value).toBe(YOURS.text);
  });

  it('keeps the sheet and the draft when the save fails, and retries the same save', async () => {
    saveNote.mockRejectedValueOnce(new ApiError('Request failed (500)', 'http_error', 500));
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    fireEvent.press(screen.getByTestId('note-action'));
    fireEvent.changeText(screen.getByTestId('note-input'), 'شام با من');
    fireEvent.press(screen.getByTestId('note-save'));
    await settle();

    expect(screen.getByTestId('note-compose')).toBeTruthy();
    expect(screen.getByTestId('note-input').props.value).toBe('شام با من');
    expect(screen.getByTestId('note-compose-error')).toHaveTextContent(
      'مشکلی پیش آمد. کمی بعد دوباره تلاش کنید.'
    );
    expect(screen.queryByTestId('note-saved')).toBeNull();
    // Behind the sheet the board is back to the note ZAPE holds.
    expect(client.getQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY)?.you).toEqual(YOURS);

    // Trying again sends the same save: the same text under the same key.
    fireEvent.press(screen.getByTestId('note-save'));
    await settle();
    expect(saveNote).toHaveBeenCalledTimes(2);
    expect(saveNote.mock.calls[1]![2]).toBe(saveNote.mock.calls[0]![2]);
    expect(screen.queryByTestId('note-compose')).toBeNull();
    expect(screen.getByTestId('note-yours-text')).toHaveTextContent('شام با من');
  });

  it('uses a new key once the text changes after a failed save', async () => {
    saveNote.mockRejectedValueOnce(new ApiError('Request failed (500)', 'http_error', 500));
    renderNotes({ you: null, partner: null });
    await settle();
    fireEvent.press(screen.getByTestId('note-action'));
    fireEvent.changeText(screen.getByTestId('note-input'), 'first words');
    fireEvent.press(screen.getByTestId('note-save'));
    await settle();
    fireEvent.changeText(screen.getByTestId('note-input'), 'other words');
    fireEvent.press(screen.getByTestId('note-save'));
    await settle();
    expect(saveNote).toHaveBeenCalledTimes(2);
    expect(saveNote.mock.calls[1]![2]).not.toBe(saveNote.mock.calls[0]![2]);
  });
});

describe('read tracking', () => {
  it('marks the partner’s note read after 1.5 s on screen and clears the badge', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    layOut();
    await advance(READ_AFTER_VISIBLE_MS - 100);
    expect(markNoteRead).not.toHaveBeenCalled();
    expect(screen.getByTestId('note-new')).toBeTruthy();

    await advance(200);
    await settle();
    expect(markNoteRead).toHaveBeenCalledTimes(1);
    expect(markNoteRead.mock.calls[0]![1]).toBe('nv_partner');
    expect(screen.queryByTestId('note-new')).toBeNull();
    expect(client.getQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY)?.partner?.seenAt).toBe(
      new Date(NOW).toISOString()
    );
    // Once is enough: staying on the tab sends nothing more.
    await advance(10_000);
    expect(markNoteRead).toHaveBeenCalledTimes(1);
  });

  it('does not count a card that is not on screen', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    // Not laid out yet: nothing is known to be visible.
    await advance(5000);
    expect(markNoteRead).not.toHaveBeenCalled();

    // Laid out, but scrolled well past the card.
    layOut();
    scrollTo(600);
    await advance(5000);
    expect(markNoteRead).not.toHaveBeenCalled();
    expect(screen.getByTestId('note-new')).toBeTruthy();
  });

  it('needs the 1.5 s to be continuous', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    layOut();
    await advance(1000);
    scrollTo(600);
    await advance(1000);
    scrollTo(0);
    await advance(1000);
    expect(markNoteRead).not.toHaveBeenCalled();
    await advance(600);
    await settle();
    expect(markNoteRead).toHaveBeenCalledTimes(1);
  });

  it('does not count while the compose sheet covers the card', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    layOut();
    fireEvent.press(screen.getByTestId('note-action'));
    await advance(5000);
    expect(markNoteRead).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('note-cancel'));
    await advance(READ_AFTER_VISIBLE_MS + 100);
    await settle();
    expect(markNoteRead).toHaveBeenCalledTimes(1);
  });

  it('has nothing to mark for a note that is already read, or when there is none', async () => {
    const view = renderNotes({
      you: YOURS,
      partner: { ...PARTNERS, seenAt: '2026-10-03T12:50:00.000Z' },
    });
    await settle();
    layOut();
    await advance(5000);
    view.unmount();
    client.clear();
    renderNotes({ you: YOURS, partner: null });
    await settle();
    layOut();
    await advance(5000);
    expect(markNoteRead).not.toHaveBeenCalled();
  });
});

describe('notes and connectivity', () => {
  it('disables writing offline with the reconnect message', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    act(() => onlineManager.setOnline(false));
    expect(screen.getByTestId('note-action')).toBeDisabled();
    expect(screen.getByTestId('note-offline')).toHaveTextContent(
      'برای ویرایش یادداشت، دوباره به اینترنت متصل شوید.'
    );
    fireEvent.press(screen.getByTestId('note-action'));
    expect(screen.queryByTestId('note-compose')).toBeNull();
    // Both notes stay readable from the last sync.
    expect(screen.getByTestId('note-partner-text')).toHaveTextContent('به تو فکر می‌کنم.');

    act(() => onlineManager.setOnline(true));
    await settle();
    expect(screen.getByTestId('note-action')).not.toBeDisabled();
    expect(screen.queryByTestId('note-offline')).toBeNull();

    await setTestLocale('en');
    act(() => onlineManager.setOnline(false));
    expect(screen.getByTestId('note-offline')).toHaveTextContent('Reconnect to edit your note.');
  });

  it('clears the badge offline and sends the read receipt on reconnect', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    act(() => onlineManager.setOnline(false));
    layOut();
    await advance(READ_AFTER_VISIBLE_MS + 100);
    await settle();
    // Read locally; nothing can be sent yet.
    expect(screen.queryByTestId('note-new')).toBeNull();
    expect(markNoteRead).not.toHaveBeenCalled();
    await advance(60_000);
    expect(markNoteRead).not.toHaveBeenCalled();

    act(() => onlineManager.setOnline(true));
    await settle();
    expect(markNoteRead).toHaveBeenCalledTimes(1);
    expect(markNoteRead.mock.calls[0]![1]).toBe('nv_partner');
    expect(server.partner?.seenAt).toBe(new Date(NOW).toISOString());
    expect(screen.queryByTestId('note-new')).toBeNull();
  });

  it('leaves a replacement unread when a queued read for the old version arrives late', async () => {
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    act(() => onlineManager.setOnline(false));
    layOut();
    await advance(READ_AFTER_VISIBLE_MS + 100);
    await settle();
    expect(screen.queryByTestId('note-new')).toBeNull();

    // While this phone was offline the partner replaced the note.
    const replacement: Note = {
      id: 'nv_partner_2',
      text: 'شام با من 🍝',
      updatedAt: '2026-10-03T12:54:00.000Z',
      edited: true,
      seenAt: null,
    };
    server = { ...server, partner: replacement };

    act(() => onlineManager.setOnline(true));
    await settle();
    // The old receipt was refused, the board was refetched, and the new note is unread.
    expect(markNoteRead).toHaveBeenCalledTimes(1);
    expect(markNoteRead.mock.calls[0]![1]).toBe('nv_partner');
    expect(server.partner).toEqual(replacement);
    expect(screen.getByTestId('note-partner-text')).toHaveTextContent('شام با من 🍝');
    expect(screen.getByTestId('note-new')).toBeTruthy();
    expect(client.getQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY)?.partner?.seenAt).toBeNull();

    // Only looking at the new version for 1.5 s reads it.
    await advance(READ_AFTER_VISIBLE_MS + 100);
    await settle();
    expect(markNoteRead).toHaveBeenCalledTimes(2);
    expect(markNoteRead.mock.calls[1]![1]).toBe('nv_partner_2');
    expect(screen.queryByTestId('note-new')).toBeNull();
  });

  it('puts the badge back when a receipt fails for another reason', async () => {
    markNoteRead.mockRejectedValueOnce(new ApiError('Request failed (500)', 'http_error', 500));
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    layOut();
    await advance(READ_AFTER_VISIBLE_MS + 100);
    await settle();
    expect(markNoteRead).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('note-new')).toBeTruthy();
    // It is not re-sent in a loop from the same visit.
    await advance(10_000);
    expect(markNoteRead).toHaveBeenCalledTimes(1);
  });

  it('shows "Waiting to sync" when the connection drops mid-save and retries with the same key', async () => {
    saveNote.mockRejectedValueOnce(new ApiError('Network request failed', 'network_error'));
    renderNotes({ you: YOURS, partner: PARTNERS });
    await settle();
    fireEvent.press(screen.getByTestId('note-action'));
    fireEvent.changeText(screen.getByTestId('note-input'), 'در راهم');
    fireEvent.press(screen.getByTestId('note-save'));
    await settle();
    expect(saveNote).toHaveBeenCalledTimes(1);

    act(() => onlineManager.setOnline(false));
    // The retry comes due, finds the phone offline and pauses; then the screen hears of it.
    await advance(5000);
    await settle();
    // The sheet steps aside; the note waits on the card.
    expect(screen.queryByTestId('note-compose')).toBeNull();
    expect(screen.getByTestId('note-yours-text')).toHaveTextContent('در راهم');
    expect(screen.getByTestId('note-yours-when')).toHaveTextContent('در انتظار همگام‌سازی');

    act(() => onlineManager.setOnline(true));
    await settle();
    expect(saveNote).toHaveBeenCalledTimes(2);
    expect(saveNote.mock.calls[1]![2]).toBe(saveNote.mock.calls[0]![2]);
    expect(screen.getByTestId('note-yours-when')).toHaveTextContent('ویرایش شده · ۱۶:۲۵');
    expect(screen.getByTestId('note-saved')).toBeTruthy();
  });
});
