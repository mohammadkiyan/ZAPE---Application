import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { reloadAppAsync } from 'expo';
import { preferencesStore } from '@/preferences/preferences';
import { AppHydrationGate } from './app-providers';

jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => undefined),
  hideAsync: jest.fn(async () => undefined),
}));
jest.mock('expo', () => ({ reloadAppAsync: jest.fn(async () => undefined) }));
jest.mock('nativewind', () => ({ useColorScheme: () => ({ setColorScheme: jest.fn() }) }));
jest.mock('expo-router/react-navigation', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

describe('app hydration gate', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    preferencesStore.setState({ hydrated: false, locale: 'fa', theme: 'system' });
    Object.defineProperty(I18nManager, 'isRTL', { value: true, configurable: true });
    jest.clearAllMocks();
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
