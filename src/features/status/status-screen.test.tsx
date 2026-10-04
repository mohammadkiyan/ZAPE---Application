import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import type { StatusBoard } from '@/api/contracts/status';
import * as statusEndpoints from '@/api/endpoints/status';
import { createQueryClient } from '@/api/query-client';
import { resetServerClock } from '@/api/server-clock';
import { sessionStore } from '@/features/auth/session-store';
import { RELATIONSHIP_QUERY_KEY } from '@/features/relationship/use-relationship';
import { canvasRelationship } from '@/testing/relationship';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { STATUS_CONFIRM_MS, StatusScreen } from './status-screen';
import { STATUS_BOARD_QUERY_KEY } from './use-status-board';

// 16:25 in Tehran on 2026-10-03.
const NOW = Date.parse('2026-10-03T12:55:00.000Z');
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const BOTH_SET: StatusBoard = {
  you: { mood: 'happy', at: minutesAgo(10) },
  partner: { mood: 'calm', at: minutesAgo(32) },
  today: [
    { owner: 'you', mood: 'happy', at: minutesAgo(10) },
    { owner: 'partner', mood: 'calm', at: minutesAgo(32) },
    { owner: 'you', mood: 'missing', at: minutesAgo(125) },
  ],
};
const UNSET: StatusBoard = { you: null, partner: null, today: [] };

let client: QueryClient;

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

function renderStatus(board: StatusBoard | undefined) {
  client = newClient();
  client.setQueryData(RELATIONSHIP_QUERY_KEY, canvasRelationship);
  if (board) client.setQueryData(STATUS_BOARD_QUERY_KEY, board);
  return render(
    <QueryClientProvider client={client}>
      <TestProviders tone="dark">
        <StatusScreen />
      </TestProviders>
    </QueryClientProvider>
  );
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** Lets promise chains (mutation callbacks, cache updates) settle. */
async function settle() {
  for (let round = 0; round < 5; round++) await advance(0);
}

describe('Status tab', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    resetServerClock();
    // Signed out: the board comes from the cache alone and nothing is fetched.
    sessionStore.setState({ status: 'signed-out', credential: undefined });
    await setTestLocale('fa');
  });
  // Fake timers stay on through the testing library's cleanup: on Node 22, unmounting a tree
  // that was rendered under fake timers after switching back to real ones never finishes.
  afterEach(() => {
    act(() => onlineManager.setOnline(true));
    jest.restoreAllMocks();
    client.clear();
  });

  it('shows the title, the question and both moods with relative times', () => {
    renderStatus(BOTH_SET);
    expect(screen.getByText('حال')).toBeTruthy();
    expect(
      screen.getByRole('header', { name: 'حال هر دوی شما در این لحظه چطور است؟' })
    ).toBeTruthy();

    const you = within(screen.getByTestId('status-you'));
    expect(you.getByText('شما')).toBeTruthy();
    expect(you.getByText('شاد')).toBeTruthy();
    expect(you.getByText('۱۰ دقیقه پیش')).toBeTruthy();
    const partner = within(screen.getByTestId('status-partner'));
    expect(partner.getByText('همراه')).toBeTruthy();
    expect(partner.getByText('آرام')).toBeTruthy();
    expect(partner.getByText('۳۲ دقیقه پیش')).toBeTruthy();
    expect(screen.getByTestId('status-you').props.accessibilityLabel).toBe(
      'شما، شاد، ۱۰ دقیقه پیش'
    );

    expect(within(screen.getByTestId('status-action')).getByText('تغییر حال')).toBeTruthy();
    expect(screen.queryByTestId('status-in-sync')).toBeNull();
    expect(screen.queryByTestId('status-offline')).toBeNull();
  });

  it('shows the unset state: «ثبت نشده», «هنوز حالی ثبت نشده» and «ثبت حال»', () => {
    renderStatus(UNSET);
    expect(within(screen.getByTestId('status-you')).getByText('ثبت نشده')).toBeTruthy();
    expect(
      within(screen.getByTestId('status-partner')).getByText('هنوز حالی ثبت نشده')
    ).toBeTruthy();
    expect(screen.getByTestId('status-you-when')).toHaveTextContent('');
    expect(within(screen.getByTestId('status-action')).getByText('ثبت حال')).toBeTruthy();
  });

  it('says so when both share the same mood', () => {
    renderStatus({
      ...BOTH_SET,
      partner: { mood: 'happy', at: minutesAgo(32) },
    });
    expect(within(screen.getByTestId('status-in-sync')).getByText('هم‌حال شدید')).toBeTruthy();
  });

  it('lists today’s changes newest first, with the glyph’s mood, the hour and the owner', () => {
    renderStatus(BOTH_SET);
    const history = screen.getByTestId('status-history');
    expect(history.props.accessibilityLabel).toBe('تاریخچه‌ی حال امروز');
    expect(screen.getByText('امروز')).toBeTruthy();
    const entries = within(history).getAllByTestId('status-history-entry');
    // The hour is read in the relationship's zone: 12:45 UTC is 16:15 in Tehran.
    expect(entries.map((entry) => entry.props.accessibilityLabel)).toEqual([
      'شاد، ۱۶:۱۵، شما',
      'آرام، ۱۵:۵۳، همراه',
      'دلتنگ، ۱۴:۲۰، شما',
    ]);
    expect(within(entries[0]!).getByText('۱۶:۱۵ · شما')).toBeTruthy();
    expect(screen.queryByTestId('status-history-empty')).toBeNull();
  });

  it('shows an empty Today after the day turned over, with the statuses still there', () => {
    renderStatus({ ...BOTH_SET, today: [] });
    expect(screen.getByTestId('status-history-empty')).toHaveTextContent(
      'امروز هنوز حالی ثبت نشده.'
    );
    expect(screen.queryAllByTestId('status-history-entry')).toHaveLength(0);
    expect(within(screen.getByTestId('status-you')).getByText('شاد')).toBeTruthy();
    expect(within(screen.getByTestId('status-partner')).getByText('آرام')).toBeTruthy();
  });

  it('follows the locale: "Missing you", "You", "Today"', async () => {
    await setTestLocale('en');
    renderStatus({
      you: { mood: 'tired', at: minutesAgo(2) },
      partner: { mood: 'missing', at: minutesAgo(61) },
      today: [{ owner: 'partner', mood: 'missing', at: minutesAgo(61) }],
    });
    expect(
      screen.getByRole('header', { name: 'How are you both feeling right now?' })
    ).toBeTruthy();
    const partner = within(screen.getByTestId('status-partner'));
    expect(partner.getByText('Missing you')).toBeTruthy();
    expect(partner.getByText('1 hour ago')).toBeTruthy();
    expect(within(screen.getByTestId('status-you')).getByText('2 minutes ago')).toBeTruthy();
    expect(within(screen.getByTestId('status-action')).getByText('Change status')).toBeTruthy();
    expect(screen.getByTestId('status-history-entry').props.accessibilityLabel).toBe(
      'Missing you, 15:24, Partner'
    );
  });
});

describe('mood picker', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    resetServerClock();
    sessionStore.setState({ status: 'signed-out', credential: undefined });
    await setTestLocale('fa');
  });
  afterEach(() => {
    act(() => onlineManager.setOnline(true));
    jest.restoreAllMocks();
    client.clear();
  });

  it('shows the ten moods and marks the current one', () => {
    renderStatus(BOTH_SET);
    expect(screen.queryByTestId('mood-picker')).toBeNull();
    fireEvent.press(screen.getByTestId('status-action'));

    const picker = within(screen.getByTestId('mood-picker'));
    expect(picker.getByRole('header', { name: 'حالتان چطور است؟' })).toBeTruthy();
    expect(picker.getAllByRole('button').filter((b) => /^mood-/.test(b.props.testID))).toHaveLength(
      10
    );
    expect(picker.getByTestId('mood-happy').props.accessibilityLabel).toBe('شاد، حال فعلی');
    expect(picker.getByTestId('mood-happy')).toBeSelected();
    expect(picker.getByTestId('mood-tired').props.accessibilityLabel).toBe('خسته');
    expect(picker.getByTestId('mood-tired')).not.toBeSelected();
    expect(picker.getByRole('button', { name: 'بستن' })).toBeTruthy();
  });

  it('saves a pick: the sheet closes and your orb confirms for about 1.5 s', async () => {
    const setStatus = jest
      .spyOn(statusEndpoints, 'setStatus')
      .mockResolvedValue({ mood: 'tired', at: new Date(NOW).toISOString() });
    renderStatus(BOTH_SET);
    fireEvent.press(screen.getByTestId('status-action'));
    fireEvent.press(screen.getByTestId('mood-tired'));
    await settle();

    expect(screen.queryByTestId('mood-picker')).toBeNull();
    const you = within(screen.getByTestId('status-you'));
    expect(you.getByText('خسته')).toBeTruthy();
    expect(screen.getByTestId('status-you-when')).toHaveTextContent('حال شما به‌روز شد');
    expect(screen.getByTestId('status-confirm-halo')).toBeTruthy();
    // The new change leads today's list, as your own.
    expect(screen.getAllByTestId('status-history-entry')[0]!.props.accessibilityLabel).toBe(
      'خسته، ۱۶:۲۵، شما'
    );
    // One save, carrying a key for this pick.
    expect(setStatus).toHaveBeenCalledTimes(1);
    expect(setStatus.mock.calls[0]![1]).toBe('tired');
    expect(setStatus.mock.calls[0]![2]).toEqual(expect.stringMatching(/^[A-Za-z0-9._:-]{8,128}$/));

    await advance(STATUS_CONFIRM_MS - 100);
    expect(screen.getByTestId('status-confirm-halo')).toBeTruthy();
    await advance(200);
    expect(screen.queryByTestId('status-confirm-halo')).toBeNull();
    expect(screen.getByTestId('status-you-when')).toHaveTextContent('همین حالا');
  });

  it('changes nothing when closed without picking', async () => {
    const setStatus = jest.spyOn(statusEndpoints, 'setStatus');
    renderStatus(BOTH_SET);
    fireEvent.press(screen.getByTestId('status-action'));
    fireEvent.press(screen.getByRole('button', { name: 'بستن' }));
    await settle();
    expect(screen.queryByTestId('mood-picker')).toBeNull();
    expect(within(screen.getByTestId('status-you')).getByText('شاد')).toBeTruthy();
    expect(screen.getByTestId('status-you-when')).toHaveTextContent('۱۰ دقیقه پیش');
    expect(setStatus).not.toHaveBeenCalled();
  });

  it('rolls back and explains when ZAPE rejects the save', async () => {
    jest
      .spyOn(statusEndpoints, 'setStatus')
      .mockRejectedValue(new ApiError('Request failed (500)', 'http_error', 500));
    renderStatus(BOTH_SET);
    fireEvent.press(screen.getByTestId('status-action'));
    fireEvent.press(screen.getByTestId('mood-sad'));
    await settle();

    // Back to the status ZAPE holds, with no confirmation left behind.
    expect(within(screen.getByTestId('status-you')).getByText('شاد')).toBeTruthy();
    expect(screen.getByTestId('status-you-when')).toHaveTextContent('۱۰ دقیقه پیش');
    expect(screen.queryByTestId('status-confirm-halo')).toBeNull();
    expect(screen.getAllByTestId('status-history-entry')).toHaveLength(3);
    expect(screen.getByTestId('status-error')).toHaveTextContent(
      'مشکلی پیش آمد. کمی بعد دوباره تلاش کنید.'
    );
    expect(client.getQueryData<StatusBoard>(STATUS_BOARD_QUERY_KEY)?.you?.mood).toBe('happy');
  });
});

describe('status and connectivity', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    resetServerClock();
    sessionStore.setState({ status: 'signed-out', credential: undefined });
    await setTestLocale('fa');
  });
  afterEach(() => {
    act(() => onlineManager.setOnline(true));
    jest.restoreAllMocks();
    client.clear();
  });

  it('disables the action offline with the reconnect message', async () => {
    renderStatus(BOTH_SET);
    act(() => onlineManager.setOnline(false));
    expect(screen.getByTestId('status-action')).toBeDisabled();
    expect(screen.getByTestId('status-offline')).toHaveTextContent(
      'برای تغییر حال، دوباره به اینترنت متصل شوید.'
    );
    // The picker cannot be opened.
    fireEvent.press(screen.getByTestId('status-action'));
    expect(screen.queryByTestId('mood-picker')).toBeNull();
    // Both statuses stay readable from the last sync.
    expect(within(screen.getByTestId('status-partner')).getByText('آرام')).toBeTruthy();

    act(() => onlineManager.setOnline(true));
    expect(screen.getByTestId('status-action')).not.toBeDisabled();
    expect(screen.queryByTestId('status-offline')).toBeNull();

    await setTestLocale('en');
    act(() => onlineManager.setOnline(false));
    expect(screen.getByTestId('status-offline')).toHaveTextContent(
      'Reconnect to change your status.'
    );
  });

  it('shows "Waiting to sync" when the connection drops mid-save, then retries with the same key', async () => {
    const setStatus = jest
      .spyOn(statusEndpoints, 'setStatus')
      .mockRejectedValueOnce(new ApiError('Network request failed', 'network_error'))
      .mockResolvedValue({ mood: 'loved', at: new Date(NOW).toISOString() });
    renderStatus(BOTH_SET);
    fireEvent.press(screen.getByTestId('status-action'));
    fireEvent.press(screen.getByTestId('mood-loved'));
    await settle();
    expect(setStatus).toHaveBeenCalledTimes(1);

    // The request died with the connection; the phone now knows it is offline.
    act(() => onlineManager.setOnline(false));
    await advance(5000);
    expect(screen.getByTestId('status-you-when')).toHaveTextContent('در انتظار همگام‌سازی');
    expect(within(screen.getByTestId('status-you')).getByText('عاشق')).toBeTruthy();
    expect(screen.queryByTestId('status-confirm-halo')).toBeNull();
    expect(setStatus).toHaveBeenCalledTimes(1);

    // Back online: the same save is sent again, and it is one logical write.
    act(() => onlineManager.setOnline(true));
    await settle();
    expect(setStatus).toHaveBeenCalledTimes(2);
    expect(setStatus.mock.calls[1]![1]).toBe('loved');
    expect(setStatus.mock.calls[1]![2]).toBe(setStatus.mock.calls[0]![2]);
    expect(screen.getByTestId('status-you-when')).not.toHaveTextContent('در انتظار همگام‌سازی');
    expect(screen.queryByTestId('status-error')).toBeNull();
  });
});
