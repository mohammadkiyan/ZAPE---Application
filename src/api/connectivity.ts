import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

function subscribe(onChange: () => void): () => void {
  return onlineManager.subscribe(onChange);
}

function getOnline(): boolean {
  return onlineManager.isOnline();
}

/** Whether the phone has a connection, as TanStack Query's online manager sees it. */
export function useConnectivity(): { online: boolean } {
  const online = useSyncExternalStore(subscribe, getOnline, getOnline);
  return { online };
}
