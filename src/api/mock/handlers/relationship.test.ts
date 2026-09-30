import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, createApiClient, type ApiClient } from '../../client';
import { getMe, requestOtp, verifyOtp } from '../../endpoints/auth';
import {
  acceptInvite,
  createRelationship,
  endRelationship,
  getCurrentRelationship,
  getInvitePreview,
  issueInvite,
} from '../../endpoints/relationship';
import { runPartnerControl } from '../partner-controls';
import { createMockFetcher } from '../router';
import { createMockStore, type MockStore } from '../state';
import { mockStore } from '..';
import { MOCK_OTP_CODE, MOCK_SEED_PHONE } from './auth';
import {
  INVITE_TTL_MS,
  MOCK_JOINABLE_CODE,
  MOCK_PARTNER_PHONE,
  mockRelationships,
} from './relationship';

const BASE = 'https://mock.zape.invalid/';
const START = { date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' };

function client(store: MockStore, accessToken?: string): ApiClient {
  return createApiClient({
    baseUrl: BASE,
    fetcher: createMockFetcher({ baseUrl: BASE, store }),
    getAuthorization: () => (accessToken ? `Bearer ${accessToken}` : null),
  });
}

async function signIn(store: MockStore, phoneNumber: string): Promise<ApiClient> {
  const { flowId } = await requestOtp(client(store), { phoneNumber });
  const { session } = await verifyOtp(client(store), { flowId, code: MOCK_OTP_CODE });
  return client(store, session.accessToken);
}

async function serverCode(promise: Promise<unknown>): Promise<string | undefined> {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return (error as ApiError).serverCode;
}

describe('mock relationship backend', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useRealTimers();
  });

  it('seeds the canvas relationship for the canvas account', async () => {
    const api = await signIn(createMockStore(), MOCK_SEED_PHONE);
    const relationship = await getCurrentRelationship(api);
    expect(relationship).toMatchObject({
      id: 'RLT-4K7Q-92MD',
      status: 'active',
      start: START,
      calendar: 'jalali',
    });
    expect(relationship.members.map((m) => [m.name, m.isYou])).toEqual([
      ['محمد', true],
      ['سارا', false],
    ]);
    expect(relationship.invite).toBeNull();
  });

  it('creates a pending relationship with an invite, then a partner joins with the code', async () => {
    const store = createMockStore();
    const creator = await signIn(store, '+989351112233');
    expect(await serverCode(getCurrentRelationship(creator))).toBe('no_relationship');

    const created = await createRelationship(creator, { start: START, calendar: 'gregorian' });
    expect(created.status).toBe('pending_partner');
    expect(created.id).toMatch(/^RLT-/);
    const code = created.invite!.code;
    expect(new Date(created.invite!.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect((await issueInvite(creator)).code).toBe(code);
    expect((await getMe(creator)).relationship).toEqual({
      id: created.id,
      status: 'pending_partner',
    });

    const joiner = await signIn(store, '+989351112244');
    expect(await getInvitePreview(joiner, code)).toMatchObject({
      creatorName: null,
      calendar: 'gregorian',
    });
    const joined = await acceptInvite(joiner, code);
    expect(joined.status).toBe('active');
    expect(joined.members).toHaveLength(2);
    expect((await getCurrentRelationship(creator)).status).toBe('active');
    expect((await getMe(joiner)).relationship?.status).toBe('active');
  });

  it('answers each invite error code', async () => {
    const store = createMockStore();
    const api = await signIn(store, '+989351112255');
    expect(await serverCode(getInvitePreview(api, 'ZZZZZZZZ'))).toBe('invite_invalid');

    const state = await store.load();
    mockRelationships(state).invites[MOCK_JOINABLE_CODE]!.expiresAt = Date.now() - 1;
    expect(await serverCode(getInvitePreview(api, MOCK_JOINABLE_CODE))).toBe('invite_expired');
    expect(await serverCode(acceptInvite(api, MOCK_JOINABLE_CODE))).toBe('invite_expired');

    mockRelationships(state).invites[MOCK_JOINABLE_CODE]!.expiresAt = Date.now() + INVITE_TTL_MS;
    await acceptInvite(api, MOCK_JOINABLE_CODE);
    const other = await signIn(store, '+989351112266');
    expect(await serverCode(acceptInvite(other, MOCK_JOINABLE_CODE))).toBe('invite_used');

    const canvas = await signIn(store, MOCK_SEED_PHONE);
    expect(await serverCode(acceptInvite(canvas, 'ZZZZZZZZ'))).toBe('already_in_relationship');
    expect(await serverCode(createRelationship(canvas, { start: START, calendar: 'jalali' }))).toBe(
      'already_in_relationship'
    );
  });

  it('refuses a start date in the future', async () => {
    const api = await signIn(createMockStore(), '+989351112277');
    const error = await createRelationship(api, {
      start: { ...START, date: '2999-01-01' },
      calendar: 'jalali',
    }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 400, serverCode: 'start_in_future' });
  });

  it('issues a new code once the previous one expired', async () => {
    const store = createMockStore();
    const api = await signIn(store, '+989351112288');
    const { invite } = await createRelationship(api, { start: START, calendar: 'jalali' });
    mockRelationships(await store.load()).invites[invite!.code]!.expiresAt = Date.now() - 1;
    const fresh = await issueInvite(api);
    expect(fresh.code).not.toBe(invite!.code);
  });

  it('ends a relationship for both members', async () => {
    const store = createMockStore();
    const canvas = await signIn(store, MOCK_SEED_PHONE);
    await endRelationship(canvas);
    expect((await getMe(canvas)).relationship).toEqual({
      id: 'RLT-4K7Q-92MD',
      status: 'ended',
      endedBy: 'you',
    });
    const partner = await signIn(store, MOCK_PARTNER_PHONE);
    expect((await getMe(partner)).relationship?.endedBy).toBe('partner');
    expect(await serverCode(getCurrentRelationship(partner))).toBe('no_relationship');
    // Ending frees both to start again.
    expect((await createRelationship(partner, { start: START, calendar: 'jalali' })).status).toBe(
      'pending_partner'
    );
  });

  it('plays the partner joining and ending through the partner controls', async () => {
    await mockStore.reset();
    const api = await signIn(mockStore, '+989351112299');
    await createRelationship(api, { start: START, calendar: 'jalali' });

    await runPartnerControl('relationship.partner-joins');
    const joined = await getCurrentRelationship(api);
    expect(joined.status).toBe('active');
    expect(joined.members.find((m) => !m.isYou)?.name).toBe('سارا');

    await runPartnerControl('relationship.partner-ends');
    expect((await getMe(api)).relationship).toMatchObject({ status: 'ended', endedBy: 'partner' });
  });
});
