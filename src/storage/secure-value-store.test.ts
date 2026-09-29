import { createSecureValueStore } from './secure-value-store';

describe('secure value store', () => {
  it('clears only the named opaque value', async () => {
    const secureStore = {
      getItemAsync: jest.fn().mockResolvedValue('opaque'),
      setItemAsync: jest.fn().mockResolvedValue(undefined),
      deleteItemAsync: jest.fn().mockResolvedValue(undefined),
    };
    const store = createSecureValueStore(secureStore);
    expect(await store.read('credential')).toBe('opaque');
    await store.write('credential', 'other');
    await store.clear('credential');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('credential');
  });
});
