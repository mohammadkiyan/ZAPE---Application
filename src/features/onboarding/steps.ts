import type { Href } from 'expo-router';
import type { TFunction } from 'i18next';
import type { Me } from '@/api/contracts/auth';
import type { AppLocale } from '@/localization/locale';
import type { LocalStep } from './local-step';

export interface OnboardingContext {
  me: Me;
  localStep: LocalStep | null;
}

/** One row of the Ready summary, e.g. «رابطه · از ۲۴ اسفند ۱۳۹۹». */
export interface ReadySummaryRow {
  /** The contributing step, e.g. `device` (Ready's headline changes when a device row is present). */
  id: string;
  label: string;
  value: string;
  /** `chip`: the burgundy pill with a dashed dot, as the canvas draws Our thread. */
  kind?: 'plain' | 'chip';
}

export interface OnboardingStep {
  id: string;
  /** Sort key: account 10, relationship 20, device 30, notifications 40. */
  order: number;
  /** Node on the four-node progress thread: 1 Account, 2 Relationship, 3 RelTime, 4 Notifications. */
  progress: 1 | 2 | 3 | 4;
  route: Href;
  /** Mandatory steps block Ready; the others show «بعداً». */
  mandatory: boolean;
  isComplete(context: OnboardingContext): boolean;
  summary?(
    context: OnboardingContext & { t: TFunction; locale: AppLocale }
  ): ReadySummaryRow | null;
}

/** Registered onboarding steps in `order`. Later changes add theirs with `registerOnboardingStep`. */
export const ONBOARDING_STEPS: OnboardingStep[] = [];

/** Adds a step, or replaces the one with the same id, keeping `ONBOARDING_STEPS` ordered. */
export function registerOnboardingStep(step: OnboardingStep): void {
  const existing = ONBOARDING_STEPS.findIndex((s) => s.id === step.id);
  if (existing >= 0) ONBOARDING_STEPS.splice(existing, 1);
  ONBOARDING_STEPS.push(step);
  ONBOARDING_STEPS.sort((a, b) => a.order - b.order);
}

/** Account is done once there is a session; its name prompt is tracked by the local step. */
registerOnboardingStep({
  id: 'account',
  order: 10,
  progress: 1,
  route: '/sign-in',
  mandatory: true,
  isComplete: () => true,
});
