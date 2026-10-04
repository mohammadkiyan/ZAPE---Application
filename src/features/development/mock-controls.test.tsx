import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { mockStore, type MockState } from '@/api/mock';
import { registerPartnerControl } from '@/api/mock/partner-controls';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { MockControlsSheet, MockDataFooter } from './mock-controls';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  return (
    <QueryClientProvider client={client}>
      <TestProviders>{children}</TestProviders>
    </QueryClientProvider>
  );
}

const runtime = globalThis as unknown as { __DEV__: boolean };

describe('mock tools', () => {
  const dev = runtime.__DEV__;
  beforeEach(() => setTestLocale('en'));
  afterEach(() => {
    runtime.__DEV__ = dev;
  });

  it('shows the Mock data marker in development against the mock', () => {
    runtime.__DEV__ = true;
    const result = render(<MockDataFooter backend="mock" />, { wrapper: Wrapper });
    fireEvent.press(result.getByText('Mock data'));
    expect(mockPush).toHaveBeenCalledWith('/dev/mock-controls');
  });

  it('is excluded from release builds', () => {
    runtime.__DEV__ = false;
    const result = render(
      <>
        <MockDataFooter backend="mock" />
        <MockControlsSheet backend="mock" />
      </>,
      { wrapper: Wrapper }
    );
    expect(result.queryByTestId('mock-data-marker')).toBeNull();
    expect(result.queryByTestId('mock-controls')).toBeNull();
  });

  it('is hidden when a real backend is configured', () => {
    runtime.__DEV__ = true;
    const result = render(<MockDataFooter backend="real" />, { wrapper: Wrapper });
    expect(result.queryByTestId('mock-data-marker')).toBeNull();
  });

  it('runs registered partner controls against the mock state', async () => {
    runtime.__DEV__ = true;
    const run = jest.fn((state: MockState) => {
      state.partnerNote = 'hello';
    });
    // A label of its own: the real status and note controls are registered too.
    registerPartnerControl({
      id: 'test-partner-action',
      label: { fa: 'اقدام آزمایشی همراه', en: 'Partner test action' },
      run,
    });
    const result = render(<MockControlsSheet backend="mock" />, { wrapper: Wrapper });
    // The three controls of add-status-and-notes are listed for the developer.
    expect(result.getByText('Partner sets a status')).toBeTruthy();
    expect(result.getByText('Partner leaves a note')).toBeTruthy();
    expect(result.getByText('Partner reads my note')).toBeTruthy();
    fireEvent.press(result.getByText('Partner test action'));
    await waitFor(() => expect(run).toHaveBeenCalled());
    expect((await mockStore.load()).partnerNote).toBe('hello');

    fireEvent.press(result.getByText('Reset mock data'));
    await waitFor(() => expect(result.getByText('Mock data was reset.')).toBeTruthy());
    expect((await mockStore.load()).partnerNote).toBeUndefined();
  });

  it('shows the fixed mock sign-in code and the session controls', () => {
    runtime.__DEV__ = true;
    const result = render(<MockControlsSheet backend="mock" />, { wrapper: Wrapper });
    expect(result.getByTestId('mock-otp-code')).toHaveTextContent('Mock sign-in code: 000000');
    expect(result.getByText('Expire my session')).toBeTruthy();
    expect(result.getByText('Expire my access token')).toBeTruthy();
  });
});
