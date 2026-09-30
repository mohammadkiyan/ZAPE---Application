import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

/**
 * Longest the gate waits for the ident, in case its frames never run (e.g. the app launched in
 * the background); well past the ~2.9s build.
 */
export const IDENT_HOLD_TIMEOUT_MS = 5000;

interface IdentHoldState {
  /** The loader is on screen and its logo motion has not finished building yet. */
  holding: boolean;
}

export const identHoldStore = createStore<IdentHoldState>(() => ({ holding: false }));

let fallback: ReturnType<typeof setTimeout> | undefined;

/** Keeps the gate on the loader from the moment it appears. */
export function holdForIdent(): void {
  clearTimeout(fallback);
  fallback = setTimeout(releaseIdentHold, IDENT_HOLD_TIMEOUT_MS);
  identHoldStore.setState({ holding: true });
}

/** Lets the gate move on: the ident finished its build, or the loader left the screen. */
export function releaseIdentHold(): void {
  clearTimeout(fallback);
  fallback = undefined;
  identHoldStore.setState({ holding: false });
}

export function useIdentHold(): boolean {
  return useStore(identHoldStore, (state) => state.holding);
}
