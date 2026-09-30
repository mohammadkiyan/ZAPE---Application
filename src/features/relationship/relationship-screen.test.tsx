import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import MainLayout from '@/app/(main)/_layout';
import TabsLayout from '@/app/(main)/(tabs)/_layout';
import Home from '@/app/(main)/(tabs)/index';
import RelClock from '@/app/(main)/(tabs)/clock';
import Status from '@/app/(main)/(tabs)/status';
import Note from '@/app/(main)/(tabs)/note';
import More from '@/app/(main)/(tabs)/more';
import RelationshipRoute from '@/app/(main)/relationship';
import Invite from '@/app/(main)/invite';
import OnboardingLayout from '@/app/(onboarding)/_layout';
import StartRelationship from '@/app/(onboarding)/start-relationship/index';
import { getApiClient } from '@/api/backend';
import { completeOnboarding } from '@/api/endpoints/auth';
import { createRelationship } from '@/api/endpoints/relationship';
import { MOCK_SEED_PHONE, mockStore } from '@/api/mock';
import { runPartnerControl } from '@/api/mock/partner-controls';
import type { Relationship } from '@/api/contracts/relationship';
import { sessionStore } from '@/features/auth/session-store';
import { preferencesStore } from '@/preferences/preferences';
import { signInToMock } from '@/testing/mock-session';
import { CANVAS_NOW, canvasRelationship, pendingRelationship } from '@/testing/relationship';
import { seedOnboarded } from '@/testing/session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { RELATIONSHIP_QUERY_KEY } from './use-relationship';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

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
  '(main)/relationship': RelationshipRoute,
  '(main)/invite': Invite,
  '(onboarding)/_layout': OnboardingLayout,
  '(onboarding)/welcome': () => null,
  '(onboarding)/start-relationship/index': StartRelationship,
};

function newClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

function renderScreen(relationship: Relationship) {
  jest.spyOn(Date, 'now').mockReturnValue(CANVAS_NOW);
  client = newClient();
  seedOnboarded(client);
  client.setQueryData(RELATIONSHIP_QUERY_KEY, relationship);
  return renderRouter(routes, { initialUrl: '/relationship?origin=more' });
}

beforeEach(async () => {
  preferencesStore.setState({ locale: 'fa', clockTheme: 'porcelain', background: 'auto' });
  await setTestLocale('fa');
});
afterEach(() => {
  jest.restoreAllMocks();
  client?.clear();
});

describe('Relationship screen', () => {
  it('shows the pair, time together, members with join dates and the ID', async () => {
    renderScreen(canvasRelationship);
    expect(await screen.findByTestId('relationship-since')).toHaveTextContent(
      'از ۲۴ اسفند ۱۳۹۹ · ۲۰:۰۰'
    );
    expect(screen.getByTestId('relationship-together')).toHaveTextContent(
      '۵ سال، ۶ ماه و ۱۲ روز با هم'
    );
    const time = within(screen.getByTestId('relationship-time'));
    expect(time.getByText('۲۴ اسفند ۱۳۹۹')).toBeTruthy();
    expect(time.getByText('۲۰:۰۰')).toBeTruthy();
    expect(time.getByText('جلالی')).toBeTruthy();
    expect(time.getByText('تهران · UTC+۰۳:۳۰')).toBeTruthy();
    expect(screen.getByText('تغییر این موارد به تأیید همراهتان نیاز دارد.')).toBeTruthy();

    expect(within(screen.getByTestId('member-you')).getByText('محمد (شما)')).toBeTruthy();
    expect(within(screen.getByTestId('member-partner')).getByText('سارا')).toBeTruthy();
    expect(within(screen.getByTestId('member-partner')).getByText('از ۲۵ اسفند ۱۳۹۹')).toBeTruthy();
    expect(screen.queryByTestId('member-invited')).toBeNull();
    expect(screen.getByText('RLT-4K7Q-92MD')).toBeTruthy();
    expect(screen.getByTestId('screen-back').props.accessibilityLabel).toBe('بازگشت به بیشتر');
  });

  it('shows an invited partner with access to the invite code', async () => {
    const result = renderScreen(pendingRelationship);
    const invited = await screen.findByTestId('member-invited');
    expect(within(invited).getByText('دعوت شده')).toBeTruthy();
    expect(screen.getByTestId('relationship-partner-orb')).toHaveStyle({ borderStyle: 'dashed' });
    fireEvent.press(within(invited).getByText('نمایش کد دعوت'));
    await waitFor(() => expect(result.getPathname()).toBe('/invite'));
    expect(screen.getByTestId('invite-code')).toHaveTextContent('7K4P 9RM2');
  });

  it('copies the relationship ID and confirms it briefly', async () => {
    renderScreen(canvasRelationship);
    fireEvent.press(await screen.findByRole('button', { name: 'کپی شناسه' }));
    await waitFor(() => expect(screen.getByText('شناسه کپی شد')).toBeTruthy());
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('RLT-4K7Q-92MD');
    await advance(2500);
    expect(screen.queryByText('شناسه کپی شد')).toBeNull();
  });

  it('opens from the More tab', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(CANVAS_NOW);
    client = newClient();
    seedOnboarded(client);
    client.setQueryData(RELATIONSHIP_QUERY_KEY, canvasRelationship);
    const result = renderRouter(routes, { initialUrl: '/more' });
    fireEvent.press(await screen.findByTestId('more-relationship'));
    await waitFor(() => expect(result.getPathname()).toBe('/relationship'));
  });
});

describe('ending the relationship against the mock backend', () => {
  beforeEach(async () => {
    jest.useRealTimers();
    await AsyncStorage.clear();
    await mockStore.reset();
  });

  it('confirms, ends it, and returns to the create-or-join step still signed in', async () => {
    await signInToMock(MOCK_SEED_PHONE);
    client = newClient();
    const result = renderRouter(routes, { initialUrl: '/relationship?origin=more' });
    fireEvent.press(await screen.findByTestId('relationship-end', {}, { timeout: 4000 }));
    expect(screen.getByText('رابطه پایان یابد؟')).toBeTruthy();
    expect(screen.getByText(/حسابتان سر جایش می‌ماند و به همراهتان خبر داده می‌شود/)).toBeTruthy();

    fireEvent.press(screen.getByTestId('end-cancel'));
    expect(screen.queryByText('رابطه پایان یابد؟')).toBeNull();

    fireEvent.press(screen.getByTestId('relationship-end'));
    fireEvent.press(screen.getByTestId('end-confirm'));
    expect(await screen.findByTestId('start-relationship', {}, { timeout: 4000 })).toBeTruthy();
    expect(result.getPathname()).toBe('/start-relationship');
    expect(screen.getByTestId('relationship-ended-notice')).toHaveTextContent(
      'رابطه پایان یافت. حسابتان سر جایش است.'
    );
    expect(sessionStore.getState().status).toBe('signed-in');
    expect(await AsyncStorage.getItem('zape.relationship.last')).toBeNull();
  });

  it('takes the user to the step within 30 s when the partner ends it', async () => {
    await signInToMock('+989351120001');
    await createRelationship(getApiClient(), {
      start: { date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' },
      calendar: 'jalali',
    });
    await completeOnboarding(getApiClient());
    await runPartnerControl('relationship.partner-joins');
    client = newClient();
    const result = renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByTestId('clock-hero', {}, { timeout: 4000 })).toBeTruthy();

    await act(async () => {
      await runPartnerControl('relationship.partner-ends');
    });
    await advance(29_000);
    expect(result.getPathname()).toBe('/');
    for (let round = 0; round < 6; round++) await advance(500);
    expect(screen.getByTestId('start-relationship')).toBeTruthy();
    expect(result.getPathname()).toBe('/start-relationship');
    expect(screen.getByTestId('relationship-ended-notice')).toHaveTextContent(
      /همراهتان رابطه را پایان داد/
    );
  });
});
