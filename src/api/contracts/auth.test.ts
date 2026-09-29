import {
  OTP_ERROR_CODES,
  e164Schema,
  meSchema,
  otpErrorSchema,
  otpRequestResponseSchema,
  otpVerifyResponseSchema,
  otpVerifySchema,
  sessionRefreshResponseSchema,
  updateMeSchema,
} from './auth';

describe('auth contract', () => {
  it('parses an OTP request response', () => {
    expect(
      otpRequestResponseSchema.parse({
        flowId: 'flow-1',
        channel: 'sms',
        destination: '+98 912 ••• 6789',
        resendAfterSec: 60,
        expiresInSec: 600,
      })
    ).toMatchObject({ channel: 'sms', resendAfterSec: 60 });
  });

  it('accepts only E.164 phone numbers and six-digit codes', () => {
    expect(e164Schema.safeParse('+989123456789').success).toBe(true);
    expect(e164Schema.safeParse('09123456789').success).toBe(false);
    expect(otpVerifySchema.safeParse({ flowId: 'f', code: '000000' }).success).toBe(true);
    expect(otpVerifySchema.safeParse({ flowId: 'f', code: '00000' }).success).toBe(false);
  });

  it('parses a verify response carrying the session credential', () => {
    const parsed = otpVerifyResponseSchema.parse({
      session: { accessToken: 'a', refreshToken: 'r' },
      isNewAccount: true,
    });
    expect(parsed.session).toEqual({ accessToken: 'a', refreshToken: 'r' });
    expect(
      sessionRefreshResponseSchema.parse({ session: parsed.session }).session.accessToken
    ).toBe('a');
  });

  it.each(OTP_ERROR_CODES)('parses the %s error body', (code) => {
    expect(otpErrorSchema.parse({ message: 'nope', code }).code).toBe(code);
  });

  it('rejects an unknown OTP error code', () => {
    expect(otpErrorSchema.safeParse({ code: 'otp_whatever' }).success).toBe(false);
  });

  it('parses Me for a new account and for a completed one', () => {
    expect(
      meSchema.parse({
        user: { id: 'u1', name: null, phoneNumber: '+989123456789', email: null },
        relationship: null,
        onboardingCompletedAt: null,
      }).user.name
    ).toBeNull();
    expect(
      meSchema.parse({
        user: { id: 'u2', name: 'محمد', phoneNumber: '+989121234567', email: null },
        relationship: { id: 'rel-1', status: 'active' },
        onboardingCompletedAt: '2026-09-01T10:00:00.000Z',
      }).relationship?.status
    ).toBe('active');
  });

  it('trims display names and bounds them to 1–40 characters', () => {
    expect(updateMeSchema.parse({ name: '  محمد  ' }).name).toBe('محمد');
    expect(updateMeSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(updateMeSchema.safeParse({ name: 'x'.repeat(41) }).success).toBe(false);
  });
});
