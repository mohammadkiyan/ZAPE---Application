import { createPreferencesStore } from './preferences';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
  };
}

describe('preference hydration', () => {
  it('starts with Persian, Constellation and an auto background', () => {
    const store = createPreferencesStore(memoryStorage());
    expect(store.getState()).toMatchObject({
      hydrated: false,
      locale: 'fa',
      clockTheme: 'constellation',
      background: 'auto',
    });
  });

  it('hydrates persisted preferences', async () => {
    const storage = memoryStorage({
      'zape.locale': 'en',
      'zape.clock-theme': 'editorial',
      'zape.background': 'dots',
    });
    const store = createPreferencesStore(storage);
    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({
      hydrated: true,
      locale: 'en',
      clockTheme: 'editorial',
      background: 'dots',
    });
  });

  it('falls back to defaults for unknown stored values', async () => {
    const storage = memoryStorage({ 'zape.clock-theme': 'dark', 'zape.background': 'neon' });
    const store = createPreferencesStore(storage);
    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({ clockTheme: 'constellation', background: 'auto' });
  });

  it('deletes the legacy light/dark theme key on hydrate', async () => {
    const storage = memoryStorage({ 'zape.theme': 'dark' });
    await createPreferencesStore(storage).getState().hydrate();
    expect(storage.removeItem).toHaveBeenCalledWith('zape.theme');
    expect(storage.values.has('zape.theme')).toBe(false);
  });

  it('persists locale, theme and background changes', async () => {
    const storage = memoryStorage();
    const store = createPreferencesStore(storage);
    await store.getState().setLocale('en');
    await store.getState().setClockTheme('editorial');
    await store.getState().setBackground('stars');
    expect(storage.values.get('zape.locale')).toBe('en');
    expect(storage.values.get('zape.clock-theme')).toBe('editorial');
    expect(storage.values.get('zape.background')).toBe('stars');

    const restarted = createPreferencesStore(storage);
    await restarted.getState().hydrate();
    expect(restarted.getState()).toMatchObject({ clockTheme: 'editorial', background: 'stars' });
  });

  it('picking a theme resets background to auto', async () => {
    const storage = memoryStorage();
    const store = createPreferencesStore(storage);
    await store.getState().setBackground('stars');
    await store.getState().setClockTheme('mist');
    expect(store.getState()).toMatchObject({ clockTheme: 'mist', background: 'auto' });
    expect(storage.values.get('zape.background')).toBe('auto');
  });
});
