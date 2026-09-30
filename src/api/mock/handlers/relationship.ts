import {
  CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  NO_RELATIONSHIP,
  createRelationshipSchema,
  invitePreviewSchema,
  inviteSchema,
  relationshipSchema,
  type Invite,
  type Relationship,
  type RelationshipCalendar,
  type RelationshipStart,
  type RelationshipStatus,
} from '../../contracts/relationship';
import { registerPartnerControl } from '../partner-controls';
import { MockHttpError, registerMockRoute } from '../router';
import type { MockState } from '../state';
import {
  MOCK_CANVAS_RELATIONSHIP_ID,
  MOCK_SEED_PHONE,
  authorize,
  mockAuth,
  type MockAccount,
  type MockAuthSlice,
} from './auth';

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** A pending relationship by another «محمد» that the join screen can preview in development. */
export const MOCK_JOINABLE_CODE = '7K4P9RM2';
/** The canvas partner, «سارا». */
export const MOCK_PARTNER_PHONE = '+989121111111';
const MOCK_HOST_PHONE = '+989120000002';

const CANVAS_START: RelationshipStart = {
  date: '2021-03-14',
  time: '20:00',
  timeZone: 'Asia/Tehran',
};

interface MockMember {
  accountId: string;
  joinedAt: string;
}

interface MockRelationship {
  id: string;
  status: RelationshipStatus;
  start: RelationshipStart;
  calendar: RelationshipCalendar;
  /** The creator first. */
  members: MockMember[];
}

interface MockInvite {
  code: string;
  relationshipId: string;
  expiresAt: number;
  usedBy?: string;
}

export interface MockRelationshipSlice {
  relationships: Record<string, MockRelationship>;
  invites: Record<string, MockInvite>;
}

function randomCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function ensureAccount(auth: MockAuthSlice, phoneNumber: string, name: string): MockAccount {
  let account = auth.accounts[phoneNumber];
  if (!account) {
    account = {
      id: `user-${auth.nextId++}`,
      phoneNumber,
      name,
      email: null,
      relationship: null,
      onboardingCompletedAt: new Date().toISOString(),
    };
    auth.accounts[phoneNumber] = account;
  }
  return account;
}

/** The relationship slice, seeded with the canvas couple and one joinable invite. */
export function mockRelationships(state: MockState): MockRelationshipSlice {
  if (!state.relationships) {
    const auth = mockAuth(state);
    const you = auth.accounts[MOCK_SEED_PHONE]!;
    const partner = ensureAccount(auth, MOCK_PARTNER_PHONE, 'سارا');
    const host = ensureAccount(auth, MOCK_HOST_PHONE, 'محمد');
    const slice: MockRelationshipSlice = {
      relationships: {
        [MOCK_CANVAS_RELATIONSHIP_ID]: {
          id: MOCK_CANVAS_RELATIONSHIP_ID,
          status: 'active',
          start: CANVAS_START,
          calendar: 'jalali',
          members: [
            { accountId: you.id, joinedAt: '2021-03-15T08:10:00.000Z' },
            { accountId: partner.id, joinedAt: '2021-03-15T09:42:00.000Z' },
          ],
        },
        'RLT-J8N3-5WQX': {
          id: 'RLT-J8N3-5WQX',
          status: 'pending_partner',
          start: CANVAS_START,
          calendar: 'jalali',
          members: [{ accountId: host.id, joinedAt: new Date().toISOString() }],
        },
      },
      invites: {
        [MOCK_JOINABLE_CODE]: {
          code: MOCK_JOINABLE_CODE,
          relationshipId: 'RLT-J8N3-5WQX',
          expiresAt: Date.now() + INVITE_TTL_MS,
        },
      },
    };
    partner.relationship = { id: MOCK_CANVAS_RELATIONSHIP_ID, status: 'active' };
    host.relationship = { id: 'RLT-J8N3-5WQX', status: 'pending_partner' };
    state.relationships = slice;
  }
  return state.relationships as MockRelationshipSlice;
}

function accountById(auth: MockAuthSlice, id: string): MockAccount | undefined {
  return Object.values(auth.accounts).find((account) => account.id === id);
}

function isOpen(relationship: MockRelationship | undefined): relationship is MockRelationship {
  return relationship?.status === 'pending_partner' || relationship?.status === 'active';
}

function openRelationshipOf(
  slice: MockRelationshipSlice,
  accountId: string
): MockRelationship | undefined {
  return Object.values(slice.relationships).find(
    (r) => isOpen(r) && r.members.some((m) => m.accountId === accountId)
  );
}

function liveInvite(slice: MockRelationshipSlice, relationshipId: string): MockInvite | undefined {
  return Object.values(slice.invites).find(
    (i) => i.relationshipId === relationshipId && !i.usedBy && i.expiresAt > Date.now()
  );
}

function toInvite(invite: MockInvite): Invite {
  return inviteSchema.parse({
    code: invite.code,
    expiresAt: new Date(invite.expiresAt).toISOString(),
  });
}

function toRelationship(
  state: MockState,
  relationship: MockRelationship,
  viewerId: string
): Relationship {
  const auth = mockAuth(state);
  const slice = mockRelationships(state);
  const isCreator = relationship.members[0]?.accountId === viewerId;
  const invite =
    isCreator && relationship.status === 'pending_partner'
      ? liveInvite(slice, relationship.id)
      : undefined;
  return relationshipSchema.parse({
    id: relationship.id,
    status: relationship.status,
    start: relationship.start,
    calendar: relationship.calendar,
    members: relationship.members.map((member) => ({
      userId: `member-${member.accountId}`,
      name: accountById(auth, member.accountId)?.name ?? null,
      joinedAt: member.joinedAt,
      isYou: member.accountId === viewerId,
    })),
    invite: invite ? toInvite(invite) : null,
  });
}

/** Keeps each member's `me.relationship` in step with the relationship. */
function syncMembers(state: MockState, relationship: MockRelationship, endedBy?: string): void {
  const auth = mockAuth(state);
  for (const member of relationship.members) {
    const account = accountById(auth, member.accountId);
    if (!account) continue;
    account.relationship = {
      id: relationship.id,
      status: relationship.status,
      ...(endedBy ? { endedBy: endedBy === account.id ? 'you' : 'partner' } : {}),
    };
  }
}

function issueInvite(slice: MockRelationshipSlice, relationshipId: string): MockInvite {
  const existing = liveInvite(slice, relationshipId);
  if (existing) return existing;
  let code = randomCode(INVITE_CODE_LENGTH);
  while (slice.invites[code]) code = randomCode(INVITE_CODE_LENGTH);
  const invite = { code, relationshipId, expiresAt: Date.now() + INVITE_TTL_MS };
  slice.invites[code] = invite;
  return invite;
}

/** Validates a presented code; the order matches the gateway's. */
function usableInvite(slice: MockRelationshipSlice, code: string): MockInvite {
  const invite = slice.invites[code.toUpperCase()];
  if (!invite || !isOpen(slice.relationships[invite.relationshipId])) {
    throw new MockHttpError(404, 'No invite with that code', 'invite_invalid');
  }
  if (invite.usedBy || slice.relationships[invite.relationshipId]!.status !== 'pending_partner') {
    throw new MockHttpError(410, 'Invite was already used', 'invite_used');
  }
  if (invite.expiresAt <= Date.now()) {
    throw new MockHttpError(410, 'Invite expired', 'invite_expired');
  }
  return invite;
}

function refuseIfInRelationship(slice: MockRelationshipSlice, accountId: string): void {
  if (openRelationshipOf(slice, accountId)) {
    throw new MockHttpError(409, 'End your current relationship first', 'already_in_relationship');
  }
}

function endRelationship(state: MockState, relationship: MockRelationship, by: string): void {
  const slice = mockRelationships(state);
  relationship.status = 'ended';
  for (const invite of Object.values(slice.invites)) {
    if (invite.relationshipId === relationship.id && !invite.usedBy)
      delete slice.invites[invite.code];
  }
  syncMembers(state, relationship, by);
}

/** The wall-clock date today in `timeZone`, as `YYYY-MM-DD`. */
function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

registerMockRoute('POST /relationships', (request, state) => {
  const account = authorize(request, state);
  const slice = mockRelationships(state);
  const body = createRelationshipSchema.safeParse(request.body);
  if (!body.success) throw new MockHttpError(400, 'Invalid relationship', 'invalid_request');
  if (body.data.start.date > todayIn(body.data.start.timeZone)) {
    throw new MockHttpError(400, 'A relationship cannot begin in the future', 'start_in_future');
  }
  refuseIfInRelationship(slice, account.id);
  let id = `RLT-${randomCode(4)}-${randomCode(4)}`;
  while (slice.relationships[id]) id = `RLT-${randomCode(4)}-${randomCode(4)}`;
  const relationship: MockRelationship = {
    id,
    status: 'pending_partner',
    start: body.data.start,
    calendar: body.data.calendar,
    members: [{ accountId: account.id, joinedAt: new Date().toISOString() }],
  };
  slice.relationships[id] = relationship;
  issueInvite(slice, id);
  syncMembers(state, relationship);
  return { status: 201, body: toRelationship(state, relationship, account.id) };
});

registerMockRoute('GET /relationships/current', (request, state) => {
  const account = authorize(request, state);
  const relationship = openRelationshipOf(mockRelationships(state), account.id);
  if (!relationship) throw new MockHttpError(404, 'No relationship', NO_RELATIONSHIP);
  return { body: toRelationship(state, relationship, account.id) };
});

registerMockRoute('POST /relationships/current/invites', (request, state) => {
  const account = authorize(request, state);
  const slice = mockRelationships(state);
  const relationship = openRelationshipOf(slice, account.id);
  if (!relationship) throw new MockHttpError(404, 'No relationship', NO_RELATIONSHIP);
  if (
    relationship.status !== 'pending_partner' ||
    relationship.members[0]?.accountId !== account.id
  ) {
    throw new MockHttpError(
      409,
      'Only the creator can invite, before the partner joins',
      'invite_not_allowed'
    );
  }
  return { body: toInvite(issueInvite(slice, relationship.id)) };
});

registerMockRoute('GET /invites/:code', (request, state) => {
  authorize(request, state);
  const slice = mockRelationships(state);
  const relationship =
    slice.relationships[usableInvite(slice, request.params.code!).relationshipId]!;
  const creator = accountById(mockAuth(state), relationship.members[0]!.accountId);
  return {
    body: invitePreviewSchema.parse({
      creatorName: creator?.name ?? null,
      start: relationship.start,
      calendar: relationship.calendar,
    }),
  };
});

registerMockRoute('POST /invites/:code/accept', (request, state) => {
  const account = authorize(request, state);
  const slice = mockRelationships(state);
  refuseIfInRelationship(slice, account.id);
  const invite = usableInvite(slice, request.params.code!);
  const relationship = slice.relationships[invite.relationshipId]!;
  invite.usedBy = account.id;
  relationship.members.push({ accountId: account.id, joinedAt: new Date().toISOString() });
  relationship.status = 'active';
  syncMembers(state, relationship);
  return { body: toRelationship(state, relationship, account.id) };
});

registerMockRoute('POST /relationships/current/end', (request, state) => {
  const account = authorize(request, state);
  const relationship = openRelationshipOf(mockRelationships(state), account.id);
  if (!relationship) throw new MockHttpError(404, 'No relationship', NO_RELATIONSHIP);
  endRelationship(state, relationship, account.id);
  return { status: 204 };
});

/** The signed-in account's open relationship, for the partner controls. */
function myOpenRelationship(state: MockState): MockRelationship | undefined {
  return openRelationshipOf(mockRelationships(state), state.user.id);
}

registerPartnerControl({
  id: 'relationship.partner-joins',
  label: { fa: 'همراه با دعوت‌نامه می‌پیوندد', en: 'Partner joins with the invite' },
  run(state) {
    const relationship = myOpenRelationship(state);
    if (relationship?.status !== 'pending_partner') return;
    const slice = mockRelationships(state);
    const auth = mockAuth(state);
    const partner = ensureAccount(auth, `+98912${String(2000000 + auth.nextId)}`, 'سارا');
    const invite = issueInvite(slice, relationship.id);
    invite.usedBy = partner.id;
    relationship.members.push({ accountId: partner.id, joinedAt: new Date().toISOString() });
    relationship.status = 'active';
    syncMembers(state, relationship);
  },
});

registerPartnerControl({
  id: 'relationship.partner-ends',
  label: { fa: 'همراه رابطه را پایان می‌دهد', en: 'Partner ends the relationship' },
  run(state) {
    const relationship = myOpenRelationship(state);
    const partner = relationship?.members.find((m) => m.accountId !== state.user.id);
    if (!relationship || !partner) return;
    endRelationship(state, relationship, partner.accountId);
  },
});
