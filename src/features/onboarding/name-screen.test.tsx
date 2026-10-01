import type { PropsWithChildren } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as endpoints from '@/api/endpoints/auth';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { testMe } from '@/testing/session';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { localStepStore } from './local-step';
import { NameScreen } from './name-screen';

let client: QueryClient;

function Wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={client}>
      <TestProviders tone="light">{children}</TestProviders>
    </QueryClientProvider>
  );
}

describe('display-name prompt', () => {
  beforeEach(async () => {
    await setTestLocale('fa');
    client = new QueryClient({
      defaultOptions: {
        queries: { gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    localStepStore.setState({ step: 'name', isHydrated: true });
  });
  afterEach(() => jest.restoreAllMocks());

  it('blocks Continue until a non-blank name is entered, then saves it trimmed', async () => {
    const saved = testMe({ name: 'سارا' });
    const updateMe = jest.spyOn(endpoints, 'updateMe').mockResolvedValue(saved);
    render(<NameScreen />, { wrapper: Wrapper });

    const continueButton = () => screen.getByRole('button', { name: 'ادامه' });
    expect(continueButton()).toBeDisabled();
    fireEvent.changeText(screen.getByTestId('name-input'), '   ');
    expect(continueButton()).toBeDisabled();
    fireEvent.press(continueButton());
    expect(updateMe).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId('name-input'), '  سارا ');
    expect(continueButton()).toBeEnabled();
    fireEvent.press(continueButton());

    await waitFor(() => expect(localStepStore.getState().step).toBe('ready'));
    expect(updateMe).toHaveBeenCalledWith(expect.anything(), { name: 'سارا' });
    expect(client.getQueryData(ME_QUERY_KEY)).toEqual(saved);
  });

  it('limits the name to 40 characters', () => {
    render(<NameScreen />, { wrapper: Wrapper });
    expect(screen.getByTestId('name-input').props.maxLength).toBe(40);
    fireEvent.changeText(screen.getByTestId('name-input'), 'x'.repeat(40));
    expect(screen.getByText('نام حداکثر ۴۰ نویسه است.')).toBeTruthy();
  });

  it('shows the Account node without Back or «بعداً»', () => {
    render(<NameScreen />, { wrapper: Wrapper });
    expect(screen.getByLabelText('مرحله ۱ از ۴')).toBeTruthy();
    expect(screen.queryByTestId('onboarding-back')).toBeNull();
    expect(screen.queryByText('بعداً')).toBeNull();
  });
});
