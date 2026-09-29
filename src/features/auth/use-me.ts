import { useQuery, type QueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import type { Me } from '@/api/contracts/auth';
import { getMe } from '@/api/endpoints/auth';
import { useSession } from './session-store';

export const ME_QUERY_KEY = ['me'] as const;

export function fetchMe(queryClient: QueryClient): Promise<Me> {
  return queryClient.fetchQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: ({ signal }) => getMe(getApiClient(), signal),
    staleTime: 0,
  });
}

/** The signed-in account, its relationship membership and onboarding state. */
export function useMe() {
  const signedIn = useSession((state) => state.status === 'signed-in');
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: ({ signal }) => getMe(getApiClient(), signal),
    enabled: signedIn,
  });
}
