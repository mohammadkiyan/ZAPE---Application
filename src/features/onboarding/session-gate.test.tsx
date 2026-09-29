import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text } from 'react-native';
import MainLayout from '@/app/(main)/_layout';
import TabsLayout from '@/app/(main)/(tabs)/_layout';
import Home from '@/app/(main)/(tabs)/index';
import Note from '@/app/(main)/(tabs)/note';
import OnboardingLayout from '@/app/(onboarding)/_layout';
import * as authEndpoints from '@/api/endpoints/auth';
import { sessionStore } from '@/features/auth/session-store';
import { preferencesStore } from '@/preferences/preferences';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { seedOnboarded, seedSession, testMe } from '@/testing/session';
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
  '(main)/(tabs)/note': Note,
  '(onboarding)/_layout': OnboardingLayout,
  '(onboarding)/welcome': () => <Text>welcome screen</Text>,
  '(onboarding)/sign-in': () => <Text>sign-in screen</Text>,
  '(onboarding)/name': () => <Text>name screen</Text>,
  '(onboarding)/ready': () => <Text>ready screen</Text>,
};

describe('session gate', () => {
  beforeEach(async () => {
    client = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false, staleTime: Infinity } },
    });
    await setTestLocale('fa');
  });
  afterEach(() => client.clear());

  it('shows Welcome to a signed-out user who opens the Note tab, then opens it after sign-in', async () => {
    seedSession(client, { me: null });
    const result = renderRouter(routes, { initialUrl: '/note' });
    expect(await screen.findByText('welcome screen')).toBeTruthy();
    expect(result.getPathname()).toBe('/welcome');
    expect(screen.queryByTestId('tab-screen-note')).toBeNull();

    // Signing in to an account that already finished onboarding releases the deferred link.
    act(() => {
      client.setQueryData(
        ME_QUERY_KEY,
        testMe({ onboardingCompletedAt: '2026-09-01T10:00:00.000Z' })
      );
      sessionStore.setState({
        status: 'signed-in',
        credential: { accessToken: 'a', refreshToken: 'r' },
      });
    });
    await waitFor(() => expect(result.getPathname()).toBe('/note'));
    expect(screen.getByTestId('tab-screen-note')).toBeTruthy();
  });

  it('paints onboarding on the white canvas even with a dark clock theme stored', async () => {
    preferencesStore.setState({ clockTheme: 'constellation' });
    seedSession(client, { me: null });
    renderRouter(routes, { initialUrl: '/welcome' });
    expect(await screen.findByText('welcome screen')).toBeTruthy();
    expect(screen.getByTestId('tone-light')).toBeTruthy();
  });

  it('resumes at the Account step after the Welcome direction reload', async () => {
    seedSession(client, { me: null, localStep: 'account' });
    const result = renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('sign-in screen')).toBeTruthy();
    expect(result.getPathname()).toBe('/sign-in');
  });

  it('keeps signed-out users on Welcome and the Account step', async () => {
    seedSession(client, { me: null });
    const result = renderRouter(routes, { initialUrl: '/ready' });
    expect(await screen.findByText('welcome screen')).toBeTruthy();
    expect(result.getPathname()).toBe('/welcome');
  });

  it('sends a new account from the Account step to the name prompt', async () => {
    seedSession(client, { me: testMe({ name: null }), localStep: 'name' });
    const result = renderRouter(routes, { initialUrl: '/sign-in' });
    expect(await screen.findByText('name screen')).toBeTruthy();
    expect(result.getPathname()).toBe('/name');
  });

  it('sends an onboarded user who opens Welcome to the tabs', async () => {
    seedOnboarded(client);
    const result = renderRouter(routes, { initialUrl: '/welcome' });
    await waitFor(() => expect(screen.getByTestId('tab-screen-home')).toBeTruthy());
    expect(result.getPathname()).toBe('/');
  });

  it('holds a deep link while the account is still loading', async () => {
    seedSession(client, { me: null });
    sessionStore.setState({
      status: 'signed-in',
      credential: { accessToken: 'a', refreshToken: 'r' },
    });
    let release!: () => void;
    const getMe = jest.spyOn(authEndpoints, 'getMe').mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve(testMe({ onboardingCompletedAt: '2026-09-01T10:00:00.000Z' }));
        })
    );
    const result = renderRouter(routes, { initialUrl: '/note' });
    expect(await screen.findByTestId('entry-pending')).toBeTruthy();
    expect(screen.queryByTestId('tab-screen-note')).toBeNull();

    await act(async () => release());
    await waitFor(() => expect(screen.getByTestId('tab-screen-note')).toBeTruthy());
    expect(result.getPathname()).toBe('/note');
    getMe.mockRestore();
  });
});
