import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from '@/app/(main)/_layout';
import TabsLayout from '@/app/(main)/(tabs)/_layout';
import Home from '@/app/(main)/(tabs)/index';
import RelClock from '@/app/(main)/(tabs)/clock';
import Status from '@/app/(main)/(tabs)/status';
import Note from '@/app/(main)/(tabs)/note';
import More from '@/app/(main)/(tabs)/more';
import Invite from '@/app/(main)/invite';
import { getApiClient } from '@/api/backend';
import { completeOnboarding } from '@/api/endpoints/auth';
import { createRelationship } from '@/api/endpoints/relationship';
import { mockStore } from '@/api/mock';
import { runPartnerControl } from '@/api/mock/partner-controls';
import type { Relationship } from '@/api/contracts/relationship';
import { RELATIONSHIP_QUERY_KEY } from '@/features/relationship/use-relationship';
import { preferencesStore } from '@/preferences/preferences';
import { signInToMock } from '@/testing/mock-session';
import { CANVAS_NOW, canvasRelationship, pendingRelationship } from '@/testing/relationship';
import { seedOnboarded } from '@/testing/session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';

let client: QueryClient;

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
  '(main)/invite': Invite,
};

function newClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity },
    },
  });
}

/** Renders Home with the relationship already cached. */
function renderHome(relationship: Relationship) {
  client = newClient();
  seedOnboarded(client);
  client.setQueryData(RELATIONSHIP_QUERY_KEY, relationship);
  return renderRouter(routes, { initialUrl: '/' });
}

/** Moves renderRouter's fake clock in one step, then lets the resulting work settle. */
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** The x where a thread half starts (`M<x> <y>C…`). */
function startX(testID: string): number {
  return Number(
    /^M([\d.]+)/.exec(screen.getByTestId(testID, { includeHiddenElements: true }).props.d)![1]
  );
}

describe('Home', () => {
  beforeEach(async () => {
    preferencesStore.setState({ clockTheme: 'constellation', background: 'auto' });
    await setTestLocale('fa');
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    client.clear();
  });

  it('shows the header, the thread with both orbs and the clock hero, and nothing else', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(CANVAS_NOW);
    renderHome(canvasRelationship);
    await waitFor(() => expect(screen.getByTestId('clock-hero')).toBeTruthy());
    expect(screen.getByLabelText('ZAPE RelTime')).toBeTruthy();
    expect(screen.getByTestId('home-thread')).toBeTruthy();
    expect(screen.queryByTestId('invite-card')).toBeNull();
    // No skeleton heading once Home has its content.
    expect(screen.queryByText('این بخش در مرحلهٔ بعد ساخته می‌شود.')).toBeNull();

    const hero = screen.getByTestId('clock-hero');
    expect(hero.props.accessibilityLabel).toBe('زمان ما: ۰۵ سال، ۰۶ ماه، ۱۲ روز');
    expect(screen.getByText('از ۲۴ اسفند ۱۳۹۹')).toBeTruthy();
    expect(
      screen.getByTestId('hero-time', { includeHiddenElements: true }).props.defaultValue
    ).toBe('۰۳:۳۱:۱۱.۵۰۸');
    expect(screen.getByText('سارا')).toBeTruthy();
    // Both halves are solid and drawn in.
    expect(
      screen.getByTestId('thread-partner', { includeHiddenElements: true }).props.strokeOpacity
    ).toBeUndefined();
  });

  it('draws "you" from the right in Persian and from the left in English', async () => {
    const fa = renderHome(canvasRelationship);
    await waitFor(() => expect(screen.getByTestId('home-thread')).toBeTruthy());
    expect(startX('thread-you')).toBeGreaterThan(startX('thread-partner'));
    fa.unmount();
    client.clear();

    await setTestLocale('en');
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    renderHome(canvasRelationship);
    await waitFor(() => expect(screen.getByTestId('home-thread')).toBeTruthy());
    expect(startX('thread-you')).toBeLessThan(startX('thread-partner'));
    expect(screen.getByText('Since March 14, 2021')).toBeTruthy();
  });

  it('opens Rel Clock from the hero', async () => {
    const result = renderHome(canvasRelationship);
    fireEvent.press(await screen.findByTestId('clock-hero'));
    await waitFor(() => expect(result.getPathname()).toBe('/clock'));
    expect(await screen.findByTestId('clock-face')).toBeTruthy();
  });

  it('shows the single-member state: dashed partner half and orb, and the invite card', async () => {
    renderHome(pendingRelationship);
    await waitFor(() => expect(screen.getByTestId('invite-card')).toBeTruthy());
    const partnerHalf = screen.getByTestId('thread-partner', { includeHiddenElements: true });
    expect(partnerHalf.props.strokeDasharray).toEqual([4, 5]);
    expect(screen.getByTestId('orb-partner')).toHaveStyle({ borderStyle: 'dashed' });
    expect(screen.getByText('هنوز نپیوسته')).toBeTruthy();
    expect(screen.getByText('دعوت شده')).toBeTruthy();
    expect(screen.getByText('همراهتان هنوز نپیوسته است.')).toBeTruthy();
    expect(
      screen.getByText('رشته‌ی ما از روزی آغاز می‌شود که هر دو حالتان را بگذارید.')
    ).toBeTruthy();
  });

  it('opens the invite screen with a valid code from «ارسال دوباره‌ی دعوت‌نامه»', async () => {
    const result = renderHome(pendingRelationship);
    fireEvent.press(await screen.findByText('ارسال دوباره‌ی دعوت‌نامه'));
    await waitFor(() => expect(result.getPathname()).toBe('/invite'));
    expect(screen.getByTestId('invite-code')).toHaveTextContent('7K4P 9RM2');
    expect(screen.getByTestId('invite-share')).toBeTruthy();
    expect(screen.getByTestId('screen-back').props.accessibilityLabel).toBe('بازگشت به خانه');
  });
});

describe('Home against the mock backend', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    // renderRouter leaves fake timers on; the sign-in before rendering needs real ones.
    jest.useRealTimers();
    await mockStore.reset();
    preferencesStore.setState({ clockTheme: 'constellation', background: 'auto' });
    await setTestLocale('fa');
  });
  afterEach(() => client.clear());

  it('replaces the invite card once the partner joins (within the 30 s refresh)', async () => {
    await signInToMock('+989351230001');
    await createRelationship(getApiClient(), {
      start: { date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' },
      calendar: 'jalali',
    });
    await completeOnboarding(getApiClient());
    client = newClient();
    renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByTestId('invite-card', {}, { timeout: 4000 })).toBeTruthy();

    await act(async () => {
      await runPartnerControl('relationship.partner-joins');
    });
    // Nothing refreshes it by hand: the 30 s partner-data interval picks up the change.
    await advance(29_000);
    expect(screen.getByTestId('invite-card')).toBeTruthy();
    // The interval fires at 30 s; a few more rounds let the mock answer and React commit.
    for (let round = 0; round < 4; round++) await advance(500);
    expect(screen.queryByTestId('invite-card')).toBeNull();
    expect(
      screen.getByTestId('thread-partner', { includeHiddenElements: true }).props.strokeDasharray
    ).not.toEqual([4, 5]);
    expect(screen.getByText('سارا')).toBeTruthy();
  }, 20_000);
});
