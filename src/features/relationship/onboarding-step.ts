import { i18n } from '@/localization/i18n';
import { registerOnboardingStep } from '@/features/onboarding/steps';
import { formatStartDate } from '@/features/relationship-clock/format';
import { cachedRelationship } from './relationship-cache';
import { isOpenStatus } from './use-relationship';

/** Onboarding URL of the Relationship step; its create, invite and join screens sit below it. */
export const START_RELATIONSHIP_ROUTE = '/start-relationship';

/**
 * Step 2, mandatory: done once the account is in a relationship, as its creator waiting for
 * the partner or as an active member. An ended relationship brings the step back.
 */
registerOnboardingStep({
  id: 'relationship',
  order: 20,
  progress: 2,
  route: START_RELATIONSHIP_ROUTE as never,
  mandatory: true,
  isComplete: ({ me }) => isOpenStatus(me.relationship?.status),
  summary: ({ me, locale }) => {
    const relationship = cachedRelationship();
    if (!relationship || relationship.id !== me.relationship?.id) return null;
    const t = i18n.getFixedT(locale, 'relationship');
    return {
      id: 'relationship',
      label: t('ready.label'),
      value: t('ready.value', {
        date: formatStartDate(relationship.start, relationship.calendar, locale),
      }),
    };
  },
});
