import {
  MOODS,
  moodSchema,
  statusBoardSchema,
  statusSchema,
  type Mood,
  type Status,
} from '../../contracts/status';
import { registerPartnerControl } from '../partner-controls';
import { MockHttpError, registerMockRoute } from '../router';
import type { MockState } from '../state';
import { MOCK_CANVAS_RELATIONSHIP_ID, authorize } from './auth';
import { boardContext, canvasCouple, mutationKey, partnerContext } from './boards';
import { todayIn } from './relationship';

interface MockStatusEvent {
  relationshipId: string;
  accountId: string;
  mood: Mood;
  /** Server time of the write. */
  at: string;
  /** The save's `Idempotency-Key`; absent on seeded and partner-control events. */
  key?: string;
}

export interface MockStatusSlice {
  /** Append-only, oldest first. A person's current status is their latest event. */
  events: MockStatusEvent[];
}

const MINUTE = 60_000;

/** The status slice, seeded with the canvas afternoon: «شاد» ten minutes ago, «آرام» before it. */
export function mockStatuses(state: MockState): MockStatusSlice {
  if (!state.statuses) {
    const slice: MockStatusSlice = { events: [] };
    const couple = canvasCouple(state);
    if (couple) {
      const [you, partner] = couple;
      const now = Date.now();
      const seed: [minutesAgo: number, accountId: string, mood: Mood][] = [
        [403, you, 'calm'],
        [357, partner, 'tired'],
        [249, you, 'focused'],
        [154, partner, 'happy'],
        [115, you, 'missing'],
        [32, partner, 'calm'],
        [10, you, 'happy'],
      ];
      for (const [minutesAgo, accountId, mood] of seed) {
        slice.events.push({
          relationshipId: MOCK_CANVAS_RELATIONSHIP_ID,
          accountId,
          mood,
          at: new Date(now - minutesAgo * MINUTE).toISOString(),
        });
      }
    }
    state.statuses = slice;
  }
  return state.statuses as MockStatusSlice;
}

function latest(
  events: MockStatusEvent[],
  relationshipId: string,
  accountId: string | undefined
): Status | null {
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index]!;
    if (event.relationshipId === relationshipId && event.accountId === accountId) {
      return { mood: event.mood, at: event.at };
    }
  }
  return null;
}

registerMockRoute('GET /relationships/current/statuses', (request, state) => {
  const { relationship, youId, partnerId } = boardContext(request, state);
  const { events } = mockStatuses(state);
  const today = todayIn(relationship.start.timeZone);
  return {
    body: statusBoardSchema.parse({
      you: latest(events, relationship.id, youId),
      partner: latest(events, relationship.id, partnerId),
      // Today is the relationship zone's calendar day, so both phones list the same entries.
      today: events
        .filter(
          (event) =>
            event.relationshipId === relationship.id &&
            (event.accountId === youId || event.accountId === partnerId) &&
            todayIn(relationship.start.timeZone, new Date(event.at)) === today
        )
        .map((event) => ({
          owner: event.accountId === youId ? 'you' : 'partner',
          mood: event.mood,
          at: event.at,
        }))
        .reverse(),
    }),
  };
});

registerMockRoute('PUT /me/status', (request, state) => {
  // ZAPE's order: the session, the key, the mood, then the relationship.
  authorize(request, state);
  const key = mutationKey(request);
  // Only the mood is read: an owner or a time in the body is ignored, as on ZAPE.
  const mood = moodSchema.safeParse((request.body as { mood?: unknown } | undefined)?.mood);
  if (!mood.success) throw new MockHttpError(400, 'invalid mood', 'invalid_mood');
  const { relationship, youId } = boardContext(request, state);
  const { events } = mockStatuses(state);
  const earlier = events.find(
    (event) =>
      event.relationshipId === relationship.id && event.accountId === youId && event.key === key
  );
  if (earlier) {
    if (earlier.mood !== mood.data) {
      throw new MockHttpError(422, 'idempotency key reused', 'idempotency_key_reused');
    }
    // A retry of the same save: the first result, and no second history entry.
    return { body: statusSchema.parse({ mood: earlier.mood, at: earlier.at }) };
  }
  const event: MockStatusEvent = {
    relationshipId: relationship.id,
    accountId: youId,
    mood: mood.data,
    at: new Date().toISOString(),
    key,
  };
  events.push(event);
  return { body: statusSchema.parse({ mood: event.mood, at: event.at }) };
});

registerPartnerControl({
  id: 'status.partner-sets',
  label: { fa: 'همراه حالش را می‌گذارد', en: 'Partner sets a status' },
  run(state) {
    const context = partnerContext(state);
    if (!context) return;
    const { events } = mockStatuses(state);
    const current = latest(events, context.relationship.id, context.partnerId)?.mood;
    // The next mood in the catalog, so every run is a visible change.
    const mood = MOODS[(current ? MOODS.indexOf(current) + 1 : 0) % MOODS.length]!;
    events.push({
      relationshipId: context.relationship.id,
      accountId: context.partnerId,
      mood,
      at: new Date().toISOString(),
    });
  },
});
