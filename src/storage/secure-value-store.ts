import * as SecureStore from 'expo-secure-store';

export interface SecureValueStore {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  clear(key: string): Promise<void>;
}

type SecureStoreDriver = Pick<
  typeof SecureStore,
  'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'
>;

export function createSecureValueStore(driver: SecureStoreDriver = SecureStore): SecureValueStore {
  return {
    read: (key) => driver.getItemAsync(key),
    write: (key, value) => driver.setItemAsync(key, value),
    clear: (key) => driver.deleteItemAsync(key),
  };
}

export const secureValueStore = createSecureValueStore();
