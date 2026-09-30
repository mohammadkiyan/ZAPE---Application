import { useEffect } from 'react';
import type { Href } from 'expo-router';
import { useMe } from '@/features/auth/use-me';
import { useSession } from '@/features/auth/session-store';
import { useIdentHold } from './ident-hold';
import { localStepStore, useLocalStep } from './local-step';
import { resolveEntry, type Entry } from './resolve-entry';

/** The session gate's decision for this render, plus the `me` query it was made from. */
export function useEntry() {
  const session = useSession((state) => state.status);
  const localStep = useLocalStep();
  const meQuery = useMe();
  const holding = useIdentHold();
  const me = session === 'signed-in' ? meQuery.data : undefined;
  const resolved = resolveEntry({ session, me, localStep });
  // Once the loader appears it stays until its logo motion is complete, however fast the load.
  const entry: Entry = holding ? 'loading' : resolved;
  const completed = Boolean(me?.onboardingCompletedAt);

  useEffect(() => {
    // Lets a later offline launch open Home without waiting for `GET /me`.
    if (completed && localStep !== 'done') void localStepStore.getState().setStep('done');
  }, [completed, localStep]);

  return { entry, session, meQuery };
}

let deferredLink: Href | null = null;

/** Remembers a main-screen link opened before the gate allowed it. */
export function deferDeepLink(href: Href): void {
  deferredLink = href;
}

/** The deferred link, once; null when there is none. */
export function takeDeferredLink(): Href | null {
  const href = deferredLink;
  deferredLink = null;
  return href;
}
