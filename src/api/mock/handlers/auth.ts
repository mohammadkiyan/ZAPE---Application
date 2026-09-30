import {
  OTP_RATE_LIMITED,
  TRY_REFRESH_TOKEN,
  e164Schema,
  meSchema,
  otpRequestResponseSchema,
  otpVerifyResponseSchema,
  otpVerifySchema,
  sessionRefreshResponseSchema,
  updateMeSchema,
  type Me,
  type SessionCredential,
} from '../../contracts/auth';
import { registerPartnerControl } from '../partner-controls';
import { MockHttpError, registerMockRoute, type MockRequest } from '../router';
import type { MockState } from '../state';

/** Every mock sign-in code is this; the Mock controls sheet shows it. */
export const MOCK_OTP_CODE = '000000';
/** The canvas's «محمد», an existing account that has finished onboarding. */
export const MOCK_SEED_PHONE = '+989121234567';
/** The canvas relationship the seed account belongs to. */
export const MOCK_CANVAS_RELATIONSHIP_ID = 'RLT-4K7Q-92MD';
export const OTP_RESEND_AFTER_SEC = 60;
export const OTP_EXPIRES_IN_SEC = 600;
export const OTP_MAX_ATTEMPTS = 5;

export interface MockAccount {
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  relationship: Me['relationship'];
  onboardingCompletedAt: string | null;
}

interface MockOtpFlow {
  phoneNumber: string;
  code: string;
  expiresAt: number;
  resendAt: number;
  attempts: number;
}

interface MockSession {
  accountId: string;
  refreshToken: string;
  accessExpired: boolean;
}

export interface MockAuthSlice {
  accounts: Record<string, MockAccount>;
  flows: Record<string, MockOtpFlow>;
  /** Keyed by access token. */
  sessions: Record<string, MockSession>;
  nextId: number;
}

/** The auth slice of the mock database, seeded from the canvas user on first use. */
export function mockAuth(state: MockState): MockAuthSlice {
  if (!state.auth) {
    const slice: MockAuthSlice = {
      accounts: {
        [MOCK_SEED_PHONE]: {
          id: state.user.id,
          phoneNumber: MOCK_SEED_PHONE,
          name: state.user.name,
          email: state.user.email,
          relationship: { id: MOCK_CANVAS_RELATIONSHIP_ID, status: 'active' },
          onboardingCompletedAt: state.relationship.startedAt,
        },
      },
      flows: {},
      sessions: {},
      nextId: 1,
    };
    state.auth = slice;
  }
  return state.auth as MockAuthSlice;
}

function token(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function issueSession(auth: MockAuthSlice, accountId: string): SessionCredential {
  const credential = { accessToken: token('mock-access'), refreshToken: token('mock-refresh') };
  auth.sessions[credential.accessToken] = {
    accountId,
    refreshToken: credential.refreshToken,
    accessExpired: false,
  };
  return credential;
}

function toMe(account: MockAccount): Me {
  return meSchema.parse({
    user: {
      id: account.id,
      name: account.name,
      phoneNumber: account.phoneNumber,
      email: account.email,
    },
    relationship: account.relationship,
    onboardingCompletedAt: account.onboardingCompletedAt,
  });
}

/** Resolves the bearer token to its account, answering 401 like the gateway does. */
export function authorize(request: MockRequest, state: MockState): MockAccount {
  const auth = mockAuth(state);
  const header = request.headers.Authorization ?? request.headers.authorization ?? '';
  const session = auth.sessions[header.replace(/^Bearer /, '')];
  if (!session) throw new MockHttpError(401, 'Session is not valid', 'unauthorised');
  if (session.accessExpired)
    throw new MockHttpError(401, 'Access token expired', TRY_REFRESH_TOKEN);
  const account = Object.values(auth.accounts).find((a) => a.id === session.accountId);
  if (!account) throw new MockHttpError(401, 'Account no longer exists', 'unauthorised');
  return account;
}

/** Other mock handlers read `state.user` as "me"; keep it on the signed-in account. */
function syncCurrentUser(state: MockState, account: MockAccount): void {
  state.user = { id: account.id, name: account.name ?? '', email: account.email ?? '' };
}

registerMockRoute('POST /auth/otp/request', (request, state) => {
  const auth = mockAuth(state);
  const phone = e164Schema.safeParse((request.body as { phoneNumber?: unknown })?.phoneNumber);
  if (!phone.success) throw new MockHttpError(400, 'Invalid phone number', 'phone_invalid');
  const now = Date.now();
  const previous = Object.entries(auth.flows).filter(([, f]) => f.phoneNumber === phone.data);
  if (previous.some(([, f]) => f.resendAt > now)) {
    throw new MockHttpError(429, 'Wait before requesting another code', OTP_RATE_LIMITED);
  }
  // A new code invalidates the previous ones for this number.
  for (const [id] of previous) delete auth.flows[id];
  const flowId = token('mock-flow');
  auth.flows[flowId] = {
    phoneNumber: phone.data,
    code: MOCK_OTP_CODE,
    expiresAt: now + OTP_EXPIRES_IN_SEC * 1000,
    resendAt: now + OTP_RESEND_AFTER_SEC * 1000,
    attempts: 0,
  };
  return {
    body: otpRequestResponseSchema.parse({
      flowId,
      channel: 'sms',
      destination: phone.data,
      resendAfterSec: OTP_RESEND_AFTER_SEC,
      expiresInSec: OTP_EXPIRES_IN_SEC,
    }),
  };
});

registerMockRoute('POST /auth/otp/verify', (request, state) => {
  const auth = mockAuth(state);
  const body = otpVerifySchema.safeParse(request.body);
  if (!body.success) throw new MockHttpError(400, 'Invalid code', 'otp_invalid');
  const flow = auth.flows[body.data.flowId];
  if (!flow || flow.expiresAt <= Date.now()) {
    delete auth.flows[body.data.flowId];
    throw new MockHttpError(400, 'Code expired', 'otp_expired');
  }
  if (body.data.code !== flow.code) {
    flow.attempts += 1;
    if (flow.attempts >= OTP_MAX_ATTEMPTS) {
      delete auth.flows[body.data.flowId];
      throw new MockHttpError(400, 'Too many attempts', 'otp_attempts_exceeded');
    }
    throw new MockHttpError(400, 'Wrong code', 'otp_invalid');
  }
  delete auth.flows[body.data.flowId];
  let account = auth.accounts[flow.phoneNumber];
  const isNewAccount = !account;
  if (!account) {
    account = {
      id: `user-${auth.nextId++}`,
      phoneNumber: flow.phoneNumber,
      name: null,
      email: null,
      relationship: null,
      onboardingCompletedAt: null,
    };
    auth.accounts[flow.phoneNumber] = account;
  }
  syncCurrentUser(state, account);
  return {
    body: otpVerifyResponseSchema.parse({ session: issueSession(auth, account.id), isNewAccount }),
  };
});

registerMockRoute('POST /auth/session/refresh', (request, state) => {
  const auth = mockAuth(state);
  const refreshToken = (request.body as { refreshToken?: unknown })?.refreshToken;
  const entry = Object.entries(auth.sessions).find(([, s]) => s.refreshToken === refreshToken);
  if (!entry) throw new MockHttpError(401, 'Refresh token is not valid', 'unauthorised');
  const [accessToken, session] = entry;
  delete auth.sessions[accessToken];
  return {
    body: sessionRefreshResponseSchema.parse({ session: issueSession(auth, session.accountId) }),
  };
});

registerMockRoute('POST /auth/sign-out', (request, state) => {
  const auth = mockAuth(state);
  const header = request.headers.Authorization ?? request.headers.authorization ?? '';
  delete auth.sessions[header.replace(/^Bearer /, '')];
  return { status: 204 };
});

registerMockRoute('GET /me', (request, state) => ({ body: toMe(authorize(request, state)) }));

registerMockRoute('PATCH /me', (request, state) => {
  const account = authorize(request, state);
  const body = updateMeSchema.safeParse(request.body);
  if (!body.success) throw new MockHttpError(400, 'Invalid name', 'name_invalid');
  account.name = body.data.name;
  syncCurrentUser(state, account);
  return { body: toMe(account) };
});

registerMockRoute('POST /me/onboarding/complete', (request, state) => {
  const account = authorize(request, state);
  account.onboardingCompletedAt ??= new Date().toISOString();
  return { body: toMe(account) };
});

registerPartnerControl({
  id: 'auth.expire-session',
  label: { fa: 'پایان نشست من', en: 'Expire my session' },
  run(state) {
    mockAuth(state).sessions = {};
  },
});

registerPartnerControl({
  id: 'auth.expire-access-token',
  label: { fa: 'انقضای توکن دسترسی من', en: 'Expire my access token' },
  run(state) {
    for (const session of Object.values(mockAuth(state).sessions)) session.accessExpired = true;
  },
});
