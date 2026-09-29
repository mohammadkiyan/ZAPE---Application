import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { ApiError, createApiClient } from '../client';
import { getHealth } from '../endpoints/health';
import { setSessionClearedHandler } from '../session';
import { MockHttpError, createMockFetcher, registerMockRoute } from './router';
import { createMockStore, createSeedState } from './state';
import { resetMockBackend, mockStore } from '.';

const BASE = 'https://mock.zape.invalid/';

function mockClient(store = createMockStore()) {
  return createApiClient({ baseUrl: BASE, fetcher: createMockFetcher({ baseUrl: BASE, store }) });
}

describe('mock backend', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('serves a contract round trip through createApiClient', async () => {
    const health = await getHealth(mockClient());
    expect(health.ok).toBe(true);
  });

  it('returns a 404 ApiError for an unknown route', async () => {
    const error = await mockClient()
      .request('nowhere')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'http_error', status: 404 });
  });

  it('matches path params and maps handler errors to HTTP errors', async () => {
    registerMockRoute('GET /test-items/:id', (request) => {
      if (request.params.id === 'gone') throw new MockHttpError(410, 'Gone');
      return { body: { id: request.params.id } };
    });
    const api = mockClient();
    expect(await api.request('test-items/7', { schema: z.object({ id: z.string() }) })).toEqual({
      id: '7',
    });
    await expect(api.request('test-items/gone')).rejects.toMatchObject({ status: 410 });
  });

  it('seeds the canvas scenario and persists writes across launches', async () => {
    registerMockRoute('PATCH /test-me', (request, state) => {
      state.user.name = (request.body as { name: string }).name;
      return { body: state.user };
    });
    const first = createMockStore();
    expect((await first.load()).user).toEqual(createSeedState().user);
    expect(createSeedState()).toMatchObject({
      user: { name: 'محمد', email: 'mohammad@example.com' },
      relationship: { startedAt: '2021-03-14T16:30:00.000Z', timeZone: 'Asia/Tehran' },
    });
    await mockClient(first).request('test-me', { method: 'PATCH', body: { name: 'Mo' } });

    const relaunched = createMockStore();
    expect((await relaunched.load()).user.name).toBe('Mo');
  });

  it('resets to the seed and signs the app out', async () => {
    const cleared = jest.fn();
    setSessionClearedHandler(cleared);
    const state = await mockStore.load();
    state.user.name = 'Changed';
    await mockStore.save();

    await resetMockBackend();
    expect((await mockStore.load()).user.name).toBe('محمد');
    expect(cleared).toHaveBeenCalledTimes(1);
    setSessionClearedHandler(() => undefined);
  });
});
