import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { sessionCredentialSchema, type SessionCredential } from '@/api/contracts/auth';
import { secureValueStore, type SecureValueStore } from '@/storage/secure-value-store';

/** SecureStore key for the session credential. Nothing else about the session is persisted. */
export const SESSION_KEY = 'zape.session';

export type SessionStatus = 'unknown' | 'signed-out' | 'signed-in';

export interface SessionState {
  status: SessionStatus;
  credential?: SessionCredential;
  /** Reads the stored credential once; an unreadable or corrupt value counts as signed out. */
  hydrate(): Promise<void>;
  /** Stores a new or rotated credential and marks the session signed in. */
  setCredential(credential: SessionCredential): Promise<void>;
  clear(): Promise<void>;
}

export function createSessionStore(storage: SecureValueStore = secureValueStore) {
  return createStore<SessionState>((set, get) => ({
    status: 'unknown',
    async hydrate() {
      if (get().status !== 'unknown') return;
      try {
        const raw = await storage.read(SESSION_KEY);
        const parsed = raw ? sessionCredentialSchema.safeParse(JSON.parse(raw)) : undefined;
        if (parsed?.success) {
          set({ status: 'signed-in', credential: parsed.data });
          return;
        }
        if (raw) await storage.clear(SESSION_KEY);
      } catch {
        // A failed read must not keep the splash up; the user signs in again.
      }
      set({ status: 'signed-out', credential: undefined });
    },
    async setCredential(credential) {
      await storage.write(SESSION_KEY, JSON.stringify(credential));
      set({ status: 'signed-in', credential });
    },
    async clear() {
      set({ status: 'signed-out', credential: undefined });
      await storage.clear(SESSION_KEY);
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
