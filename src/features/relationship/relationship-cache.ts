import AsyncStorage from '@react-native-async-storage/async-storage';
import { relationshipSchema, type Relationship } from '@/api/contracts/relationship';

/** The last relationship seen on this phone, so an offline launch can still tick the clock. */
export const RELATIONSHIP_CACHE_KEY = 'zape.relationship.last';

let lastSeen: Relationship | undefined;

export function cachedRelationship(): Relationship | undefined {
  return lastSeen;
}

export async function hydrateRelationshipCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(RELATIONSHIP_CACHE_KEY);
    const parsed = raw ? relationshipSchema.safeParse(JSON.parse(raw)) : undefined;
    lastSeen = parsed?.success ? parsed.data : undefined;
  } catch {
    lastSeen = undefined;
  }
}

/** Remembers the current relationship, or forgets it (`null`) once there is none. */
export function rememberRelationship(relationship: Relationship | null): void {
  lastSeen = relationship ?? undefined;
  const write = relationship
    ? AsyncStorage.setItem(RELATIONSHIP_CACHE_KEY, JSON.stringify(relationship))
    : AsyncStorage.removeItem(RELATIONSHIP_CACHE_KEY);
  void write.catch(() => undefined);
}
