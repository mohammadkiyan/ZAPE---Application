import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { requestOtp, verifyOtp } from '@/api/endpoints/auth';
import { MOCK_OTP_CODE, mockStore } from '@/api/mock';
import { runPartnerControl } from '@/api/mock/partner-controls';
import { ONBOARDING_STEP_KEY, localStepStore } from '@/features/onboarding/local-step';
import { installSession } from './session-bridge';
import { sessionStore } from './session-store';
import { ME_QUERY_KEY, fetchMe } from './use-me';

const mockSecure = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecure.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockSecure.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockSecure.delete(key)),
}));

async function signIn(phoneNumber = '+989351112233') {
  const { flowId } = await requestOtp(getApiClient(), { phoneNumber });
  const { session } = await verifyOtp(getApiClient(), { flowId, code: MOCK_OTP_CODE });
  await sessionStore.getState().setCredential(session);
  return session;
}

describe('session lifecycle against the mock backend', () => {
  let queryClient: QueryClient;
  let uninstall: () => void;

  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.reset();
    mockSecure.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } },
    });
    uninstall = installSession(queryClient);
  });
  afterEach(() => {
    uninstall();
    queryClient.clear();
  });

  it('sends the access token and silently refreshes it when it expires', async () => {
    const first = await signIn();
    expect((await fetchMe(queryClient)).user.phoneNumber).toBe('+989351112233');

    await runPartnerControl('auth.expire-access-token');
    expect((await fetchMe(queryClient)).user.phoneNumber).toBe('+989351112233');
    const rotated = sessionStore.getState().credential!;
    expect(rotated.accessToken).not.toBe(first.accessToken);
    expect(JSON.parse(mockSecure.get('zape.session')!)).toEqual(rotated);
    expect(sessionStore.getState().status).toBe('signed-in');
  });

  it('leaves no cached account data, token or resume point after a 401', async () => {
    await signIn();
    await localStepStore.getState().setStep('ready');
    await fetchMe(queryClient);
    expect(queryClient.getQueryData(ME_QUERY_KEY)).toBeDefined();

    await runPartnerControl('auth.expire-session');
    // Clearing the cache cancels the in-flight fetch: the caller gets an error, never stale data.
    await expect(fetchMe(queryClient)).rejects.toBeDefined();

    expect(queryClient.getQueryData(ME_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(sessionStore.getState()).toMatchObject({ status: 'signed-out', credential: undefined });
    expect(mockSecure.has('zape.session')).toBe(false);
    expect(await AsyncStorage.getItem(ONBOARDING_STEP_KEY)).toBeNull();
  });
});
