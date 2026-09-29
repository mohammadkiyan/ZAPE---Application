import { e164Schema } from '@/api/contracts/auth';
import { toAsciiDigits } from '@/localization/format';

/**
 * Normalizes what a person typed to E.164, exactly as zape.house does
 * (`normalizePhoneNumber` in the web app): Persian digits, separators, and Iranian
 * local forms such as `0912…`, `912…` and `98912…`.
 */
export function normalizePhoneNumber(raw: string): string {
  const cleaned = toAsciiDigits(raw).replace(/[\s\-().]/g, '');
  if (/^09\d{9}$/.test(cleaned)) return `+98${cleaned.slice(1)}`;
  if (/^989\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^9\d{9}$/.test(cleaned)) return `+98${cleaned}`;
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/** The E.164 number to send, or null when the input can't be a phone number. */
export function parsePhoneNumber(raw: string): string | null {
  const normalized = normalizePhoneNumber(raw);
  return e164Schema.safeParse(normalized).success ? normalized : null;
}

/** Keeps only the digits of a one-time code, whatever keyboard typed them; at most six. */
export function sanitizeCode(raw: string): string {
  return toAsciiDigits(raw).replace(/\D/g, '').slice(0, 6);
}
