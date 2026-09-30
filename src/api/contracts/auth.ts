import { z } from 'zod';
import { meRelationshipSchema } from './relationship';

/** E.164, the only phone form the backend accepts (the same rule as zape.house). */
export const e164Schema = z.string().regex(/^\+[1-9]\d{7,14}$/);

export const otpRequestSchema = z.object({ phoneNumber: e164Schema });
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const otpRequestResponseSchema = z.object({
  /** Opaque handle for this code; verification names it instead of the phone number. */
  flowId: z.string().min(1),
  channel: z.enum(['sms']),
  /** Where the code went, as the backend wants it shown (possibly masked). */
  destination: z.string().min(1),
  resendAfterSec: z.number().int().nonnegative(),
  expiresInSec: z.number().int().positive(),
});
export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;

export const otpVerifySchema = z.object({
  flowId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});
export type OtpVerify = z.infer<typeof otpVerifySchema>;

/** The session credential: stored as one opaque value, never inspected beyond these two fields. */
export const sessionCredentialSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});
export type SessionCredential = z.infer<typeof sessionCredentialSchema>;

export const otpVerifyResponseSchema = z.object({
  session: sessionCredentialSchema,
  isNewAccount: z.boolean(),
});
export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;

export const sessionRefreshSchema = z.object({ refreshToken: z.string().min(1) });
export const sessionRefreshResponseSchema = z.object({ session: sessionCredentialSchema });

/** `code` values on a 400 from `POST /auth/otp/verify`. */
export const OTP_ERROR_CODES = ['otp_invalid', 'otp_expired', 'otp_attempts_exceeded'] as const;
export type OtpErrorCode = (typeof OTP_ERROR_CODES)[number];
export const otpErrorSchema = z.object({
  message: z.string().optional(),
  code: z.enum(OTP_ERROR_CODES),
});

/** `code` on a 429 from `POST /auth/otp/request`: the backend's SMS limiter refused another code. */
export const OTP_RATE_LIMITED = 'otp_rate_limited';
/** `code` on a 401 whose access token expired; the refresh token may still be valid. */
export const TRY_REFRESH_TOKEN = 'try_refresh_token';

export const DISPLAY_NAME_MAX = 40;
export const displayNameSchema = z.string().trim().min(1).max(DISPLAY_NAME_MAX);

export const meSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    name: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    email: z.string().nullable(),
  }),
  /** Null until the account belongs to a relationship; kept, as `ended`, after one ends. */
  relationship: meRelationshipSchema.nullable(),
  onboardingCompletedAt: z.iso.datetime().nullable(),
});
export type Me = z.infer<typeof meSchema>;

export const updateMeSchema = z.object({ name: displayNameSchema });
export type UpdateMe = z.infer<typeof updateMeSchema>;
