import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Slot, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text } from 'react-native';
import MainLayout from '@/app/(main)/_layout';
import TabsLayout from '@/app/(main)/(tabs)/_layout';
import Home from '@/app/(main)/(tabs)/index';
import RelClock from '@/app/(main)/(tabs)/clock';
import Status from '@/app/(main)/(tabs)/status';
import Note from '@/app/(main)/(tabs)/note';
import More from '@/app/(main)/(tabs)/more';
import { preferencesStore } from '@/preferences/preferences';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { SecondaryScreen } from './screen-header';

function TestRoot() {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  return (
    <QueryClientProvider client={client}>
      <TestProviders tone="stored">
        <Slot />
      </TestProviders>
    </QueryClientProvider>
  );
}

function Devices() {
  return (
    <SecondaryScreen title="Devices" origin="more">
      <Text>device list</Text>
    </SecondaryScreen>
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
  '(main)/devices': Devices,
};

describe('navigation shell', () => {
  beforeEach(async () => {
    preferencesStore.setState({ clockTheme: 'constellation', background: 'auto' });
    await setTestLocale('fa');
  });

  it('opens on the Home tab', async () => {
    const result = renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByTestId('tab-screen-home')).toBeTruthy());
    expect(result.getPathname()).toBe('/');
    expect(screen.getByRole('tab', { name: 'خانه' })).toBeSelected();
  });

  it('switches tabs and moves the active indicator', async () => {
    const result = renderRouter(routes, { initialUrl: '/' });
    fireEvent.press(await screen.findByRole('tab', { name: 'حال' }));
    await waitFor(() => expect(result.getPathname()).toBe('/status'));
    expect(screen.getByRole('tab', { name: 'حال' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'خانه' })).not.toBeSelected();
  });

  it('keeps the tab bar over a secondary screen with its origin highlighted, and goes back', async () => {
    const result = renderRouter(routes, { initialUrl: '/more' });
    await screen.findByTestId('tab-screen-more');
    act(() => router.push({ pathname: '/devices', params: { origin: 'more' } } as never));

    await waitFor(() => expect(screen.getByText('device list')).toBeTruthy());
    expect(screen.getByRole('tab', { name: 'بیشتر' })).toBeSelected();
    const back = screen.getByTestId('screen-back');
    expect(back.props.accessibilityLabel).toBe('بازگشت به بیشتر');
    expect(within(back).getByText('بیشتر')).toBeTruthy();

    fireEvent.press(back);
    await waitFor(() => expect(result.getPathname()).toBe('/more'));
  });

  it('restyles the whole app when a theme is picked on Rel Clock', async () => {
    const result = renderRouter(routes, { initialUrl: '/clock' });
    fireEvent.press(await screen.findByText('چینی'));
    await waitFor(() => expect(screen.getByTestId('tone-light')).toBeTruthy());
    fireEvent.press(screen.getByRole('tab', { name: 'خانه' }));
    await waitFor(() => expect(result.getPathname()).toBe('/'));
    const home = screen.getByTestId('tab-screen-home');
    expect(
      within(home).getByTestId('backdrop-plain', { includeHiddenElements: true })
    ).toBeTruthy();
  });
});
