import type { ApiClient } from '../client';
import {
  meSchema,
  otpRequestResponseSchema,
  otpVerifyResponseSchema,
  sessionRefreshResponseSchema,
  type Me,
  type OtpRequest,
  type OtpRequestResponse,
  type OtpVerify,
  type OtpVerifyResponse,
  type SessionCredential,
  type UpdateMe,
} from '../contracts/auth';

/** Sends a sign-in code. Calling it again for the same number is the resend. */
export function requestOtp(api: ApiClient, body: OtpRequest): Promise<OtpRequestResponse> {
  return api.request('auth/otp/request', {
    method: 'POST',
    body,
    schema: otpRequestResponseSchema,
  });
}

export function verifyOtp(api: ApiClient, body: OtpVerify): Promise<OtpVerifyResponse> {
  return api.request('auth/otp/verify', { method: 'POST', body, schema: otpVerifyResponseSchema });
}

export async function refreshSession(
  api: ApiClient,
  refreshToken: string
): Promise<SessionCredential> {
  const response = await api.request('auth/session/refresh', {
    method: 'POST',
    body: { refreshToken },
    schema: sessionRefreshResponseSchema,
  });
  return response.session;
}

export async function signOut(api: ApiClient): Promise<void> {
  await api.request('auth/sign-out', { method: 'POST' });
}

export function getMe(api: ApiClient, signal?: AbortSignal): Promise<Me> {
  return api.request('me', { schema: meSchema, signal });
}

export function updateMe(api: ApiClient, body: UpdateMe): Promise<Me> {
  return api.request('me', { method: 'PATCH', body, schema: meSchema });
}

export function completeOnboarding(api: ApiClient): Promise<Me> {
  return api.request('me/onboarding/complete', { method: 'POST', schema: meSchema });
}
