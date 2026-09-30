import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { ApiError } from '@/api/client';
import {
  NO_RELATIONSHIP,
  type Relationship,
  type RelationshipStatus,
} from '@/api/contracts/relationship';
import { getCurrentRelationship } from '@/api/endpoints/relationship';
import { partnerDataRefresh } from '@/api/query-client';
import { ME_QUERY_KEY, useMe } from '@/features/auth/use-me';
import { useSession } from '@/features/auth/session-store';
import { cachedRelationship, rememberRelationship } from './relationship-cache';

export const RELATIONSHIP_QUERY_KEY = ['relationship', 'current'] as const;

export function isOpenStatus(status: RelationshipStatus | undefined | null): boolean {
  return status === 'pending_partner' || status === 'active';
}

/** The current relationship, or null once there is none (ended, or never joined). */
export async function fetchRelationship(
  queryClient: QueryClient,
  signal?: AbortSignal
): Promise<Relationship | null> {
  try {
    const relationship = await getCurrentRelationship(getApiClient(), signal);
    rememberRelationship(relationship);
    return relationship;
  } catch (error) {
    if (!(error instanceof ApiError && error.serverCode === NO_RELATIONSHIP)) throw error;
    rememberRelationship(null);
    // The gate reads `me`; refreshing it routes an ended relationship back to the step.
    void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    return null;
  }
}

/**
 * The relationship shared by both members. Partner-mutable, so it refreshes every 30 s while
 * foregrounded; `refetchInterval` overrides that (the invite screen polls every 5 s).
 */
export function useRelationship({ refetchInterval }: { refetchInterval?: number } = {}) {
  const queryClient = useQueryClient();
  const signedIn = useSession((state) => state.status === 'signed-in');
  const me = useMe().data;
  // Offline, `me` may never load: fall back to the relationship last seen on this phone.
  const open = me ? isOpenStatus(me.relationship?.status) : cachedRelationship() !== undefined;
  return useQuery({
    queryKey: RELATIONSHIP_QUERY_KEY,
    queryFn: ({ signal }) => fetchRelationship(queryClient, signal),
    enabled: signedIn && open,
    initialData: cachedRelationship,
    initialDataUpdatedAt: 0,
    ...partnerDataRefresh,
    ...(refetchInterval ? { refetchInterval } : {}),
  });
}
