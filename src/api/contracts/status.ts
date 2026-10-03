import { z } from 'zod';

/** The ten moods, in the order the picker shows them. */
export const MOODS = [
  'happy',
  'calm',
  'loved',
  'missing',
  'focused',
  'tired',
  'sad',
  'upset',
  'stressed',
  'unwell',
] as const;
export const moodSchema = z.enum(MOODS);
export type Mood = z.infer<typeof moodSchema>;

/** A person's current status; `at` is ZAPE's time of the write, never the phone's. */
export const statusSchema = z.object({
  mood: moodSchema,
  at: z.iso.datetime(),
});
export type Status = z.infer<typeof statusSchema>;

export const statusEventSchema = statusSchema.extend({
  owner: z.enum(['you', 'partner']),
});
export type StatusEvent = z.infer<typeof statusEventSchema>;

/**
 * `GET /relationships/current/statuses`. `today` is both people's changes on the current
 * calendar day of the relationship's time zone, newest first, so both phones agree on it.
 */
export const statusBoardSchema = z.object({
  you: statusSchema.nullable(),
  partner: statusSchema.nullable(),
  today: z.array(statusEventSchema),
});
export type StatusBoard = z.infer<typeof statusBoardSchema>;

/** `PUT /me/status`. Only the mood: the owner is the session and the time is the server's. */
export const setStatusSchema = z.object({ mood: moodSchema });
export type SetStatus = z.infer<typeof setStatusSchema>;

/**
 * `code` values on status errors:
 * - `invalid_mood` (400): a mood outside the catalog
 * - `idempotency_key_required` (400): the save carried no usable `Idempotency-Key`
 * - `idempotency_key_reused` (422): the key was already used for a different save
 */
export const STATUS_ERROR_CODES = [
  'invalid_mood',
  'idempotency_key_required',
  'idempotency_key_reused',
] as const;
export type StatusErrorCode = (typeof STATUS_ERROR_CODES)[number];
