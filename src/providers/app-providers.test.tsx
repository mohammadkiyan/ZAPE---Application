import { render, waitFor } from '@testing-library/react-native';
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
  beforeEach(() => {
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
});
