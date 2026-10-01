import type { PropsWithChildren } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import * as endpoints from '@/api/endpoints/auth';
import { sessionStore } from '@/features/auth/session-store';
import { TestProviders, setTestLocale } from '@/testing/test-providers';
import { localStepStore } from './local-step';
import { AccountScreen } from './account-screen';

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const sent = {
  flowId: 'flow-1',
  channel: 'sms' as const,
  destination: '+989123456789',
  resendAfterSec: 60,
  expiresInSec: 600,
};

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return (
    <QueryClientProvider client={client}>
      <TestProviders tone="light">{children}</TestProviders>
    </QueryClientProvider>
  );
}

async function toCodeStage(phone = '09123456789') {
  render(<AccountScreen />, { wrapper: Wrapper });
  fireEvent.changeText(screen.getByTestId('phone-input'), phone);
  fireEvent.press(screen.getByRole('button', { name: 'دریافت کد ورود' }));
  await screen.findByTestId('code-input');
}

function boxes() {
  return [0, 1, 2, 3, 4, 5].map((i) =>
    screen.getByTestId(`code-box-${i}`, { includeHiddenElements: true })
  );
}

describe('Account step', () => {
  let requestOtp: jest.SpyInstance;
  let verifyOtp: jest.SpyInstance;

  beforeEach(async () => {
    await setTestLocale('fa');
    jest.clearAllMocks();
    requestOtp = jest.spyOn(endpoints, 'requestOtp').mockResolvedValue(sent);
    verifyOtp = jest.spyOn(endpoints, 'verifyOtp');
    sessionStore.setState({ status: 'signed-out', credential: undefined });
    localStepStore.setState({ step: 'account', isHydrated: true });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('says a new number creates an account', () => {
    render(<AccountScreen />, { wrapper: Wrapper });
    expect(screen.getByText('اگر حساب ندارید، با همین شماره ساخته می‌شود.')).toBeTruthy();
  });

  it('normalizes a number typed in Persian digits and names the destination', async () => {
    await toCodeStage('۰۹۱۲ ۳۴۵ ۶۷۸۹');
    expect(requestOtp).toHaveBeenCalledWith(expect.anything(), { phoneNumber: '+989123456789' });
    expect(screen.getByTestId('code-destination')).toHaveTextContent(/\+989123456789/);
  });

  it('does not send an invalid number and explains under the field', () => {
    render(<AccountScreen />, { wrapper: Wrapper });
    fireEvent.changeText(screen.getByTestId('phone-input'), '0912');
    fireEvent.press(screen.getByRole('button', { name: 'دریافت کد ورود' }));
    expect(requestOtp).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/این شماره درست نیست/);
  });

  it('tells the user to wait when the backend rate-limits codes', async () => {
    requestOtp.mockRejectedValueOnce(
      new ApiError('Too many', 'http_error', 429, undefined, { serverCode: 'otp_rate_limited' })
    );
    render(<AccountScreen />, { wrapper: Wrapper });
    fireEvent.changeText(screen.getByTestId('phone-input'), '09123456789');
    fireEvent.press(screen.getByRole('button', { name: 'دریافت کد ورود' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/درخواست کد زیاد بود/);
    expect(screen.queryByTestId('code-input')).toBeNull();
  });

  it('fills all six boxes from a pasted code and enables «ورود»', async () => {
    await toCodeStage();
    const signIn = screen.getByRole('button', { name: 'ورود' });
    expect(signIn).toBeDisabled();
    fireEvent.changeText(screen.getByTestId('code-input'), '318742');
    ['۳', '۱', '۸', '۷', '۴', '۲'].forEach((digit, index) =>
      expect(boxes()[index]).toHaveTextContent(digit)
    );
    expect(screen.getByRole('button', { name: 'ورود' })).toBeEnabled();
  });

  it('accepts a code typed on the Persian keyboard and sends ASCII digits', async () => {
    verifyOtp.mockReturnValue(new Promise(() => undefined));
    await toCodeStage();
    fireEvent.changeText(screen.getByTestId('code-input'), '۳۱۸۷۴۲');
    fireEvent.press(screen.getByRole('button', { name: 'ورود' }));
    await waitFor(() =>
      expect(verifyOtp).toHaveBeenCalledWith(expect.anything(), {
        flowId: 'flow-1',
        code: '318742',
      })
    );
  });

  it('clears the boxes on a wrong code and keeps the number', async () => {
    verifyOtp.mockRejectedValueOnce(
      new ApiError('Wrong', 'http_error', 400, undefined, { serverCode: 'otp_invalid' })
    );
    await toCodeStage();
    fireEvent.changeText(screen.getByTestId('code-input'), '111111');
    fireEvent.press(screen.getByRole('button', { name: 'ورود' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'این کد درست نیست. دوباره امتحان کنید.'
    );
    // The wrong digits are held in the error state while the boxes shake, then cleared.
    expect(boxes()[0]).toHaveTextContent('۱');
    expect(boxes()[0]).toHaveStyle({ borderColor: 'rgba(101, 0, 28, 0.55)' });
    await waitFor(() => expect(screen.getByTestId('code-input').props.value).toBe(''));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ورود' })).toBeDisabled();

    fireEvent.press(screen.getByRole('button', { name: 'تغییر شماره' }));
    expect(screen.getByTestId('phone-input').props.value).toBe('09123456789');
  });

  it('asks for a new code after too many attempts', async () => {
    verifyOtp.mockRejectedValueOnce(
      new ApiError('Nope', 'http_error', 400, undefined, { serverCode: 'otp_attempts_exceeded' })
    );
    await toCodeStage();
    fireEvent.changeText(screen.getByTestId('code-input'), '222222');
    fireEvent.press(screen.getByRole('button', { name: 'ورود' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/کد تازه بگیرید/);
  });

  it('counts the resend cooldown down, then sends a new code', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-29T10:00:00.000Z') });
    await toCodeStage();
    act(() => jest.advanceTimersByTime(18_000));
    const resend = screen.getByTestId('resend-code');
    expect(resend).toBeDisabled();
    expect(resend).toHaveTextContent('ارسال دوباره · ۰:۴۲');

    act(() => jest.advanceTimersByTime(42_000));
    expect(screen.getByTestId('resend-code')).toBeEnabled();
    expect(screen.getByTestId('resend-code')).toHaveTextContent('ارسال دوباره');
    fireEvent.press(screen.getByTestId('resend-code'));
    await waitFor(() => expect(requestOtp).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('کد تازه فرستاده شد.')).toBeTruthy();
  });

  it('stores the session and marks a new account for the name prompt', async () => {
    verifyOtp.mockResolvedValueOnce({
      session: { accessToken: 'a', refreshToken: 'r' },
      isNewAccount: true,
    });
    const setCredential = jest.fn(async () => undefined);
    sessionStore.setState({ setCredential });
    await toCodeStage();
    fireEvent.changeText(screen.getByTestId('code-input'), '000000');
    fireEvent.press(screen.getByRole('button', { name: 'ورود' }));
    await waitFor(() =>
      expect(setCredential).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' })
    );
    expect(localStepStore.getState().step).toBe('name');
  });
});
