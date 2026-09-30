import type { ApiClient } from '../client';
import {
  invitePreviewSchema,
  inviteSchema,
  relationshipSchema,
  type CreateRelationship,
  type Invite,
  type InvitePreview,
  type Relationship,
} from '../contracts/relationship';

export function createRelationship(
  api: ApiClient,
  body: CreateRelationship
): Promise<Relationship> {
  return api.request('relationships', { method: 'POST', body, schema: relationshipSchema });
}

/** The account's pending or active relationship; 404 `no_relationship` when there is none. */
export function getCurrentRelationship(
  api: ApiClient,
  signal?: AbortSignal
): Promise<Relationship> {
  return api.request('relationships/current', { schema: relationshipSchema, signal });
}

/** The live invite code: the unexpired one, or a newly issued one. Creator only, while pending. */
export function issueInvite(api: ApiClient): Promise<Invite> {
  return api.request('relationships/current/invites', { method: 'POST', schema: inviteSchema });
}

export function getInvitePreview(
  api: ApiClient,
  code: string,
  signal?: AbortSignal
): Promise<InvitePreview> {
  return api.request(`invites/${encodeURIComponent(code)}`, {
    schema: invitePreviewSchema,
    signal,
  });
}

export function acceptInvite(api: ApiClient, code: string): Promise<Relationship> {
  return api.request(`invites/${encodeURIComponent(code)}/accept`, {
    method: 'POST',
    schema: relationshipSchema,
  });
}

export async function endRelationship(api: ApiClient): Promise<void> {
  await api.request('relationships/current/end', { method: 'POST' });
}
