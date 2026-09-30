import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import type { Me } from '@/api/contracts/auth';
import { ME_QUERY_KEY } from '@/features/auth/use-me';
import { localStepStore } from './local-step';
import { entryHref, resolveEntry, stepAfter } from './resolve-entry';

/**
 * For registered step screens, which navigate themselves: records the step as passed and
 * replaces the screen with wherever the gate would now send this person (the next step,
 * Ready, or Home for an account that finished onboarding earlier).
 */
export function useFinishStep(stepId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async (latest?: Me) => {
    const me = latest ?? queryClient.getQueryData<Me>(ME_QUERY_KEY);
    const next = me?.onboardingCompletedAt ? 'done' : stepAfter(stepId);
    await localStepStore.getState().setStep(next);
    const entry = resolveEntry({ session: 'signed-in', me, localStep: next });
    router.replace(entryHref(entry === 'loading' ? 'ready' : entry));
  };
}
