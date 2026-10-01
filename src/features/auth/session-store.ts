import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { sessionCredentialSchema, type SessionCredential } from '@/api/contracts/auth';
import { secureValueStore, type SecureValueStore } from '@/storage/secure-value-store';

/** SecureStore key for the session credential. Nothing else about the session is persisted. */
export const SESSION_KEY = 'zape.session';

export const SESSION_STATUSES = {
  UNKNOWN: 'unknown' as const,
  SIGNED_OUT: 'signed-out' as const,
  SIGNED_IN: 'signed-in' as const,
} as const;

export type SessionStatus = (typeof SESSION_STATUSES)[keyof typeof SESSION_STATUSES];

export interface SessionState {
  status: SessionStatus;
  credential?: SessionCredential;

  /** In each application start, reads the stored credential once; an unreadable or corrupt value counts as signed out. */
  hydrate(): Promise<void>;

  setCredential(credential: SessionCredential): Promise<void>;
  unsetCredential(): Promise<void>;
}

export function createSessionStore(storage: SecureValueStore = secureValueStore) {
  return createStore<SessionState>((set, get) => ({
    status: 'unknown',
    async hydrate() {
      const current = get();
      if (current.status !== 'unknown') return;
      try {
        const raw = await storage.read(SESSION_KEY);
        const parsed = raw ? sessionCredentialSchema.safeParse(JSON.parse(raw)) : undefined;
        if (parsed?.success) {
          set({ status: 'signed-in', credential: parsed.data });
          return;
        }
        if (raw) await current.unsetCredential();
        else set({ status: 'signed-out' });
      } catch (error) {
        console.error(error);
        // A failed read must not keep the splash up; the user signs in again.
        await current.unsetCredential();
      }
    },
    async setCredential(credential) {
      await storage.write(SESSION_KEY, JSON.stringify(credential));
      set({ status: 'signed-in', credential });
    },
    async unsetCredential() {
      await storage.clear(SESSION_KEY);
      set({ status: 'signed-out', credential: undefined });
    },
  }));
}

export const sessionStore = createSessionStore();

export function useSession<T>(selector: (state: SessionState) => T): T {
  return useStore(sessionStore, selector);
}

export function hydrateSession(): Promise<void> {
  return sessionStore.getState().hydrate();
}
