import { useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { getStatusBoard } from '@/api/endpoints/status';
import { partnerDataRefresh } from '@/api/query-client';
import { useSession } from '@/features/auth/session-store';
import { fetchForRelationship } from '@/features/relationship/use-relationship';

export const STATUS_BOARD_QUERY_KEY = ['status', 'board'] as const;
export const SET_STATUS_MUTATION_KEY = ['status', 'set'] as const;

/**
 * Both people's current statuses and today's history. Partner-mutable, so it refreshes every
 * 30 s while foregrounded, on foreground and on reconnect. Used inside the main area, which the
 * entry gate opens only for an account with a relationship.
 */
export function useStatusBoard() {
  const queryClient = useQueryClient();
  const signedIn = useSession((state) => state.status === 'signed-in');
  return useQuery({
    queryKey: STATUS_BOARD_QUERY_KEY,
    queryFn: ({ signal }) =>
      fetchForRelationship(queryClient, () => getStatusBoard(getApiClient(), signal)),
    enabled: signedIn,
    ...partnerDataRefresh,
  });
}

/**
 * Whether a status save is waiting for the connection: it was sent, the connection dropped,
 * and it will be retried with the same key once the phone is back online.
 */
export function useStatusWaitingToSync(): boolean {
  return useMutationState({
    filters: { mutationKey: SET_STATUS_MUTATION_KEY, status: 'pending' },
    select: (mutation) => mutation.state.isPaused,
  }).some(Boolean);
}
