import { NO_RELATIONSHIP } from '../../contracts/relationship';
import { IDEMPOTENCY_HEADER } from '../../idempotency';
import { MockHttpError, type MockRequest } from '../router';
import type { MockState } from '../state';
import { MOCK_CANVAS_RELATIONSHIP_ID, MOCK_SEED_PHONE, authorize, mockAuth } from './auth';
import { mockRelationships, openRelationshipOf, type MockRelationship } from './relationship';

/** What the status and note handlers share: who is asking, on which relationship, with whom. */
export interface BoardContext {
  relationship: MockRelationship;
  youId: string;
  /** Undefined while the partner has not joined. */
  partnerId: string | undefined;
}

/** Resolves the caller's open relationship, answering 404 `no_relationship` like ZAPE does. */
export function boardContext(request: MockRequest, state: MockState): BoardContext {
  const account = authorize(request, state);
  const relationship = openRelationshipOf(mockRelationships(state), account.id);
  if (!relationship) throw new MockHttpError(404, 'no relationship', NO_RELATIONSHIP);
  return {
    relationship,
    youId: account.id,
    partnerId: relationship.members.find((member) => member.accountId !== account.id)?.accountId,
  };
}

/** The same for a partner control: the signed-in account's open relationship and its partner. */
export function partnerContext(state: MockState): Required<BoardContext> | undefined {
  const relationship = openRelationshipOf(mockRelationships(state), state.user.id);
  const partnerId = relationship?.members.find((m) => m.accountId !== state.user.id)?.accountId;
  return relationship && partnerId ? { relationship, youId: state.user.id, partnerId } : undefined;
}

const KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

/** The save's `Idempotency-Key`; ZAPE refuses a status or note save without one. */
export function mutationKey(request: MockRequest): string {
  const name = Object.keys(request.headers).find(
    (header) => header.toLowerCase() === IDEMPOTENCY_HEADER.toLowerCase()
  );
  const key = name ? request.headers[name]!.trim() : '';
  if (!KEY_PATTERN.test(key)) {
    throw new MockHttpError(400, 'Idempotency-Key header is required', 'idempotency_key_required');
  }
  return key;
}

/** The canvas couple's ids, for seeding their boards: `[you, partner]`, or undefined. */
export function canvasCouple(state: MockState): [string, string] | undefined {
  const canvas = mockRelationships(state).relationships[MOCK_CANVAS_RELATIONSHIP_ID];
  const you = mockAuth(state).accounts[MOCK_SEED_PHONE]?.id;
  const partner = canvas?.members.find((member) => member.accountId !== you)?.accountId;
  return you && partner ? [you, partner] : undefined;
}
