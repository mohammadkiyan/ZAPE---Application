import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import type { Note, NoteBoard } from '@/api/contracts/notes';
import { saveNote } from '@/api/endpoints/notes';
import { serverNow } from '@/api/server-clock';
import { NOTE_BOARD_QUERY_KEY, SAVE_NOTE_MUTATION_KEY } from './use-note-board';

interface SaveNoteVariables {
  text: string;
  /** One per logical save, kept across retries, so ZAPE creates one version. */
  idempotencyKey: string;
}

/**
 * Saves your note optimistically: the board shows the new text at once, without a seen receipt
 * because a new version starts unread. A rejected save rolls back; either way the board is
 * refetched and ZAPE's version (id, time, `edited`) replaces the local one.
 */
export function useSaveNote() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: SAVE_NOTE_MUTATION_KEY,
    mutationFn: ({ text, idempotencyKey }: SaveNoteVariables) =>
      saveNote(getApiClient(), text, idempotencyKey),
    onMutate: async ({ text, idempotencyKey }) => {
      await queryClient.cancelQueries({ queryKey: NOTE_BOARD_QUERY_KEY });
      const previous = queryClient.getQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY);
      queryClient.setQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY, (board) =>
        board
          ? {
              ...board,
              you: {
                // A placeholder until ZAPE assigns the version id.
                id: `pending:${idempotencyKey}`,
                text: text.trim(),
                updatedAt: new Date(serverNow()).toISOString(),
                edited: Boolean(board.you),
                seenAt: null,
              },
            }
          : board
      );
      return { previous };
    },
    onSuccess: (note: Note) => {
      queryClient.setQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY, (board) =>
        board ? { ...board, you: note } : board
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(NOTE_BOARD_QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTE_BOARD_QUERY_KEY }),
  });
  return {
    ...mutation,
    save: (variables: SaveNoteVariables, options?: Parameters<typeof mutation.mutate>[1]) =>
      mutation.mutate(variables, options),
  };
}
