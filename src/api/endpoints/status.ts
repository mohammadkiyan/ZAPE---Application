import type { ApiClient } from '../client';
import {
  statusBoardSchema,
  statusSchema,
  type Mood,
  type Status,
  type StatusBoard,
} from '../contracts/status';
import { IDEMPOTENCY_HEADER } from '../idempotency';

/** Both people's current statuses and today's changes; 404 `no_relationship` when there is none. */
export function getStatusBoard(api: ApiClient, signal?: AbortSignal): Promise<StatusBoard> {
  return api.request('relationships/current/statuses', { schema: statusBoardSchema, signal });
}

/**
 * Sets your status. `idempotencyKey` names this save: pass the same key when retrying it, and
 * ZAPE answers with the first result instead of adding a second history entry.
 */
export function setStatus(api: ApiClient, mood: Mood, idempotencyKey: string): Promise<Status> {
  return api.request('me/status', {
    method: 'PUT',
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
    body: { mood },
    schema: statusSchema,
  });
}
