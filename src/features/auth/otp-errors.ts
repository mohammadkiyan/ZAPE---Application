import { ApiError } from '@/api/client';
import { OTP_RATE_LIMITED, type OtpErrorCode } from '@/api/contracts/auth';
import { describeError, type ErrorMessageKey } from '@/api/errors';

export type AccountErrorKey =
  | 'onboarding:account.errors.phoneInvalid'
  | 'onboarding:account.errors.codeInvalid'
  | 'onboarding:account.errors.codeExpired'
  | 'onboarding:account.errors.attemptsExceeded'
  | 'onboarding:account.errors.rateLimited'
  | `common:${ErrorMessageKey}`;

const VERIFY_ERRORS: Record<OtpErrorCode, AccountErrorKey> = {
  otp_invalid: 'onboarding:account.errors.codeInvalid',
  otp_expired: 'onboarding:account.errors.codeExpired',
  otp_attempts_exceeded: 'onboarding:account.errors.attemptsExceeded',
};

function generic(error: unknown): AccountErrorKey | null {
  const described = describeError(error);
  return described ? `common:${described.messageKey}` : null;
}

/** Message for a failed `POST /auth/otp/request`; null for a user-initiated abort. */
export function requestErrorKey(error: unknown): AccountErrorKey | null {
  if (error instanceof ApiError) {
    if (error.serverCode === OTP_RATE_LIMITED || error.status === 429) {
      return 'onboarding:account.errors.rateLimited';
    }
    if (error.serverCode === 'phone_invalid') return 'onboarding:account.errors.phoneInvalid';
  }
  return generic(error);
}

/** Message for a failed `POST /auth/otp/verify`, and whether the typed code should be cleared. */
export function verifyErrorKey(error: unknown): {
  key: AccountErrorKey | null;
  clearCode: boolean;
} {
  if (error instanceof ApiError && error.serverCode && error.serverCode in VERIFY_ERRORS) {
    return { key: VERIFY_ERRORS[error.serverCode as OtpErrorCode], clearCode: true };
  }
  return { key: generic(error), clearCode: false };
}
