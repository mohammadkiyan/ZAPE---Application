import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { reloadAppAsync } from 'expo';
import { preferencesStore } from '@/preferences/preferences';
import { useFonts } from 'expo-font';
import { AppHydrationGate } from './app-providers';

jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => undefined),
  hideAsync: jest.fn(async () => undefined),
}));
jest.mock('expo', () => ({ reloadAppAsync: jest.fn(async () => undefined) }));
jest.mock('expo-router/react-navigation', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

describe('app hydration gate', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    preferencesStore.setState({
      hydrated: false,
      locale: 'fa',
      clockTheme: 'constellation',
      background: 'auto',
    });
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    jest.clearAllMocks();
    jest.mocked(useFonts).mockReturnValue([true, null]);
    jest.mocked(reloadAppAsync).mockResolvedValue(undefined);
  });

  it('releases the splash only after preferences hydrate and fonts load', async () => {
    const result = await render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(result.getByText('ready child')).toBeTruthy());
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('keeps the splash until registered hydration tasks settle, even when one fails', async () => {
    let finish!: () => void;
    const slow = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const failing = jest.fn(async () => Promise.reject(new Error('keychain locked')));
    const result = render(
      <AppHydrationGate hydrationTasks={[slow, failing]}>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(preferencesStore.getState().hydrated).toBe(true));
    expect(slow).toHaveBeenCalledTimes(1);
    expect(result.queryByText('ready child')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

    await act(async () => finish());
    await waitFor(() => expect(result.getByText('ready child')).toBeTruthy());
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('loads the bundled Noto Sans Arabic and Inter weights before hiding the splash', async () => {
    jest.mocked(useFonts).mockReturnValue([false, null]);
    const result = render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(preferencesStore.getState().hydrated).toBe(true));
    expect(Object.keys(jest.mocked(useFonts).mock.calls[0]![0] as object).sort()).toEqual([
      'Inter',
      'Inter-Medium',
      'Inter-SemiBold',
      'NotoSansArabic',
      'NotoSansArabic-Medium',
      'NotoSansArabic-SemiBold',
    ]);
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    expect(result.queryByText('ready child')).toBeNull();

    jest.mocked(useFonts).mockReturnValue([true, null]);
    result.rerender(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(result.getByText('ready child')).toBeTruthy());
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('applies the stored clock theme tone', async () => {
    preferencesStore.setState({ hydrated: true, clockTheme: 'porcelain' });
    const result = render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(result.getByTestId('tone-light')).toBeTruthy());
  });

  it('reloads when the hydrated locale needs the opposite native direction', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    const result = await render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(reloadAppAsync).toHaveBeenCalled());
    expect(result.queryByText('ready child')).toBeNull();
  });

  it('releases the splash with a usable fallback if native reload fails', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    jest.mocked(reloadAppAsync).mockRejectedValueOnce(new Error('reload unavailable'));
    const result = await render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(result.getByText('ready child')).toBeTruthy());
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('does not reload forever when a native direction change cannot take effect', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    await AsyncStorage.setItem('zape.direction-reload-attempt', 'rtl');
    const result = render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(result.getByText('ready child')).toBeTruthy());
    expect(reloadAppAsync).not.toHaveBeenCalled();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('allows another direction attempt after switching to a matching locale', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    await AsyncStorage.setItem('zape.direction-reload-attempt', 'rtl');
    const result = render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(result.getByText('ready child')).toBeTruthy());

    act(() => preferencesStore.setState({ locale: 'en' }));
    await waitFor(async () => {
      expect(await AsyncStorage.getItem('zape.direction-reload-attempt')).toBeNull();
    });
    act(() => preferencesStore.setState({ locale: 'fa' }));
    await waitFor(() => expect(reloadAppAsync).toHaveBeenCalledTimes(1));
  });

  it('does not reload for an obsolete locale while storage is pending', async () => {
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    preferencesStore.setState({ hydrated: true });
    let resolveStorage!: (value: string | null) => void;
    const pendingStorage = new Promise<string | null>((resolve) => {
      resolveStorage = resolve;
    });
    const getItem = jest
      .spyOn(AsyncStorage, 'getItem')
      .mockImplementation((key) =>
        key === 'zape.direction-reload-attempt' ? pendingStorage : Promise.resolve(null)
      );
    render(
      <AppHydrationGate>
        <Text>ready child</Text>
      </AppHydrationGate>
    );
    await waitFor(() => expect(getItem).toHaveBeenCalledWith('zape.direction-reload-attempt'));
    act(() => preferencesStore.setState({ locale: 'en' }));
    await act(async () => resolveStorage(null));
    await waitFor(() => expect(AsyncStorage.removeItem).toHaveBeenCalled());
    expect(reloadAppAsync).not.toHaveBeenCalled();
    getItem.mockRestore();
  });
});
