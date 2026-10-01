import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SecureValueStore } from '@/storage/secure-value-store';
import { SESSION_KEY, createSessionStore } from './session-store';

function fakeSecureStore(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const store: jest.Mocked<SecureValueStore> = {
    read: jest.fn(async (key) => values.get(key) ?? null),
    write: jest.fn(async (key, value) => void values.set(key, value)),
    clear: jest.fn(async (key) => void values.delete(key)),
  };
  return { store, values };
}

const credential = { accessToken: 'access-1', refreshToken: 'refresh-1' };

describe('session store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('writes the credential only through secure storage, never AsyncStorage', async () => {
    const { store, values } = fakeSecureStore();
    const session = createSessionStore(store);
    await session.getState().setCredential(credential);

    expect(store.write).toHaveBeenCalledWith(SESSION_KEY, JSON.stringify(credential));
    expect(values.get('zape.session')).toContain('access-1');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(session.getState()).toMatchObject({ status: 'signed-in', credential });
  });

  it('hydrates a stored session after a relaunch', async () => {
    const { store } = fakeSecureStore({ [SESSION_KEY]: JSON.stringify(credential) });
    const session = createSessionStore(store);
    expect(session.getState().status).toBe('unknown');
    await session.getState().hydrate();
    expect(session.getState()).toMatchObject({ status: 'signed-in', credential });
  });

  it('treats a missing, corrupt or unreadable value as signed out', async () => {
    const empty = createSessionStore(fakeSecureStore().store);
    await empty.getState().hydrate();
    expect(empty.getState().status).toBe('signed-out');

    const { store, values } = fakeSecureStore({ [SESSION_KEY]: '{"token":1}' });
    const corrupt = createSessionStore(store);
    await corrupt.getState().hydrate();
    expect(corrupt.getState().status).toBe('signed-out');
    expect(values.has(SESSION_KEY)).toBe(false);

    const failing = fakeSecureStore().store;
    failing.read.mockRejectedValueOnce(new Error('keychain locked'));
    const locked = createSessionStore(failing);
    await locked.getState().hydrate();
    expect(locked.getState().status).toBe('signed-out');
  });

  it('deletes the stored credential on unsetCredential', async () => {
    const { store, values } = fakeSecureStore({ [SESSION_KEY]: JSON.stringify(credential) });
    const session = createSessionStore(store);
    await session.getState().hydrate();
    await session.getState().unsetCredential();
    expect(values.has(SESSION_KEY)).toBe(false);
    expect(session.getState()).toMatchObject({ status: 'signed-out', credential: undefined });
  });
});
