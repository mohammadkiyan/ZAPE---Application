import type { Relationship } from '@/api/contracts/relationship';

/** The design canvas couple: «محمد» and «سارا», together since 1399-12-24 20:00 Tehran. */
export const canvasRelationship: Relationship = {
  id: 'RLT-4K7Q-92MD',
  status: 'active',
  start: { date: '2021-03-14', time: '20:00', timeZone: 'Asia/Tehran' },
  calendar: 'jalali',
  members: [
    { userId: 'm1', name: 'محمد', joinedAt: '2021-03-15T08:10:00.000Z', isYou: true },
    { userId: 'm2', name: 'سارا', joinedAt: '2021-03-15T09:42:00.000Z', isYou: false },
  ],
  invite: null,
};

/** The same relationship before the partner joined, as its creator sees it. */
export const pendingRelationship: Relationship = {
  ...canvasRelationship,
  status: 'pending_partner',
  members: canvasRelationship.members.slice(0, 1),
  invite: { code: '7K4P9RM2', expiresAt: '2026-10-03T20:00:00.000Z' },
};

/** 2026-09-26 23:31:11.508 in Tehran: the canvas screenshot moment. */
export const CANVAS_NOW = Date.UTC(2026, 8, 26, 20, 1, 11, 508);
