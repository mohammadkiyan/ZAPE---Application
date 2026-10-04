import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import type { Mood, StatusBoard } from '@/api/contracts/status';
import { setStatus } from '@/api/endpoints/status';
import { createIdempotencyKey } from '@/api/idempotency';
import { serverNow } from '@/api/server-clock';
import { SET_STATUS_MUTATION_KEY, STATUS_BOARD_QUERY_KEY } from './use-status-board';

interface SetStatusVariables {
  mood: Mood;
  /** Made once per pick and kept across retries, so ZAPE records the save once. */
  idempotencyKey: string;
}

/**
 * Saves your status optimistically: the board shows the new mood at once, rolls back if ZAPE
 * rejects it, and is refetched either way. The server's timestamp replaces the local one.
 */
export function useSetStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: SET_STATUS_MUTATION_KEY,
    mutationFn: ({ mood, idempotencyKey }: SetStatusVariables) =>
      setStatus(getApiClient(), mood, idempotencyKey),
    onMutate: async ({ mood }) => {
      await queryClient.cancelQueries({ queryKey: STATUS_BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<StatusBoard>(STATUS_BOARD_QUERY_KEY);
      const at = new Date(serverNow()).toISOString();
      queryClient.setQueryData<StatusBoard>(STATUS_BOARD_QUERY_KEY, (board) =>
        board
          ? { ...board, you: { mood, at }, today: [{ owner: 'you', mood, at }, ...board.today] }
          : board
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(STATUS_BOARD_QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: STATUS_BOARD_QUERY_KEY }),
  });
  return {
    ...mutation,
    /** Starts one logical save of `mood`. */
    pick: (mood: Mood, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate({ mood, idempotencyKey: createIdempotencyKey() }, options),
  };
}
