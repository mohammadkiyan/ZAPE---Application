import type { QueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/backend';
import { signOut as signOutRemote } from '@/api/endpoints/auth';
import { localStepStore } from '@/features/onboarding/local-step';
import { sessionStore } from './session-store';

/**
 * Ends the session on this phone: deletes the credential, drops every cached query and the
 * onboarding resume point. Locale and clock theme are preferences and stay. The session gate
 * then shows Welcome.
 */
export async function signOutLocally(queryClient: QueryClient): Promise<void> {
  // Not cancelQueries(): a reverted fetch would hand its caller the previous account's data.
  queryClient.clear();
  await Promise.allSettled([sessionStore.getState().clear(), localStepStore.getState().clear()]);
}

/** Revokes the session on the backend (best effort), then signs out locally. */
export async function signOut(queryClient: QueryClient): Promise<void> {
  try {
    await signOutRemote(getApiClient());
  } catch {
    // An unreachable backend must not keep the user signed in on this phone.
  }
  await signOutLocally(queryClient);
}
