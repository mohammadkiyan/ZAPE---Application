import './handlers/health';
import { createMockFetcher } from './router';
import { mockStore } from './state';
import { clearSession } from '../session';

/** Origin used for mock requests; `.invalid` can never resolve to a real host. */
export const MOCK_BASE_URL = 'https://mock.zape.invalid/';

export const mockFetcher = createMockFetcher({
  baseUrl: MOCK_BASE_URL,
  store: mockStore,
  latencyMs: 250,
});

export { MockHttpError, registerMockRoute } from './router';
export type { MockHandler, MockRequest, MockResponse } from './router';
export { createSeedState, mockStore, type MockState } from './state';

/** Restores the seed scenario and signs the app out, as if freshly installed against the mock. */
export async function resetMockBackend(): Promise<void> {
  await mockStore.reset();
  await clearSession();
}
