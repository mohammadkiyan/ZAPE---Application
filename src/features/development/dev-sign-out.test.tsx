import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { mockStore } from '@/api/mock';
import { sessionStore } from '@/features/auth/session-store';
import { localStepStore } from '@/features/onboarding/local-step';
import { signInToMock } from '@/testing/mock-session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { DevSignOutButton } from './dev-sign-out';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const runtime = globalThis as unknown as { __DEV__: boolean };

describe('DevSignOutButton', () => {
  const dev = runtime.__DEV__;
  let client: QueryClient;
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>
        <TestProviders>{children}</TestProviders>
      </QueryClientProvider>
    );
  }

  beforeEach(async () => {
    setTestLocale('en');
    await mockStore.reset();
    client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  });
  afterEach(() => {
    runtime.__DEV__ = dev;
    client.clear();
  });

  it('signs this phone out and drops the onboarding resume point', async () => {
    runtime.__DEV__ = true;
    await signInToMock('+989351112233');
    client.setQueryData(['me'], { stale: true });
    const result = render(<DevSignOutButton />, { wrapper: Wrapper });

    fireEvent.press(result.getByText('Sign out (development)'));

    await waitFor(() => expect(sessionStore.getState().status).toBe('signed-out'));
    expect(sessionStore.getState().credential).toBeUndefined();
    expect(localStepStore.getState().step).toBeNull();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it('is excluded from release builds', () => {
    runtime.__DEV__ = false;
    const result = render(<DevSignOutButton />, { wrapper: Wrapper });
    expect(result.queryByTestId('dev-sign-out')).toBeNull();
  });
});
