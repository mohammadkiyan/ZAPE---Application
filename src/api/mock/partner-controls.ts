import type { AppLocale } from '@/localization/locale';
import { mockStore, type MockState } from './state';

/**
 * A development-only action that plays the partner's half of a two-person flow against
 * the mock backend (join, set a status, leave a note, answer a proposal, …). Feature
 * changes register their own controls next to their mock handlers.
 */
export interface PartnerControl {
  id: string;
  label: Record<AppLocale, string>;
  run(state: MockState): void | Promise<void>;
}

const controls = new Map<string, PartnerControl>();

export function registerPartnerControl(control: PartnerControl): void {
  controls.set(control.id, control);
}

export function listPartnerControls(): PartnerControl[] {
  return [...controls.values()];
}

/** Runs a control against the persisted mock state and saves the result. */
export async function runPartnerControl(id: string): Promise<void> {
  const control = controls.get(id);
  if (!control) throw new Error(`Unknown partner control: ${id}`);
  const state = await mockStore.load();
  await control.run(state);
  await mockStore.save();
}
