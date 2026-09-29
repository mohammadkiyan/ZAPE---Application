import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from '@/app/(main)/_layout';
import TabsLayout from '@/app/(main)/(tabs)/_layout';
import Home from '@/app/(main)/(tabs)/index';
import Note from '@/app/(main)/(tabs)/note';
import OnboardingLayout from '@/app/(onboarding)/_layout';
import Name from '@/app/(onboarding)/name';
import Ready from '@/app/(onboarding)/ready';
import SignIn from '@/app/(onboarding)/sign-in';
import Welcome from '@/app/(onboarding)/welcome';
import { MOCK_OTP_CODE, mockStore } from '@/api/mock';
import { runPartnerControl } from '@/api/mock/partner-controls';
import { SessionBridge } from '@/features/auth/session-bridge';
import { sessionStore } from '@/features/auth/session-store';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { preferencesStore } from '@/preferences/preferences';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { localStepStore } from './local-step';

const mockSecure = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecure.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockSecure.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockSecure.delete(key)),
}));

let client: QueryClient;

function TestRoot() {
  return (
    <QueryClientProvider client={client}>
      <SessionBridge>
        <TestProviders tone="stored">
          <Slot />
        </TestProviders>
      </SessionBridge>
    </QueryClientProvider>
  );
}

const routes = {
  _layout: TestRoot,
  '(main)/_layout': MainLayout,
  '(main)/(tabs)/_layout': TabsLayout,
  '(main)/(tabs)/index': Home,
  '(main)/(tabs)/note': Note,
  '(onboarding)/_layout': OnboardingLayout,
  '(onboarding)/welcome': Welcome,
  '(onboarding)/sign-in': SignIn,
  '(onboarding)/name': Name,
  '(onboarding)/ready': Ready,
};

/** A cold start: new query cache, session and resume point read back from storage. */
async function launch(initialUrl = '/') {
  client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  sessionStore.setState({ status: 'unknown', credential: undefined });
  localStepStore.setState({ step: null, hydrated: false });
  await act(async () => {
    await Promise.all([sessionStore.getState().hydrate(), localStepStore.getState().hydrate()]);
  });
  return renderRouter(routes, { initialUrl });
}

async function signUpToName(phone: string) {
  fireEvent.press(await screen.findByRole('button', { name: 'ادامه' }));
  fireEvent.changeText(await screen.findByTestId('phone-input'), phone);
  fireEvent.press(screen.getByRole('button', { name: 'دریافت کد ورود' }));
  fireEvent.changeText(
    await screen.findByTestId('code-input', {}, { timeout: 3000 }),
    MOCK_OTP_CODE
  );
  fireEvent.press(screen.getByRole('button', { name: 'ورود' }));
  await screen.findByTestId('name-step', {}, { timeout: 4000 });
}

describe('onboarding against the mock backend', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.reset();
    mockSecure.clear();
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    preferencesStore.setState({ hydrated: true, locale: 'fa', clockTheme: 'constellation' });
    await setTestLocale('fa');
  });
  afterEach(() => client.clear());

  it('signs up, names the account, finishes on Ready and lands on Home', async () => {
    const result = await launch();
    expect(await screen.findByTestId('welcome')).toBeTruthy();

    await signUpToName('09351112233');
    expect(result.getPathname()).toBe('/name');
    expect(JSON.parse(mockSecure.get('zape.session')!)).toHaveProperty('refreshToken');

    fireEvent.changeText(screen.getByTestId('name-input'), 'سارا');
    fireEvent.press(screen.getByRole('button', { name: 'ادامه' }));
    expect(await screen.findByTestId('ready', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('همه‌چیز آماده است.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'مشاهده زمان ما' }));
    await waitFor(() => expect(screen.getByTestId('tab-screen-home')).toBeTruthy(), {
      timeout: 4000,
    });
    expect(result.getPathname()).toBe('/');
    expect(await AsyncStorage.getItem('zape.onboarding.step')).toBe('done');
  }, 20_000);

  it('resumes mid-flow after a relaunch, then goes back to Welcome when the session expires', async () => {
    const first = await launch();
    await signUpToName('09351112244');
    first.unmount();

    const relaunched = await launch();
    expect(await screen.findByTestId('name-step', {}, { timeout: 4000 })).toBeTruthy();
    expect(relaunched.getPathname()).toBe('/name');

    await act(async () => {
      await runPartnerControl('auth.expire-session');
      // Not awaited: renderRouter fakes timers, so the mock latency only advances inside findBy.
      void client.invalidateQueries({ queryKey: ME_QUERY_KEY });
    });
    expect(await screen.findByTestId('welcome', {}, { timeout: 4000 })).toBeTruthy();
    expect(sessionStore.getState().status).toBe('signed-out');
    expect(mockSecure.has('zape.session')).toBe(false);
    expect(preferencesStore.getState().locale).toBe('fa');
  }, 20_000);

  it('takes a returning account on a new phone straight to Home', async () => {
    const result = await launch();
    fireEvent.press(await screen.findByRole('button', { name: 'ادامه' }));
    fireEvent.changeText(await screen.findByTestId('phone-input'), '09121234567');
    fireEvent.press(screen.getByRole('button', { name: 'دریافت کد ورود' }));
    fireEvent.changeText(
      await screen.findByTestId('code-input', {}, { timeout: 3000 }),
      MOCK_OTP_CODE
    );
    fireEvent.press(screen.getByRole('button', { name: 'ورود' }));
    await waitFor(() => expect(screen.getByTestId('tab-screen-home')).toBeTruthy(), {
      timeout: 4000,
    });
    expect(result.getPathname()).toBe('/');
    expect(screen.queryByTestId('name-step')).toBeNull();
  }, 20_000);
});
