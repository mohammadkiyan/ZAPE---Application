import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { reloadAppAsync } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { preferencesStore } from '@/preferences/preferences';
import { AppHydrationGate } from '@/providers/app-providers';
import { setTestLocale } from '@/testing/test-providers';
import { ONBOARDING_STEP_KEY, localStepStore } from './local-step';
import { WelcomeScreen } from './welcome-screen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => undefined),
  hideAsync: jest.fn(async () => undefined),
}));
jest.mock('expo', () => ({ reloadAppAsync: jest.fn(async () => undefined) }));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderWelcome() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <AppHydrationGate>
        <WelcomeScreen />
      </AppHydrationGate>
    </SafeAreaProvider>
  );
}

describe('Welcome', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    localStepStore.setState({ step: null, hydrated: true });
    preferencesStore.setState({ hydrated: true, locale: 'fa', clockTheme: 'constellation' });
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    await setTestLocale('fa');
  });

  it('preselects Persian and continues to the Account step without a reload', async () => {
    renderWelcome();
    expect(await screen.findByText('زمان مشترک شما، همیشه پیش روی شما.')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'فارسی' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'English' })).not.toBeChecked();
    expect(screen.getByTestId('time-dial', { includeHiddenElements: true })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'ادامه' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/sign-in'));
    expect(reloadAppAsync).not.toHaveBeenCalled();
    expect(preferencesStore.getState().locale).toBe('fa');
    expect(await AsyncStorage.getItem(ONBOARDING_STEP_KEY)).toBe('account');
  });

  it('does not apply the language until Continue', async () => {
    renderWelcome();
    fireEvent.press(await screen.findByRole('radio', { name: 'English' }));
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Continue in English' })).toBeTruthy();
    expect(preferencesStore.getState().locale).toBe('fa');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('saves English, writes the resume step before reloading left-to-right', async () => {
    renderWelcome();
    fireEvent.press(await screen.findByRole('radio', { name: 'English' }));
    fireEvent.press(screen.getByRole('button', { name: 'Continue in English' }));

    await waitFor(() => expect(reloadAppAsync).toHaveBeenCalled());
    expect(preferencesStore.getState().locale).toBe('en');
    expect(mockPush).not.toHaveBeenCalled();

    const writes = jest.mocked(AsyncStorage.setItem).mock.invocationCallOrder;
    const calls = jest.mocked(AsyncStorage.setItem).mock.calls.map(([key]) => key);
    const stepWrite = writes[calls.indexOf(ONBOARDING_STEP_KEY)]!;
    expect(stepWrite).toBeLessThan(writes[calls.indexOf('zape.locale')]!);
    expect(stepWrite).toBeLessThan(jest.mocked(reloadAppAsync).mock.invocationCallOrder[0]!);
    expect(await AsyncStorage.getItem(ONBOARDING_STEP_KEY)).toBe('account');
  });
});
