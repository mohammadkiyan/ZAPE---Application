import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient, type ApiClient } from '../../client';
import {
  completeOnboarding,
  getMe,
  refreshSession,
  requestOtp,
  updateMe,
  verifyOtp,
} from '../../endpoints/auth';
import { runPartnerControl } from '../partner-controls';
import { createMockFetcher } from '../router';
import { createMockStore } from '../state';
import { mockStore } from '..';
import { MOCK_OTP_CODE, MOCK_SEED_PHONE } from './auth';

const BASE = 'https://mock.zape.invalid/';
const NEW_PHONE = '+989123456789';

function client(store = createMockStore(), accessToken?: string): ApiClient {
  return createApiClient({
    baseUrl: BASE,
    fetcher: createMockFetcher({ baseUrl: BASE, store }),
    getAuthorization: () => (accessToken ? `Bearer ${accessToken}` : null),
  });
}

async function signIn(store: ReturnType<typeof createMockStore>, phoneNumber: string) {
  const { flowId } = await requestOtp(client(store), { phoneNumber });
  return verifyOtp(client(store), { flowId, code: MOCK_OTP_CODE });
}

describe('mock auth backend', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useRealTimers();
  });

  it('creates an account the first time a number verifies, and signs it in again later', async () => {
    const store = createMockStore();
    const first = await signIn(store, NEW_PHONE);
    expect(first.isNewAccount).toBe(true);
    const me = await getMe(client(store, first.session.accessToken));
    expect(me).toMatchObject({
      user: { name: null, phoneNumber: NEW_PHONE },
      relationship: null,
      onboardingCompletedAt: null,
    });

    jest.useFakeTimers({ now: Date.now() + 61_000 });
    const second = await signIn(store, NEW_PHONE);
    expect(second.isNewAccount).toBe(false);
  });

  it('knows the canvas account as an existing, onboarded user', async () => {
    const store = createMockStore();
    const result = await signIn(store, MOCK_SEED_PHONE);
    expect(result.isNewAccount).toBe(false);
    const me = await getMe(client(store, result.session.accessToken));
    expect(me.user.name).toBe('محمد');
    expect(me.onboardingCompletedAt).not.toBeNull();
  });

  it('rejects a wrong code, then invalidates it after five failures', async () => {
    const store = createMockStore();
    const { flowId } = await requestOtp(client(store), { phoneNumber: NEW_PHONE });
    for (let attempt = 1; attempt < 5; attempt++) {
      await expect(verifyOtp(client(store), { flowId, code: '123456' })).rejects.toMatchObject({
        status: 400,
        serverCode: 'otp_invalid',
      });
    }
    await expect(verifyOtp(client(store), { flowId, code: '123456' })).rejects.toMatchObject({
      serverCode: 'otp_attempts_exceeded',
    });
    await expect(verifyOtp(client(store), { flowId, code: MOCK_OTP_CODE })).rejects.toMatchObject({
      serverCode: 'otp_expired',
    });
  });

  it('refuses a resend for 60 seconds and invalidates the previous code afterwards', async () => {
    const start = Date.now();
    jest.useFakeTimers({ now: start });
    const store = createMockStore();
    const first = await requestOtp(client(store), { phoneNumber: NEW_PHONE });
    expect(first).toMatchObject({ resendAfterSec: 60, expiresInSec: 600, channel: 'sms' });
    await expect(requestOtp(client(store), { phoneNumber: NEW_PHONE })).rejects.toMatchObject({
      status: 429,
      serverCode: 'otp_rate_limited',
    });

    jest.setSystemTime(start + 60_000);
    const second = await requestOtp(client(store), { phoneNumber: NEW_PHONE });
    await expect(
      verifyOtp(client(store), { flowId: first.flowId, code: MOCK_OTP_CODE })
    ).rejects.toMatchObject({ serverCode: 'otp_expired' });
    await expect(
      verifyOtp(client(store), { flowId: second.flowId, code: MOCK_OTP_CODE })
    ).resolves.toMatchObject({ isNewAccount: true });
  });

  it('expires a code after 10 minutes', async () => {
    const start = Date.now();
    jest.useFakeTimers({ now: start });
    const store = createMockStore();
    const { flowId } = await requestOtp(client(store), { phoneNumber: NEW_PHONE });
    jest.setSystemTime(start + 600_000);
    await expect(verifyOtp(client(store), { flowId, code: MOCK_OTP_CODE })).rejects.toMatchObject({
      serverCode: 'otp_expired',
    });
  });

  it('rejects an invalid phone number', async () => {
    await expect(
      client().request('auth/otp/request', { method: 'POST', body: { phoneNumber: '0912' } })
    ).rejects.toMatchObject({ status: 400, serverCode: 'phone_invalid' });
  });

  it('saves the display name and records onboarding completion', async () => {
    const store = createMockStore();
    const { session } = await signIn(store, NEW_PHONE);
    const api = client(store, session.accessToken);
    expect((await updateMe(api, { name: '  سارا ' })).user.name).toBe('سارا');
    expect((await store.load()).user.name).toBe('سارا');
    expect((await completeOnboarding(api)).onboardingCompletedAt).not.toBeNull();
  });

  it('answers 401 without a valid session', async () => {
    await expect(getMe(client(createMockStore(), 'forged'))).rejects.toMatchObject({
      status: 401,
      serverCode: 'unauthorised',
    });
  });

  it('asks for a refresh when the access token expires, and rotates the pair', async () => {
    const { session } = await signIn(mockStore, NEW_PHONE);
    await runPartnerControl('auth.expire-access-token');
    await expect(getMe(client(mockStore, session.accessToken))).rejects.toMatchObject({
      status: 401,
      serverCode: 'try_refresh_token',
    });

    const rotated = await refreshSession(client(mockStore), session.refreshToken);
    expect(rotated.accessToken).not.toBe(session.accessToken);
    expect((await getMe(client(mockStore, rotated.accessToken))).user.phoneNumber).toBe(NEW_PHONE);
    await expect(refreshSession(client(mockStore), session.refreshToken)).rejects.toMatchObject({
      status: 401,
    });

    await runPartnerControl('auth.expire-session');
    await expect(getMe(client(mockStore, rotated.accessToken))).rejects.toMatchObject({
      serverCode: 'unauthorised',
    });
    await mockStore.reset();
  });
});
