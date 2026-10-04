import { useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { getNoteBoard } from '@/api/endpoints/notes';
import { partnerDataRefresh } from '@/api/query-client';
import { useSession } from '@/features/auth/session-store';
import { fetchForRelationship } from '@/features/relationship/use-relationship';
import { hasUnreadPartnerNote } from './selectors';

export const NOTE_BOARD_QUERY_KEY = ['notes', 'board'] as const;
export const SAVE_NOTE_MUTATION_KEY = ['notes', 'save'] as const;
export const READ_NOTE_MUTATION_KEY = ['notes', 'read'] as const;

/**
 * Both people's current notes. Partner-mutable, so it refreshes every 30 s while foregrounded,
 * on foreground and on reconnect. Fetching it marks nothing read. Used inside the main area,
 * which the entry gate opens only for an account with a relationship.
 */
export function useNoteBoard() {
  const queryClient = useQueryClient();
  const signedIn = useSession((state) => state.status === 'signed-in');
  return useQuery({
    queryKey: NOTE_BOARD_QUERY_KEY,
    queryFn: ({ signal }) =>
      fetchForRelationship(queryClient, () => getNoteBoard(getApiClient(), signal)),
    enabled: signedIn,
    ...partnerDataRefresh,
  });
}

/** Whether the partner's current note is unread: the tab bar dot and both NEW badges. */
export function useHasUnreadNote(): boolean {
  return hasUnreadPartnerNote(useNoteBoard().data);
}

/** Whether a note save is waiting for the connection, to be retried with the same key. */
export function useNoteWaitingToSync(): boolean {
  return useMutationState({
    filters: { mutationKey: SAVE_NOTE_MUTATION_KEY, status: 'pending' },
    select: (mutation) => mutation.state.isPaused,
  }).some(Boolean);
}
