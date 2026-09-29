import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

/** AsyncStorage key for where onboarding resumes on this phone. Not a secret. */
export const ONBOARDING_STEP_KEY = 'zape.onboarding.step';

/**
 * - `account`: Welcome was passed (survives the direction reload).
 * - `name`: a new account still has to pick a display name.
 * - a registered step id, or `ready`: the step the user was on.
 * - `done`: onboarding was seen complete, so an offline launch can open Home.
 */
export type LocalStep = string;

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LocalStepState {
  step: LocalStep | null;
  hydrated: boolean;
  hydrate(): Promise<void>;
  /** Persists before resolving, so a reload right after still sees it. */
  setStep(step: LocalStep): Promise<void>;
  clear(): Promise<void>;
}

export function createLocalStepStore(storage: Storage = AsyncStorage) {
  return createStore<LocalStepState>((set, get) => ({
    step: null,
    hydrated: false,
    async hydrate() {
      if (get().hydrated) return;
      try {
        set({ step: await storage.getItem(ONBOARDING_STEP_KEY), hydrated: true });
      } catch {
        set({ step: null, hydrated: true });
      }
    },
    async setStep(step) {
      await storage.setItem(ONBOARDING_STEP_KEY, step);
      set({ step });
    },
    async clear() {
      set({ step: null });
      await storage.removeItem(ONBOARDING_STEP_KEY);
    },
  }));
}

export const localStepStore = createLocalStepStore();

export function useLocalStep(): LocalStep | null {
  return useStore(localStepStore, (state) => state.step);
}

export function hydrateLocalStep(): Promise<void> {
  return localStepStore.getState().hydrate();
}
