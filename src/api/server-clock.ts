/**
 * The server's clock, as far as this phone can tell. Statuses and notes carry server
 * timestamps, so "10 minutes ago" must be measured against the server's "now", not a phone
 * clock that may be minutes off.
 */

/** A phone within this of the server needs no correction; `Date` only has one-second steps. */
const DEADBAND_MS = 2000;

/** Server time minus this phone's time, from the latest response `Date` header. */
let serverOffsetMs = 0;

export function getServerOffsetMs(): number {
  return serverOffsetMs;
}

/**
 * Records the offset from a response's `Date` header. `requestedAt` and `receivedAt` are this
 * phone's clock when the request left and when the response arrived; the header was written
 * somewhere in between.
 */
export function recordServerDate(
  header: string | null | undefined,
  requestedAt: number,
  receivedAt: number
): void {
  if (!header) return;
  const serverSecond = Date.parse(header);
  if (!Number.isFinite(serverSecond)) return;
  // The header drops the milliseconds, so the server's time is half a second past it on average.
  const offset = serverSecond + 500 - (requestedAt + receivedAt) / 2;
  serverOffsetMs = Math.abs(offset) < DEADBAND_MS ? 0 : Math.round(offset);
}

/** The current time by the server's clock, in epoch milliseconds. */
export function serverNow(): number {
  return Date.now() + serverOffsetMs;
}

/** Forgets the recorded offset, e.g. between tests. */
export function resetServerClock(): void {
  serverOffsetMs = 0;
}
