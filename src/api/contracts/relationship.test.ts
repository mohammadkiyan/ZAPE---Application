import { meSchema } from './auth';
import {
  RELATIONSHIP_ERROR_CODES,
  createRelationshipSchema,
  inviteCodeSchema,
  invitePreviewSchema,
  inviteSchema,
  relationshipErrorSchema,
  relationshipIdSchema,
  relationshipSchema,
} from './relationship';

const canvasStart = { date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' };

const canvasRelationship = {
  id: 'RLT-4K7Q-92MD',
  status: 'active',
  start: canvasStart,
  calendar: 'jalali',
  members: [
    { userId: 'm-1', name: 'محمد', joinedAt: '2021-03-14T17:00:00.000Z', isYou: true },
    { userId: 'm-2', name: 'سارا', joinedAt: '2021-03-15T08:00:00.000Z', isYou: false },
  ],
};

describe('relationship contract', () => {
  it('parses an active relationship', () => {
    expect(relationshipSchema.parse(canvasRelationship)).toMatchObject({
      id: 'RLT-4K7Q-92MD',
      calendar: 'jalali',
    });
  });

  it('parses a pending relationship with its invite', () => {
    const pending = relationshipSchema.parse({
      ...canvasRelationship,
      status: 'pending_partner',
      members: canvasRelationship.members.slice(0, 1),
      invite: { code: '7K4P9RM2', expiresAt: '2026-10-07T10:00:00.000Z' },
    });
    expect(pending.invite?.code).toBe('7K4P9RM2');
  });

  it('rejects more than two members, a bad start or an unknown zone', () => {
    const third = { ...canvasRelationship.members[0], userId: 'm-3', isYou: false };
    expect(
      relationshipSchema.safeParse({
        ...canvasRelationship,
        members: [...canvasRelationship.members, third],
      }).success
    ).toBe(false);
    for (const start of [
      { ...canvasStart, date: '2021-02-30' },
      { ...canvasStart, time: '24:00' },
      { ...canvasStart, timeZone: 'Mars/Olympus' },
    ]) {
      expect(createRelationshipSchema.safeParse({ start, calendar: 'jalali' }).success).toBe(false);
    }
  });

  it('accepts the create payload', () => {
    expect(
      createRelationshipSchema.parse({ start: canvasStart, calendar: 'gregorian' }).start.timeZone
    ).toBe('Asia/Tehran');
  });

  it('uses the unambiguous alphabet for codes and IDs', () => {
    expect(inviteCodeSchema.safeParse('7K4P9RM2').success).toBe(true);
    for (const code of ['7K4P9RM', '7K4P9RM0', '7K4P9RMO', '7K4P9RM1', '7K4P9RMI', '7k4p9rm2']) {
      expect(inviteCodeSchema.safeParse(code).success).toBe(false);
    }
    expect(relationshipIdSchema.safeParse('RLT-4K7Q-92MD').success).toBe(true);
    expect(relationshipIdSchema.safeParse('RS-LOVE-000123').success).toBe(false);
    expect(inviteSchema.safeParse({ code: '7K4P9RM2', expiresAt: 'soon' }).success).toBe(false);
  });

  it('parses an invite preview', () => {
    expect(
      invitePreviewSchema.parse({ creatorName: 'محمد', start: canvasStart, calendar: 'jalali' })
    ).toMatchObject({ creatorName: 'محمد' });
  });

  it('parses each relationship error code', () => {
    for (const code of RELATIONSHIP_ERROR_CODES) {
      expect(relationshipErrorSchema.parse({ code }).code).toBe(code);
    }
    expect(relationshipErrorSchema.safeParse({ code: 'otp_invalid' }).success).toBe(false);
  });

  it('carries the relationship reference on `me`', () => {
    const me = {
      user: { id: 'u1', name: 'محمد', phoneNumber: null, email: null },
      onboardingCompletedAt: null,
    };
    expect(
      meSchema.parse({ ...me, relationship: { id: 'RLT-4K7Q-92MD', status: 'pending_partner' } })
        .relationship?.status
    ).toBe('pending_partner');
    expect(
      meSchema.parse({
        ...me,
        relationship: { id: 'RLT-4K7Q-92MD', status: 'ended', endedBy: 'partner' },
      }).relationship?.endedBy
    ).toBe('partner');
    expect(meSchema.safeParse({ ...me, relationship: { id: 'r', status: 'paused' } }).success).toBe(
      false
    );
  });
});
