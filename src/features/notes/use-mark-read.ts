import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { ApiError } from '@/api/client';
import { NOTE_VERSION_CHANGED, type Note, type NoteBoard } from '@/api/contracts/notes';
import { markNoteRead } from '@/api/endpoints/notes';
import { serverNow } from '@/api/server-clock';
import { NOTE_BOARD_QUERY_KEY, READ_NOTE_MUTATION_KEY } from './use-note-board';

/** How long the partner's note must stay visible on the Note tab before it counts as read. */
export const READ_AFTER_VISIBLE_MS = 1500;

/** Sets `seenAt` on the cached partner note, but only while it is still that version. */
function patchSeen(board: NoteBoard | undefined, noteId: string, seenAt: string | null) {
  return board?.partner?.id === noteId
    ? { ...board, partner: { ...board.partner, seenAt } }
    : board;
}

/**
 * Tells ZAPE a version of the partner's note was read. The badge clears at once; offline, the
 * receipt waits and is sent when the phone reconnects. If the author replaced the note in the
 * meantime ZAPE answers `note_version_changed`: nothing is marked and the board is refetched,
 * so the new version shows as unread.
 */
export function useMarkNoteRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: READ_NOTE_MUTATION_KEY,
    mutationFn: (noteId: string) => markNoteRead(getApiClient(), noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: NOTE_BOARD_QUERY_KEY });
      const seenAt = new Date(serverNow()).toISOString();
      queryClient.setQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY, (board) =>
        patchSeen(board, noteId, seenAt)
      );
    },
    onSuccess: (read) => {
      queryClient.setQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY, (board) =>
        patchSeen(board, read.id, read.seenAt)
      );
    },
    onError: (error, noteId) => {
      // A stale version needs no rollback: the refetch brings the replacement, unread.
      if (error instanceof ApiError && error.serverCode === NOTE_VERSION_CHANGED) return;
      queryClient.setQueryData<NoteBoard>(NOTE_BOARD_QUERY_KEY, (board) =>
        patchSeen(board, noteId, null)
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTE_BOARD_QUERY_KEY }),
  });
}

/**
 * Marks the partner's note read once it has been `visible` for 1.5 continuous seconds.
 * `visible` is the caller's judgement: the Note tab is focused, the app is in the foreground and
 * the card is on screen. Seeing the note anywhere else, such as Home, never counts.
 */
export function useMarkReadWhenVisible(note: Note | null | undefined, visible: boolean): void {
  const { mutate } = useMarkNoteRead();
  /** Versions already reported from this screen, so a failed receipt is not re-sent in a loop. */
  const reported = useRef(new Set<string>());
  const noteId = note && !note.seenAt ? note.id : undefined;
  useEffect(() => {
    if (!noteId || !visible || reported.current.has(noteId)) return;
    const timer = setTimeout(() => {
      reported.current.add(noteId);
      mutate(noteId);
    }, READ_AFTER_VISIBLE_MS);
    // Leaving the tab, backgrounding the app or scrolling the card away restarts the count.
    return () => clearTimeout(timer);
  }, [noteId, visible, mutate]);
}
