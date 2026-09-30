import { INVITE_CODE_LENGTH, inviteCodeSchema } from '@/api/contracts/relationship';
import { toAsciiDigits } from '@/localization/format';

/**
 * What the user typed, as the backend expects it: Persian and Arabic-Indic digits folded to
 * ASCII, letters upper-cased, spaces and dashes dropped. `۷k4p ۹rm2` → `7K4P9RM2`.
 */
export function normalizeInviteCode(input: string): string {
  return toAsciiDigits(input)
    .toUpperCase()
    .replace(/[\s‌‏‎-]/g, '');
}

export type CodeState = 'incomplete' | 'malformed' | 'complete';

/** Whether a normalized code can be looked up yet. */
export function codeState(code: string): CodeState {
  if (code.length < INVITE_CODE_LENGTH) return 'incomplete';
  return inviteCodeSchema.safeParse(code).success ? 'complete' : 'malformed';
}
