import { z } from 'zod';

/** Invite codes and relationship IDs avoid look-alikes: no 0/O and no 1/I/L. */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const INVITE_CODE_LENGTH = 8;
export const inviteCodeSchema = z.string().regex(/^[2-9A-HJKMNP-Z]{8}$/);

/** `RLT-4K7Q-92MD`: shown on the Relationship screen and copyable. */
export const relationshipIdSchema = z.string().regex(/^RLT-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);

export const RELATIONSHIP_STATUSES = ['pending_partner', 'active', 'ended'] as const;
export const relationshipStatusSchema = z.enum(RELATIONSHIP_STATUSES);
export type RelationshipStatus = z.infer<typeof relationshipStatusSchema>;

export const calendarSchema = z.enum(['jalali', 'gregorian']);
export type RelationshipCalendar = z.infer<typeof calendarSchema>;

const isoDateSchema = z.iso.date();
const clockTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
/** An IANA zone the phone's `Intl` can resolve, e.g. `Asia/Tehran`. */
const timeZoneSchema = z.string().refine((zone) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}, 'Unknown time zone');

/**
 * The shared start moment: a Gregorian wall-clock date and time in an IANA zone, never a UTC
 * instant, so the count stays stable across DST rule changes.
 */
export const relationshipStartSchema = z.object({
  date: isoDateSchema,
  time: clockTimeSchema,
  timeZone: timeZoneSchema,
});
export type RelationshipStart = z.infer<typeof relationshipStartSchema>;

export const relationshipMemberSchema = z.object({
  /** Opaque and relationship-scoped; not the account id. */
  userId: z.string().min(1),
  name: z.string().nullable(),
  joinedAt: z.iso.datetime(),
  isYou: z.boolean(),
});
export type RelationshipMember = z.infer<typeof relationshipMemberSchema>;

export const inviteSchema = z.object({
  code: inviteCodeSchema,
  expiresAt: z.iso.datetime(),
});
export type Invite = z.infer<typeof inviteSchema>;

export const relationshipSchema = z.object({
  id: relationshipIdSchema,
  status: relationshipStatusSchema,
  start: relationshipStartSchema,
  calendar: calendarSchema,
  members: z.array(relationshipMemberSchema).min(1).max(2),
  /** Only for the creator while the partner has not joined. */
  invite: inviteSchema.nullable().optional(),
});
export type Relationship = z.infer<typeof relationshipSchema>;

export const createRelationshipSchema = z.object({
  start: relationshipStartSchema,
  calendar: calendarSchema,
});
export type CreateRelationship = z.infer<typeof createRelationshipSchema>;

/** What a joining user sees before accepting. */
export const invitePreviewSchema = z.object({
  creatorName: z.string().nullable(),
  start: relationshipStartSchema,
  calendar: calendarSchema,
});
export type InvitePreview = z.infer<typeof invitePreviewSchema>;

/** The relationship reference on `GET /me`. */
export const meRelationshipSchema = z.object({
  id: z.string().min(1),
  status: relationshipStatusSchema,
  /** Once ended: who ended it, so the ended member can be told. */
  endedBy: z.enum(['you', 'partner']).nullable().optional(),
});
export type MeRelationship = z.infer<typeof meRelationshipSchema>;

/**
 * `code` values on relationship errors:
 * - `invite_invalid` (404): no such code
 * - `invite_expired` / `invite_used` (410)
 * - `already_in_relationship` (409): create or accept while in an active or pending relationship
 */
export const RELATIONSHIP_ERROR_CODES = [
  'invite_invalid',
  'invite_expired',
  'invite_used',
  'already_in_relationship',
] as const;
export type RelationshipErrorCode = (typeof RELATIONSHIP_ERROR_CODES)[number];
export const relationshipErrorSchema = z.object({
  message: z.string().optional(),
  code: z.enum(RELATIONSHIP_ERROR_CODES),
});

/** `code` on a 404 from `GET /relationships/current`: the account has no open relationship. */
export const NO_RELATIONSHIP = 'no_relationship';
