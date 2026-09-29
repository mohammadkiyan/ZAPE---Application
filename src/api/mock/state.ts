import AsyncStorage from '@react-native-async-storage/async-storage';

const STATE_KEY = 'zape.mock.state';
const STATE_VERSION = 1;

/**
 * The mock backend's database. Later changes add their own slices next to
 * their handlers; unknown slices survive persistence untouched.
 */
export interface MockState {
  version: number;
  user: { id: string; name: string; email: string };
  relationship: { startedAt: string; timeZone: string };
  [slice: string]: unknown;
}

/** The design canvas scenario: «محمد», together since 1399-12-24 20:00 Asia/Tehran (UTC+03:30). */
export function createSeedState(): MockState {
  return {
    version: STATE_VERSION,
    user: { id: 'user-mohammad', name: 'محمد', email: 'mohammad@example.com' },
    relationship: { startedAt: '2021-03-14T16:30:00.000Z', timeZone: 'Asia/Tehran' },
  };
}

type Storage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;

export interface MockStore {
  /** Loads persisted state once; falls back to the seed when nothing valid is stored. */
  load(): Promise<MockState>;
  save(): Promise<void>;
  reset(): Promise<MockState>;
}

export function createMockStore(storage: Storage = AsyncStorage): MockStore {
  let state: MockState | undefined;
  let loading: Promise<MockState> | undefined;
  return {
    load() {
      if (state) return Promise.resolve(state);
      loading ??= (async () => {
        try {
          const raw = await storage.getItem(STATE_KEY);
          const parsed = raw ? (JSON.parse(raw) as MockState) : undefined;
          state = parsed?.version === STATE_VERSION ? parsed : createSeedState();
        } catch {
          state = createSeedState();
        }
        return state;
      })();
      return loading;
    },
    async save() {
      if (state) await storage.setItem(STATE_KEY, JSON.stringify(state));
    },
    async reset() {
      state = createSeedState();
      loading = undefined;
      await storage.setItem(STATE_KEY, JSON.stringify(state));
      return state;
    },
  };
}

export const mockStore = createMockStore();
