import type { PropsWithChildren } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as endpoints from '@/api/endpoints/auth';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { formatDate } from '@/localization/format';
import { seedSession, testMe } from '@/testing/session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { localStepStore } from './local-step';
import { ReadyScreen } from './ready-screen';
import { ONBOARDING_STEPS, registerOnboardingStep } from './steps';
import { deferDeepLink, takeDeferredLink } from './use-entry';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

let client: QueryClient;

function Wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={client}>
      <TestProviders tone="light">{children}</TestProviders>
    </QueryClientProvider>
  );
}

/** Stand-ins for the steps the later changes register. */
function registerLaterSteps({ device }: { device: boolean }) {
  registerOnboardingStep({
    id: 'relationship',
    order: 20,
    progress: 2,
    route: '/' as never,
    mandatory: true,
    isComplete: () => true,
    summary: ({ locale }) => ({
      id: 'relationship',
      label: 'رابطه',
      value: `از ${formatDate([2021, 3, 14], locale)}`,
    }),
  });
  registerOnboardingStep({
    id: 'device',
    order: 30,
    progress: 3,
    route: '/' as never,
    mandatory: false,
    isComplete: () => device,
    summary: () => (device ? { id: 'device', label: 'RelTime', value: 'اتاق نشیمن' } : null),
  });
  registerOnboardingStep({
    id: 'thread',
    order: 50,
    progress: 4,
    route: '/' as never,
    mandatory: false,
    isComplete: () => true,
    summary: () => ({ id: 'thread', label: 'رشته‌ی ما', value: 'اولین مهره، امروز', kind: 'chip' }),
  });
}

describe('Ready', () => {
  const original = [...ONBOARDING_STEPS];

  beforeEach(async () => {
    await setTestLocale('fa');
    client = new QueryClient({
      defaultOptions: {
        queries: { gcTime: Infinity, staleTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    seedSession(client, {
      me: testMe({ relationship: { id: 'r1', status: 'active' } }),
      localStep: 'ready',
    });
    mockReplace.mockClear();
  });
  afterEach(() => {
    ONBOARDING_STEPS.splice(0, ONBOARDING_STEPS.length, ...original);
    jest.restoreAllMocks();
  });

  it('with a device: the connection headline and every applicable row', () => {
    registerLaterSteps({ device: true });
    render(<ReadyScreen />, { wrapper: Wrapper });
    expect(screen.getByText('اتصال انجام شد.')).toBeTruthy();
    expect(screen.getByText('RelTime و این گوشی آماده‌اند.')).toBeTruthy();
    expect(screen.getByTestId('ready-row-relationship')).toHaveTextContent(/از ۲۴ اسفند ۱۳۹۹/);
    expect(screen.getByTestId('ready-row-device')).toHaveTextContent(/اتاق نشیمن/);
    expect(screen.getByTestId('ready-row-thread')).toHaveTextContent(/اولین مهره، امروز/);
    expect(screen.getByLabelText('راه‌اندازی کامل شد')).toBeTruthy();
  });

  it('without a device: the phone-only headline and no RelTime row', () => {
    registerLaterSteps({ device: false });
    render(<ReadyScreen />, { wrapper: Wrapper });
    expect(screen.getByText('همه‌چیز آماده است.')).toBeTruthy();
    expect(screen.getByText('این گوشی آماده است.')).toBeTruthy();
    expect(screen.queryByTestId('ready-row-device')).toBeNull();
    expect(screen.getByTestId('ready-row-relationship')).toBeTruthy();
  });

  it('shows no summary card when no step contributes a row', () => {
    render(<ReadyScreen />, { wrapper: Wrapper });
    expect(screen.queryByTestId('ready-summary')).toBeNull();
  });

  it('records completion, then replaces to Home even with a deferred link', async () => {
    const completed = testMe({ onboardingCompletedAt: '2026-09-29T10:00:00.000Z' });
    const complete = jest.spyOn(endpoints, 'completeOnboarding').mockResolvedValue(completed);
    deferDeepLink('/note' as never);
    render(<ReadyScreen />, { wrapper: Wrapper });
    fireEvent.press(screen.getByRole('button', { name: 'مشاهده زمان ما' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(complete).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(ME_QUERY_KEY)).toEqual(completed);
    expect(localStepStore.getState().step).toBe('done');
    expect(takeDeferredLink()).toBeNull();
  });
});
