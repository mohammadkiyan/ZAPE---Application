import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Slot, router } from 'expo-router';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import OnboardingLayout from '@/app/(onboarding)/_layout';
import StartRelationship from '@/app/(onboarding)/start-relationship/index';
import CreateRelationship from '@/app/(onboarding)/start-relationship/create';
import InvitePartner from '@/app/(onboarding)/start-relationship/invite';
import JoinRelationship from '@/app/(onboarding)/start-relationship/join';
import { getApiClient } from '@/api/backend';
import { acceptInvite } from '@/api/endpoints/relationship';
import { MOCK_JOINABLE_CODE, MOCK_SEED_PHONE, mockStore } from '@/api/mock';
import { mockRelationships } from '@/api/mock/handlers/relationship';
import { preferencesStore } from '@/preferences/preferences';
import { signInToMock } from '@/testing/mock-session';
import { seedSession, testMe } from '@/testing/session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { CreateRelationshipScreen } from './create-screen';
import { codeState, normalizeInviteCode } from './invite-code';
import { phoneTimeZone, stepDate, todayIn } from './start-picker';

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
  '(onboarding)/_layout': OnboardingLayout,
  '(onboarding)/welcome': () => null,
  '(onboarding)/ready': () => null,
  '(onboarding)/start-relationship/index': StartRelationship,
  '(onboarding)/start-relationship/create': CreateRelationship,
  '(onboarding)/start-relationship/invite': InvitePartner,
  '(onboarding)/start-relationship/join': JoinRelationship,
};

function newClient(staleTime = 0) {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false, staleTime },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
}

beforeEach(async () => {
  preferencesStore.setState({ locale: 'fa', clockTheme: 'constellation' });
  await setTestLocale('fa');
  Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
});
afterEach(() => {
  jest.restoreAllMocks();
  client?.clear();
});

describe('create-or-join choice', () => {
  it('links to the create and join screens', async () => {
    client = newClient(Infinity);
    seedSession(client, { me: testMe(), localStep: 'relationship' });
    const result = renderRouter(routes, { initialUrl: '/start-relationship' });
    expect(await screen.findByText('رابطه‌تان را آغاز کنید.')).toBeTruthy();
    expect(screen.getByText('اگر همراهتان هنوز RelTime Mobile ندارد')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'ساختن رابطه‌ی تازه' }));
    await waitFor(() => expect(result.getPathname()).toBe('/start-relationship/create'));
    expect(screen.getByTestId('create-relationship')).toBeTruthy();

    act(() => router.back());
    fireEvent.press(await screen.findByRole('button', { name: 'پیوستن با کد دعوت' }));
    await waitFor(() => expect(result.getPathname()).toBe('/start-relationship/join'));
    expect(screen.getByTestId('join-relationship')).toBeTruthy();
  });

  it('tells a user whose partner ended the relationship', async () => {
    client = newClient(Infinity);
    seedSession(client, {
      me: testMe({
        relationship: { id: 'RLT-4K7Q-92MD', status: 'ended', endedBy: 'partner' },
        onboardingCompletedAt: '2026-09-01T10:00:00.000Z',
      }),
      localStep: 'done',
    });
    renderRouter(routes, { initialUrl: '/start-relationship' });
    expect(await screen.findByTestId('relationship-ended-notice')).toHaveTextContent(
      /همراهتان رابطه را پایان داد/
    );
  });
});

describe('create screen', () => {
  function renderCreate(date: [number, number, number]) {
    client = newClient();
    return render(
      <QueryClientProvider client={client}>
        <TestProviders tone="light">
          <CreateRelationshipScreen
            initial={{ date, hour: 20, minute: 0, timeZone: 'Asia/Tehran' }}
          />
        </TestProviders>
      </QueryClientProvider>
    );
  }

  it('keeps the date when the calendar switches from Jalali to Gregorian', () => {
    renderCreate([2021, 3, 14]);
    expect(screen.getByTestId('start-date-value')).toHaveTextContent('۲۴ اسفند ۱۳۹۹');
    expect(screen.getByTestId('start-time-value')).toHaveTextContent('۲۰:۰۰');
    expect(screen.getByTestId('start-zone-value')).toHaveTextContent('تهران · UTC+۰۳:۳۰');

    fireEvent.press(screen.getByTestId('calendar-gregorian'));
    expect(screen.getByTestId('start-date-value')).toHaveTextContent('۱۴ مارس ۲۰۲۱');
    fireEvent.press(screen.getByTestId('calendar-jalali'));
    expect(screen.getByTestId('start-date-value')).toHaveTextContent('۲۴ اسفند ۱۳۹۹');
  });

  it('steps dates in the chosen calendar', () => {
    // Esfand 1399 has 30 days (a leap year), so 24 → 30 → wraps to 1.
    expect(stepDate([2021, 3, 14], 'day', 6, 'jalali')).toEqual([2021, 3, 20]);
    expect(stepDate([2021, 3, 20], 'day', 1, 'jalali')).toEqual([2021, 2, 19]);
    // Jan 31 → Feb clamps to the 28th.
    expect(stepDate([2023, 1, 31], 'month', 1, 'gregorian')).toEqual([2023, 2, 28]);
  });

  it('disables «ساختن رابطه» for a date in the future', () => {
    const today = todayIn('Asia/Tehran');
    renderCreate(today);
    expect(screen.getByTestId('create-submit')).not.toBeDisabled();
    expect(screen.queryByTestId('start-future')).toBeNull();

    fireEvent.press(screen.getByTestId('start-date'));
    fireEvent.press(screen.getByRole('button', { name: 'افزایش سال' }));
    expect(screen.getByTestId('create-submit')).toBeDisabled();
    expect(screen.getByTestId('start-future')).toHaveTextContent(
      'تاریخ آغاز نمی‌تواند در آینده باشد.'
    );
  });

  it("defaults to today in the phone's zone", () => {
    client = newClient();
    render(
      <QueryClientProvider client={client}>
        <TestProviders tone="light">
          <CreateRelationshipScreen />
        </TestProviders>
      </QueryClientProvider>
    );
    expect(screen.getByTestId('create-submit')).not.toBeDisabled();
    expect(screen.getByTestId('start-time-value')).toHaveTextContent('۰۰:۰۰');
    expect(todayIn(phoneTimeZone())).toHaveLength(3);
  });
});

describe('invite codes', () => {
  it.each([
    ['7k4p9rm2', '7K4P9RM2'],
    ['7K4P 9RM2', '7K4P9RM2'],
    [' 7k4p-9rm2 ', '7K4P9RM2'],
    ['۷K۴P ۹RM۲', '7K4P9RM2'],
    ['٧k٤p٩rm٢', '7K4P9RM2'],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeInviteCode(input)).toBe(expected);
    expect(codeState(normalizeInviteCode(input))).toBe('complete');
  });

  it('tells incomplete codes from impossible ones', () => {
    expect(codeState('7K4P')).toBe('incomplete');
    expect(codeState('7K4P9RM0')).toBe('malformed');
  });
});

describe('join screen against the mock backend', () => {
  beforeEach(async () => {
    jest.useRealTimers();
    await AsyncStorage.clear();
    await mockStore.reset();
  });

  async function openJoin(phone: string) {
    await signInToMock(phone, 'relationship');
    client = newClient();
    return renderRouter(routes, { initialUrl: '/start-relationship/join' });
  }

  async function typeCode(code: string) {
    fireEvent.changeText(await screen.findByTestId('join-code-input'), code);
  }

  it.each([
    ['lowercase', '7k4p9rm2'],
    ['spaced', '7K4P 9RM2'],
    ['Persian digits', '۷K۴P ۹RM۲'],
  ])('previews the relationship for a %s code, then joins it', async (_, code) => {
    await openJoin('+989351110001');
    await typeCode(code);
    const preview = await screen.findByTestId('join-preview', {}, { timeout: 4000 });
    expect(preview).toHaveTextContent(/^رابطه با محمد · از ۲۴ اسفند ۱۳۹۹ · ۵ سال و ۶ ماه/);
    expect(preview).toHaveTextContent(
      /با پیوستن، حال، یادداشت‌ها و مناسبت‌ها میان شما دو نفر مشترک می‌شود/
    );
    expect(screen.getByTestId('join-submit')).not.toBeDisabled();
  });

  it('joins with «پیوستن به رابطه» and moves on', async () => {
    const result = await openJoin('+989351110002');
    await typeCode('7k4p9rm2');
    await screen.findByTestId('join-preview', {}, { timeout: 4000 });
    fireEvent.press(screen.getByTestId('join-submit'));
    await waitFor(() => expect(result.getPathname()).toBe('/ready'), { timeout: 4000 });
    expect(await AsyncStorage.getItem('zape.onboarding.step')).toBe('ready');
  });

  it('explains a code that does not exist, without a preview', async () => {
    await openJoin('+989351110003');
    await typeCode('ZZZZ ZZZZ');
    expect(await screen.findByTestId('join-error', {}, { timeout: 4000 })).toHaveTextContent(
      'کدی با این نویسه‌ها پیدا نشد. دوباره بررسی کنید.'
    );
    expect(screen.queryByTestId('join-preview')).toBeNull();
    expect(screen.getByTestId('join-submit')).toBeDisabled();
  });

  it('rejects impossible characters without asking the backend', async () => {
    await openJoin('+989351110004');
    await typeCode('OOOOIIII');
    expect(screen.getByTestId('join-error')).toHaveTextContent(/پیدا نشد/);
  });

  it('explains an expired code', async () => {
    const state = await mockStore.load();
    mockRelationships(state).invites[MOCK_JOINABLE_CODE]!.expiresAt = Date.now() - 1;
    await mockStore.save();
    await openJoin('+989351110005');
    await typeCode(MOCK_JOINABLE_CODE);
    expect(await screen.findByTestId('join-error', {}, { timeout: 4000 })).toHaveTextContent(
      'این کد منقضی شده است. از همراهتان کد تازه بخواهید.'
    );
  });

  it('explains a used code', async () => {
    await signInToMock('+989351110006');
    await acceptInvite(getApiClient(), MOCK_JOINABLE_CODE);
    await openJoin('+989351110007');
    await typeCode(MOCK_JOINABLE_CODE);
    expect(await screen.findByTestId('join-error', {}, { timeout: 4000 })).toHaveTextContent(
      'این کد پیش‌تر استفاده شده است. از همراهتان کد تازه بخواهید.'
    );
  });

  it('refuses to join while in another relationship', async () => {
    await openJoin(MOCK_SEED_PHONE);
    await typeCode(MOCK_JOINABLE_CODE);
    await screen.findByTestId('join-preview', {}, { timeout: 4000 });
    fireEvent.press(screen.getByTestId('join-submit'));
    expect(await screen.findByTestId('join-error', {}, { timeout: 4000 })).toHaveTextContent(
      'شما در رابطه‌ی دیگری هستید. اول آن را از «بیشتر» پایان دهید.'
    );
  });

  it('goes back to the choice with «کد ندارم»', async () => {
    client = newClient(Infinity);
    seedSession(client, { me: testMe(), localStep: 'relationship' });
    const result = renderRouter(routes, { initialUrl: '/start-relationship/join' });
    fireEvent.press(await screen.findByText('کد ندارم'));
    await waitFor(() => expect(result.getPathname()).toBe('/start-relationship'));
  });
});
