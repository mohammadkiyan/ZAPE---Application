import type { QueryClient } from '@tanstack/react-query';
import type { Me } from '@/api/contracts/auth';
import { sessionStore } from '@/features/auth/session-store';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { localStepStore, type LocalStep } from '@/features/onboarding/local-step';

export function testMe(overrides: Partial<Me> & { name?: string | null } = {}): Me {
  const { name, ...rest } = overrides;
  return {
    user: {
      id: 'user-test',
      name: name === undefined ? 'محمد' : name,
      phoneNumber: '+989121234567',
      email: null,
    },
    relationship: null,
    onboardingCompletedAt: null,
    ...rest,
  };
}

/** Puts the session gate in a known state without touching secure storage. */
export function seedSession(
  queryClient: QueryClient,
  { me, localStep = null }: { me?: Me | null; localStep?: LocalStep | null } = {}
): void {
  localStepStore.setState({ step: localStep, isHydrated: true });
  if (me === null || me === undefined) {
    sessionStore.setState({ status: 'signed-out', credential: undefined });
    return;
  }
  sessionStore.setState({
    status: 'signed-in',
    credential: { accessToken: 'test-access', refreshToken: 'test-refresh' },
  });
  queryClient.setQueryData(ME_QUERY_KEY, me);
}

/** A signed-in account that finished onboarding: the gate opens the tabs. */
export function seedOnboarded(queryClient: QueryClient): void {
  seedSession(queryClient, {
    me: testMe({
      relationship: { id: 'rel-1', status: 'active' },
      onboardingCompletedAt: '2026-09-01T10:00:00.000Z',
    }),
    localStep: 'done',
  });
}
