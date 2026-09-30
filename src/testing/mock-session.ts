import { getApiClient } from '@/api/backend';
import type { SessionCredential } from '@/api/contracts/auth';
import { requestOtp, verifyOtp } from '@/api/endpoints/auth';
import { MOCK_OTP_CODE } from '@/api/mock';
import { setAuthorizationProvider } from '@/api/session';
import { sessionStore } from '@/features/auth/session-store';
import { localStepStore, type LocalStep } from '@/features/onboarding/local-step';

/**
 * Signs `phoneNumber` in to the mock backend without the UI or secure storage. Call before
 * rendering: the mock's latency needs real timers.
 */
export async function signInToMock(
  phoneNumber: string,
  localStep: LocalStep | null = 'done'
): Promise<SessionCredential> {
  const api = getApiClient();
  const { flowId } = await requestOtp(api, { phoneNumber });
  const { session } = await verifyOtp(api, { flowId, code: MOCK_OTP_CODE });
  setAuthorizationProvider(() => `Bearer ${session.accessToken}`);
  sessionStore.setState({ status: 'signed-in', credential: session });
  localStepStore.setState({ step: localStep, hydrated: true });
  return session;
}
