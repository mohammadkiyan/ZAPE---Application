import { useEffect, useState, type PropsWithChildren } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { ApiError } from '@/api/client';
import { refreshSession } from '@/api/endpoints/auth';
import {
  setAuthorizationProvider,
  setSessionClearedHandler,
  setSessionRefresher,
} from '@/api/session';
import { sessionStore } from './session-store';
import { signOutLocally } from './sign-out';

function authorization(): string | null {
  const credential = sessionStore.getState().credential;
  return credential ? `Bearer ${credential.accessToken}` : null;
}

/** Resolves false when the backend rejects the refresh token; throws when it can't be reached. */
export async function refreshStoredSession(): Promise<boolean> {
  const credential = sessionStore.getState().credential;
  if (!credential) return false;
  try {
    const next = await refreshSession(getApiClient(), credential.refreshToken);
    // The user may have signed out while the refresh was in flight.
    if (sessionStore.getState().credential !== credential) return false;
    await sessionStore.getState().setCredential(next);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status !== undefined && error.status < 500) return false;
    throw error;
  }
}

/** Plugs the auth feature into the API layer's session seam. */
export function installSession(queryClient: QueryClient): () => void {
  setAuthorizationProvider(authorization);
  setSessionRefresher(refreshStoredSession);
  setSessionClearedHandler(() => signOutLocally(queryClient));
  return () => {
    setAuthorizationProvider(() => null);
    setSessionRefresher(async () => false);
    setSessionClearedHandler(() => undefined);
  };
}

/**
 * Installs the session seam during the first render, before any child query can fire.
 * Must sit inside the QueryClientProvider.
 */
export function SessionBridge({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [uninstall] = useState(() => installSession(queryClient));
  useEffect(() => uninstall, [uninstall]);
  return children;
}
