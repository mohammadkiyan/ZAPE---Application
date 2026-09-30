import type { Href } from 'expo-router';
import type { Me } from '@/api/contracts/auth';
import type { SessionStatus } from '@/features/auth/session-store';
import type { LocalStep } from './local-step';
import { ONBOARDING_STEPS, type OnboardingStep } from './steps';

/** Fixed destinations, or the id of a registered onboarding step. */
export type Entry = 'loading' | 'welcome' | 'sign-in' | 'name' | 'ready' | 'main' | (string & {});

export interface EntryInput {
  session: SessionStatus;
  /** `GET /me`, when loaded. */
  me: Me | undefined;
  localStep: LocalStep | null;
  steps?: readonly OnboardingStep[];
}

/** Where this person belongs right now. Used at launch, after sign-in and after every step. */
export function resolveEntry({
  session,
  me,
  localStep,
  steps = ONBOARDING_STEPS,
}: EntryInput): Entry {
  return 'loading'
  if (session === 'unknown') return 'loading';
  if (session === 'signed-out') return localStep === 'account' ? 'sign-in' : 'welcome';
  // Offline launch: trust the last onboarding state seen on this phone.
  if (!me) return localStep === 'done' ? 'main' : 'loading';
  const context = { me, localStep };
  const missing = steps.find((step) => step.mandatory && !step.isComplete(context));
  // A mandatory step can come undone after onboarding (an ended relationship).
  if (me.onboardingCompletedAt) return missing?.id ?? 'main';
  if (localStep === 'name' && !me.user.name?.trim()) return 'name';
  if (missing) return missing.id;
  if (localStep === 'ready') return 'ready';
  // Resume where the user was; steps skipped before it stay skipped.
  const from = Math.max(
    0,
    steps.findIndex((step) => step.id === localStep)
  );
  return steps.slice(from).find((step) => !step.isComplete(context))?.id ?? 'ready';
}

const FIXED_HREFS: Record<string, Href> = {
  welcome: '/welcome',
  'sign-in': '/sign-in',
  name: '/name',
  ready: '/ready',
  main: '/',
};

export function entryHref(entry: Entry, steps: readonly OnboardingStep[] = ONBOARDING_STEPS): Href {
  return FIXED_HREFS[entry] ?? steps.find((step) => step.id === entry)?.route ?? '/welcome';
}

/** The local step that follows `stepId`: the next registered step, or Ready. */
export function stepAfter(
  stepId: string,
  steps: readonly OnboardingStep[] = ONBOARDING_STEPS
): LocalStep {
  const index = steps.findIndex((step) => step.id === stepId);
  return steps[index + 1]?.id ?? 'ready';
}

/** Progress node for an entry: 0 on Welcome, 5 on Ready. */
export function progressFor(entry: Entry, steps: readonly OnboardingStep[] = ONBOARDING_STEPS) {
  if (entry === 'ready' || entry === 'main') return 5;
  if (entry === 'sign-in' || entry === 'name') return 1;
  return steps.find((step) => step.id === entry)?.progress ?? 0;
}
