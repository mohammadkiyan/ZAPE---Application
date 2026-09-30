import type { Me } from '@/api/contracts/auth';
import '@/features/relationship/onboarding-step';
import { entryHref, progressFor, resolveEntry, stepAfter, type EntryInput } from './resolve-entry';
import { ONBOARDING_STEPS, registerOnboardingStep, type OnboardingStep } from './steps';

function me(
  overrides: { name?: string | null; relationship?: Me['relationship']; completed?: boolean } = {}
): Me {
  return {
    user: {
      id: 'u1',
      name: overrides.name === undefined ? 'محمد' : overrides.name,
      phoneNumber: '+989123456789',
      email: null,
    },
    relationship: overrides.relationship ?? null,
    onboardingCompletedAt: overrides.completed ? '2026-09-01T10:00:00.000Z' : null,
  };
}

/** The full journey once the later changes register their steps. */
const steps: OnboardingStep[] = [
  ONBOARDING_STEPS.find((s) => s.id === 'account')!,
  ONBOARDING_STEPS.find((s) => s.id === 'relationship')!,
  {
    id: 'device',
    order: 30,
    progress: 3,
    route: '/device' as never,
    mandatory: false,
    isComplete: () => false,
  },
  {
    id: 'notifications',
    order: 40,
    progress: 4,
    route: '/notifications' as never,
    mandatory: false,
    isComplete: () => false,
  },
];

const inRelationship = { relationship: { id: 'r1', status: 'active' as const } };

describe('resolveEntry', () => {
  it.each<[string, Omit<EntryInput, 'steps'>, string]>([
    ['session not read yet', { session: 'unknown', me: undefined, localStep: null }, 'loading'],
    [
      'signed out, first launch',
      { session: 'signed-out', me: undefined, localStep: null },
      'welcome',
    ],
    [
      'signed out after Welcome (direction reload)',
      { session: 'signed-out', me: undefined, localStep: 'account' },
      'sign-in',
    ],
    [
      'signed out with a stale resume point',
      { session: 'signed-out', me: undefined, localStep: 'device' },
      'welcome',
    ],
    [
      'signed in, profile loading',
      { session: 'signed-in', me: undefined, localStep: null },
      'loading',
    ],
    [
      'signed in offline after onboarding',
      { session: 'signed-in', me: undefined, localStep: 'done' },
      'main',
    ],
    [
      'new account without a name',
      { session: 'signed-in', me: me({ name: null }), localStep: 'name' },
      'name',
    ],
    [
      'new account with a blank name',
      { session: 'signed-in', me: me({ name: '  ' }), localStep: 'name' },
      'name',
    ],
    [
      'returning account without a name is not asked',
      { session: 'signed-in', me: me({ name: null }), localStep: null },
      'relationship',
    ],
    ['no relationship', { session: 'signed-in', me: me(), localStep: null }, 'relationship'],
    [
      'no relationship even though a later step was recorded',
      { session: 'signed-in', me: me(), localStep: 'notifications' },
      'relationship',
    ],
    [
      'mid-flow reload on RelTime',
      { session: 'signed-in', me: me(inRelationship), localStep: 'device' },
      'device',
    ],
    [
      'mid-flow reload after skipping RelTime',
      { session: 'signed-in', me: me(inRelationship), localStep: 'notifications' },
      'notifications',
    ],
    [
      'reload on Ready',
      { session: 'signed-in', me: me(inRelationship), localStep: 'ready' },
      'ready',
    ],
    [
      'relationship done, no resume point',
      { session: 'signed-in', me: me(inRelationship), localStep: null },
      'device',
    ],
    [
      'completed onboarding (new phone)',
      { session: 'signed-in', me: me({ ...inRelationship, completed: true }), localStep: null },
      'main',
    ],
    [
      'completed onboarding wins over a stale resume point',
      { session: 'signed-in', me: me({ ...inRelationship, completed: true }), localStep: 'name' },
      'main',
    ],
    [
      'creator waiting for the partner',
      {
        session: 'signed-in',
        me: me({ relationship: { id: 'r1', status: 'pending_partner' } }),
        localStep: 'relationship',
      },
      'device',
    ],
    [
      'relationship ended after onboarding',
      {
        session: 'signed-in',
        me: me({
          relationship: { id: 'r1', status: 'ended', endedBy: 'partner' },
          completed: true,
        }),
        localStep: 'done',
      },
      'relationship',
    ],
    [
      'new relationship after an ended one',
      {
        session: 'signed-in',
        me: me({ relationship: { id: 'r2', status: 'pending_partner' }, completed: true }),
        localStep: 'done',
      },
      'main',
    ],
  ])('%s → %s', (_, input, expected) => {
    expect(resolveEntry({ ...input, steps })).toBe(expected);
  });

  it('goes to Ready when only the Account step is registered', () => {
    expect(
      resolveEntry({ session: 'signed-in', me: me(), localStep: null, steps: steps.slice(0, 1) })
    ).toBe('ready');
  });

  it('registers the Relationship step as mandatory step 2', () => {
    expect(ONBOARDING_STEPS.map((s) => s.id)).toEqual(['account', 'relationship']);
    expect(ONBOARDING_STEPS[1]).toMatchObject({ order: 20, progress: 2, mandatory: true });
  });

  it('maps entries to routes and progress nodes', () => {
    expect(entryHref('welcome', steps)).toBe('/welcome');
    expect(entryHref('main', steps)).toBe('/');
    expect(entryHref('relationship', steps)).toBe('/start-relationship');
    expect(progressFor('sign-in', steps)).toBe(1);
    expect(progressFor('relationship', steps)).toBe(2);
    expect(progressFor('ready', steps)).toBe(5);
    expect(progressFor('welcome', steps)).toBe(0);
  });

  it('knows which step follows another', () => {
    expect(stepAfter('device', steps)).toBe('notifications');
    expect(stepAfter('notifications', steps)).toBe('ready');
  });
});

describe('registerOnboardingStep', () => {
  it('keeps steps ordered and replaces a step registered twice', () => {
    const before = [...ONBOARDING_STEPS];
    registerOnboardingStep({ ...steps[3]! });
    registerOnboardingStep({ ...steps[1]! });
    registerOnboardingStep({ ...steps[1]!, mandatory: false });
    expect(ONBOARDING_STEPS.map((s) => s.id)).toEqual(['account', 'relationship', 'notifications']);
    expect(ONBOARDING_STEPS[1]!.mandatory).toBe(false);
    ONBOARDING_STEPS.splice(0, ONBOARDING_STEPS.length, ...before);
  });
});
