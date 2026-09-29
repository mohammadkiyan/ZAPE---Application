import { createPreferencesStore } from './preferences';

describe('preference hydration', () => {
  it('starts with Persian and system theme, then hydrates persisted preferences', async () => {
    const storage = {
      getItem: jest.fn(async (key: string) => (key === 'zape.locale' ? 'en' : 'dark')),
      setItem: jest.fn(async () => undefined),
    };
    const store = createPreferencesStore(storage);
    expect(store.getState()).toMatchObject({ hydrated: false, locale: 'fa', theme: 'system' });
    await store.getState().hydrate();
    expect(store.getState()).toMatchObject({ hydrated: true, locale: 'en', theme: 'dark' });
  });

  it('persists locale changes', async () => {
    const storage = { getItem: jest.fn(async () => null), setItem: jest.fn(async () => undefined) };
    const store = createPreferencesStore(storage);
    await store.getState().setLocale('en');
    expect(storage.setItem).toHaveBeenCalledWith('zape.locale', 'en');
  });
});
