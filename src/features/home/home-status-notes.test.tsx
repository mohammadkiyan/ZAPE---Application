import { act, fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
import { I18nManager } from 'react-native';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import MainLayout from '@/app/(main)/_layout';
import TabsLayout from '@/app/(main)/(tabs)/_layout';
import Home from '@/app/(main)/(tabs)/index';
import RelClock from '@/app/(main)/(tabs)/clock';
import Status from '@/app/(main)/(tabs)/status';
import Note from '@/app/(main)/(tabs)/note';
import More from '@/app/(main)/(tabs)/more';
import type { Note as NoteContract, NoteBoard } from '@/api/contracts/notes';
import type { Relationship } from '@/api/contracts/relationship';
import type { StatusBoard } from '@/api/contracts/status';
import * as authEndpoints from '@/api/endpoints/auth';
import * as notesEndpoints from '@/api/endpoints/notes';
import * as relationshipEndpoints from '@/api/endpoints/relationship';
import * as statusEndpoints from '@/api/endpoints/status';
import { resetServerClock } from '@/api/server-clock';
import { READ_AFTER_VISIBLE_MS } from '@/features/notes/use-mark-read';
import { RELATIONSHIP_QUERY_KEY } from '@/features/relationship/use-relationship';
import {
  SET_STATUS_MUTATION_KEY,
  STATUS_BOARD_QUERY_KEY,
} from '@/features/status/use-status-board';
import { preferencesStore } from '@/preferences/preferences';
import { canvasRelationship, pendingRelationship } from '@/testing/relationship';
import { seedOnboarded, testMe } from '@/testing/session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';

// 16:25 in Tehran on 2026-10-03, the relationship's zone.
const NOW = Date.parse('2026-10-03T12:55:00.000Z');
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const HEART = '❤️';

const STATUSES: StatusBoard = {
  you: { mood: 'happy', at: minutesAgo(10) },
  partner: { mood: 'calm', at: minutesAgo(32) },
  today: [
    { owner: 'you', mood: 'happy', at: minutesAgo(10) },
    { owner: 'partner', mood: 'calm', at: minutesAgo(32) },
  ],
};
const YOURS: NoteContract = {
  id: 'nv_yours',
  text: `امروز در جلسه‌ات موفق باشی ${HEART}`,
  updatedAt: '2026-10-03T06:12:00.000Z',
  edited: false,
  seenAt: '2026-10-03T06:35:00.000Z',
};
const PARTNERS: NoteContract = {
  id: 'nv_partner',
  text: 'به تو فکر می‌کنم.',
  updatedAt: minutesAgo(12),
  edited: false,
  seenAt: null,
};

let client: QueryClient;
/** What ZAPE holds: every fetch answers from here. */
let server: { statuses: StatusBoard; notes: NoteBoard };
let markNoteRead: jest.SpiedFunction<typeof notesEndpoints.markNoteRead>;

function TestRoot() {
  return (
    <QueryClientProvider client={client}>
      <TestProviders tone="stored">
        <Slot />
      </TestProviders>
    </QueryClientProvider>
  );
}

const routes = {
  _layout: TestRoot,
  '(main)/_layout': MainLayout,
  '(main)/(tabs)/_layout': TabsLayout,
  '(main)/(tabs)/index': Home,
  '(main)/(tabs)/clock': RelClock,
  '(main)/(tabs)/status': Status,
  '(main)/(tabs)/note': Note,
  '(main)/(tabs)/more': More,
};

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** Lets fetches and cache updates settle. */
async function settle() {
  for (let round = 0; round < 6; round++) await advance(0);
}

async function renderHome({
  statuses = STATUSES,
  notes = { you: YOURS, partner: PARTNERS },
  relationship = canvasRelationship,
}: { statuses?: StatusBoard; notes?: NoteBoard; relationship?: Relationship } = {}) {
  server = { statuses, notes };
  jest.spyOn(relationshipEndpoints, 'getCurrentRelationship').mockResolvedValue(relationship);
  client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity },
    },
  });
  seedOnboarded(client);
  client.setQueryData(RELATIONSHIP_QUERY_KEY, relationship);
  const result = renderRouter(routes, { initialUrl: '/' });
  await settle();
  return result;
}

/** Reports the Note tab's layout: a full-height tab with the partner's card near the top. */
function layOutNoteTab() {
  const layout = (y: number, height: number) => ({
    nativeEvent: { layout: { x: 0, y, width: 390, height } },
  });
  fireEvent(screen.getByTestId('tab-scroll-note'), 'layout', layout(0, 844));
  fireEvent(screen.getByTestId('note-cards'), 'layout', layout(150, 520));
  fireEvent(screen.getByTestId('note-partner-frame'), 'layout', layout(0, 160));
}

beforeEach(async () => {
  resetServerClock();
  preferencesStore.setState({ clockTheme: 'constellation', background: 'auto' });
  await setTestLocale('fa');
  Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  jest.spyOn(authEndpoints, 'getMe').mockResolvedValue(
    testMe({
      relationship: { id: 'rel-1', status: 'active' },
      onboardingCompletedAt: '2026-09-01T10:00:00.000Z',
    })
  );
  jest.spyOn(statusEndpoints, 'getStatusBoard').mockImplementation(async () => server.statuses);
  jest.spyOn(notesEndpoints, 'getNoteBoard').mockImplementation(async () => server.notes);
  markNoteRead = jest
    .spyOn(notesEndpoints, 'markNoteRead')
    .mockImplementation(async (_api, noteId) => {
      const seenAt = new Date(NOW).toISOString();
      const partner = server.notes.partner;
      if (partner?.id === noteId)
        server.notes = { ...server.notes, partner: { ...partner, seenAt } };
      return { id: noteId, seenAt };
    });
});

afterEach(() => {
  act(() => onlineManager.setOnline(true));
  jest.restoreAllMocks();
  client.clear();
});

describe('Home status orbs', () => {
  it('shows each mood with its label and «شما · ۱۰ دقیقه پیش»', async () => {
    await renderHome();
    const you = within(screen.getByTestId('orb-you-button'));
    expect(you.getByText('شاد')).toBeTruthy();
    expect(you.getByText('شما · ۱۰ دقیقه پیش')).toBeTruthy();
    expect(screen.getByTestId('orb-you')).toHaveStyle({ borderStyle: 'solid' });
    expect(screen.getByTestId('orb-you-button').props.accessibilityLabel).toBe(
      'شما: شاد، شما · ۱۰ دقیقه پیش'
    );

    const partner = within(screen.getByTestId('orb-partner-button'));
    expect(partner.getByText('آرام')).toBeTruthy();
    expect(partner.getByText('همراه · ۳۲ دقیقه پیش')).toBeTruthy();
    // Both halves of the thread are still there, solid.
    expect(
      screen.getByTestId('thread-partner', { includeHiddenElements: true }).props.strokeOpacity
    ).toBeUndefined();
  });

  it('reads "You · 10m ago" in English', async () => {
    await setTestLocale('en');
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    await renderHome({
      statuses: { ...STATUSES, partner: { mood: 'missing', at: minutesAgo(125) } },
    });
    const you = within(screen.getByTestId('orb-you-button'));
    expect(you.getByText('Happy')).toBeTruthy();
    expect(you.getByText('You · 10m ago')).toBeTruthy();
    const partner = within(screen.getByTestId('orb-partner-button'));
    expect(partner.getByText('Missing you')).toBeTruthy();
    expect(partner.getByText('Partner · 2h ago')).toBeTruthy();
  });

  it('dashes your orb with «ثبت حال» when you have no status, and «بدون حال» for the partner', async () => {
    const result = await renderHome({ statuses: { you: null, partner: null, today: [] } });
    expect(screen.getByTestId('orb-you')).toHaveStyle({ borderStyle: 'dashed' });
    expect(within(screen.getByTestId('orb-you-button')).getByText('ثبت حال')).toBeTruthy();
    expect(within(screen.getByTestId('orb-partner-button')).getByText('بدون حال')).toBeTruthy();
    expect(within(screen.getByTestId('orb-partner-button')).getByText('همراه')).toBeTruthy();

    // Setting a status starts from the dashed orb.
    fireEvent.press(screen.getByTestId('orb-you-button'));
    await settle();
    expect(result.getPathname()).toBe('/status');
    expect(within(screen.getByTestId('status-action')).getByText('ثبت حال')).toBeTruthy();
  });

  it('opens the Status tab from the partner orb too', async () => {
    const result = await renderHome();
    fireEvent.press(screen.getByTestId('orb-partner-button'));
    await settle();
    expect(result.getPathname()).toBe('/status');
    expect(screen.getByTestId('status-you')).toBeTruthy();
  });

  it('shows the new mood with «در انتظار همگام‌سازی» while a save waits for the connection', async () => {
    await renderHome();
    // A status save that lost its connection: sent, paused, and already shown on the board.
    act(() => onlineManager.setOnline(false));
    await act(async () => {
      void client
        .getMutationCache()
        .build(client, {
          mutationKey: SET_STATUS_MUTATION_KEY,
          mutationFn: async () => ({ mood: 'loved' as const, at: minutesAgo(0) }),
        })
        .execute(undefined);
      client.setQueryData<StatusBoard>(STATUS_BOARD_QUERY_KEY, (board) =>
        board ? { ...board, you: { mood: 'loved', at: minutesAgo(0) } } : board
      );
    });
    await settle();
    const you = within(screen.getByTestId('orb-you-button'));
    expect(you.getByText('عاشق')).toBeTruthy();
    expect(you.getByText('در انتظار همگام‌سازی')).toBeTruthy();
    expect(screen.getByTestId('offline-chip')).toBeTruthy();

    act(() => onlineManager.setOnline(true));
    await settle();
    expect(
      within(screen.getByTestId('orb-you-button')).queryByText('در انتظار همگام‌سازی')
    ).toBeNull();
  });

  it('keeps the partner-not-joined orb until they join', async () => {
    await renderHome({
      relationship: pendingRelationship,
      statuses: { you: { mood: 'happy', at: minutesAgo(10) }, partner: null, today: [] },
      notes: { you: YOURS, partner: null },
    });
    expect(within(screen.getByTestId('orb-you-button')).getByText('شاد')).toBeTruthy();
    expect(screen.getByText('هنوز نپیوسته')).toBeTruthy();
    expect(screen.getByText('دعوت شده')).toBeTruthy();
    expect(screen.queryByTestId('orb-partner-button')).toBeNull();
    // The invite card holds the note card's place.
    expect(screen.getByTestId('invite-card')).toBeTruthy();
    expect(screen.queryByTestId('home-note')).toBeNull();
  });
});

describe('Home note card', () => {
  it('shows the partner’s unread note even though yours is newer, with the NEW badge', async () => {
    await renderHome({
      notes: {
        you: { ...YOURS, updatedAt: minutesAgo(3), seenAt: null },
        partner: { ...PARTNERS, updatedAt: minutesAgo(200) },
      },
    });
    const card = within(screen.getByTestId('home-note'));
    expect(card.getByTestId('home-note-text')).toHaveTextContent('«به تو فکر می‌کنم.»');
    // 200 minutes ago is 13:05 in Tehran.
    expect(card.getByTestId('home-note-meta')).toHaveTextContent('همراه · امروز · ۱۳:۰۵');
    expect(card.getByTestId('note-new')).toHaveTextContent('جدید');
    expect(screen.queryByTestId('invite-card')).toBeNull();
  });

  it('shows a note from the last hour with a relative time', async () => {
    await renderHome();
    expect(screen.getByTestId('home-note-meta')).toHaveTextContent('همراه · ۱۲ دقیقه پیش');
  });

  it('shows whichever note is newer once the partner’s is read', async () => {
    await renderHome({
      notes: {
        you: { ...YOURS, updatedAt: minutesAgo(3), seenAt: null },
        partner: { ...PARTNERS, seenAt: minutesAgo(5) },
      },
    });
    const card = within(screen.getByTestId('home-note'));
    expect(card.getByTestId('home-note-text')).toHaveTextContent(`«${YOURS.text}»`);
    expect(card.getByTestId('home-note-meta')).toHaveTextContent('شما · ۳ دقیقه پیش');
    expect(card.queryByTestId('note-new')).toBeNull();
  });

  it('uses curly quotes and "Today · hh:mm" in English', async () => {
    await setTestLocale('en');
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    await renderHome({
      notes: {
        you: null,
        partner: { ...PARTNERS, text: 'Thinking about you.', updatedAt: minutesAgo(200) },
      },
    });
    const card = within(screen.getByTestId('home-note'));
    expect(card.getByTestId('home-note-text')).toHaveTextContent('“Thinking about you.”');
    expect(card.getByTestId('home-note-meta')).toHaveTextContent('Partner · Today · 13:05');
    expect(card.getByTestId('note-new')).toHaveTextContent('NEW');
  });

  it('shows no card when neither of you has a note', async () => {
    await renderHome({ notes: { you: null, partner: null } });
    expect(screen.queryByTestId('home-note')).toBeNull();
    expect(screen.queryByTestId('invite-card')).toBeNull();
    expect(screen.getByTestId('clock-hero')).toBeTruthy();
  });

  it('opens the Note tab', async () => {
    const result = await renderHome();
    fireEvent.press(screen.getByTestId('home-note'));
    await settle();
    expect(result.getPathname()).toBe('/note');
    expect(screen.getByTestId('note-partner-text')).toHaveTextContent('به تو فکر می‌کنم.');
  });
});

describe('unread across Home, the Note tab and the tab bar', () => {
  it('keeps a note unread while it is only seen on Home', async () => {
    await renderHome();
    expect(within(screen.getByTestId('home-note')).getByTestId('note-new')).toBeTruthy();
    expect(screen.getByTestId('tab-note-unread')).toBeTruthy();
    expect(screen.getByTestId('tab-note').props.accessibilityLabel).toBe(
      'یادداشت، یادداشت تازه از همراه شما'
    );

    // Long enough to read it three times over: Home never counts.
    await advance(5000);
    await settle();
    expect(markNoteRead).not.toHaveBeenCalled();
    expect(server.notes.partner?.seenAt).toBeNull();
    expect(within(screen.getByTestId('home-note')).getByTestId('note-new')).toBeTruthy();
    expect(screen.getByTestId('tab-note-unread')).toBeTruthy();
  });

  it('marks it read after 1.5 s on the Note tab, clearing the badge on Home and the tab dot', async () => {
    const result = await renderHome();
    fireEvent.press(screen.getByTestId('tab-note'));
    await settle();
    expect(result.getPathname()).toBe('/note');
    layOutNoteTab();

    await advance(READ_AFTER_VISIBLE_MS - 100);
    expect(markNoteRead).not.toHaveBeenCalled();
    expect(within(screen.getByTestId('note-partner')).getByTestId('note-new')).toBeTruthy();

    await advance(200);
    await settle();
    expect(markNoteRead).toHaveBeenCalledTimes(1);
    expect(markNoteRead.mock.calls[0]![1]).toBe('nv_partner');
    expect(within(screen.getByTestId('note-partner')).queryByTestId('note-new')).toBeNull();

    fireEvent.press(screen.getByTestId('tab-home'));
    await settle();
    expect(result.getPathname()).toBe('/');
    expect(screen.queryByTestId('tab-note-unread')).toBeNull();
    expect(screen.getByTestId('tab-note').props.accessibilityLabel).toBe('یادداشت');
    const card = within(screen.getByTestId('home-note'));
    // Still the partner's note, the newer of the two, now without the badge.
    expect(card.getByTestId('home-note-text')).toHaveTextContent('«به تو فکر می‌کنم.»');
    expect(card.queryByTestId('note-new')).toBeNull();
  });

  it('does not count time on the Note tab once you have moved to another tab', async () => {
    await renderHome();
    fireEvent.press(screen.getByTestId('tab-note'));
    await settle();
    layOutNoteTab();
    await advance(1000);
    fireEvent.press(screen.getByTestId('tab-home'));
    await settle();
    await advance(5000);
    expect(markNoteRead).not.toHaveBeenCalled();
    expect(screen.getByTestId('tab-note-unread')).toBeTruthy();
  });

  it('shows the dot again when the partner leaves a new note (within the 30 s refresh)', async () => {
    await renderHome({ notes: { you: YOURS, partner: { ...PARTNERS, seenAt: minutesAgo(5) } } });
    expect(screen.queryByTestId('tab-note-unread')).toBeNull();
    expect(within(screen.getByTestId('home-note')).queryByTestId('note-new')).toBeNull();

    // The partner saves a new version; nothing here refreshes by hand.
    server.notes = {
      ...server.notes,
      partner: {
        id: 'nv_partner_2',
        text: 'شام با من 🍝',
        updatedAt: minutesAgo(0),
        edited: true,
        seenAt: null,
      },
    };
    await advance(29_000);
    expect(screen.queryByTestId('tab-note-unread')).toBeNull();
    await advance(1500);
    await settle();
    expect(screen.getByTestId('tab-note-unread')).toBeTruthy();
    const card = within(screen.getByTestId('home-note'));
    expect(card.getByTestId('home-note-text')).toHaveTextContent('«شام با من 🍝»');
    expect(card.getByTestId('note-new')).toBeTruthy();
  });
});
