/**
 * The identity of one logical save. Create it once, when the user acts, and send it as
 * `Idempotency-Key` on every attempt of that save: ZAPE then records the save once however many
 * times a lost response makes the phone retry. `X-Request-Id` is a different thing, new on each
 * attempt, and only traces a request.
 */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

export function createIdempotencyKey(): string {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) return random;
  const part = () => Math.random().toString(36).slice(2, 12).padEnd(10, '0');
  return `${Date.now().toString(36)}-${part()}-${part()}`;
}
