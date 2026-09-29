import { runtimeConfig, type RuntimeConfig } from '@/config/runtime-config';
import { ApiError, createApiClient, type ApiClient, type ApiClientOptions } from './client';
import { MOCK_BASE_URL, mockFetcher } from './mock';
import { clearSession, getAuthorization } from './session';

function createRequestId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Clears the local session whenever the backend rejects it, then rethrows. */
export function withSessionGuard(
  client: ApiClient,
  onUnauthorized: () => Promise<void> = clearSession
): ApiClient {
  return {
    async request(path, options) {
      try {
        return await client.request(path, options);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await onUnauthorized();
        throw error;
      }
    },
  };
}

/** Builds the domain API client for the configured backend, or null when the build is misconfigured. */
export function createBackendClient(
  config: RuntimeConfig,
  overrides: Partial<ApiClientOptions> = {}
): ApiClient | null {
  const shared = { getAuthorization, createRequestId, timeoutMs: 15000, ...overrides };
  switch (config.backend) {
    case 'real':
      return withSessionGuard(createApiClient({ baseUrl: config.apiBaseUrl!, ...shared }));
    case 'mock':
      return withSessionGuard(
        createApiClient({ baseUrl: MOCK_BASE_URL, fetcher: mockFetcher, ...shared })
      );
    case 'misconfigured':
      return null;
  }
}

let client: ApiClient | null | undefined;

/** The app-wide domain client. Throws for a misconfigured build, which renders an error screen instead. */
export function getApiClient(): ApiClient {
  if (client === undefined) client = createBackendClient(runtimeConfig);
  if (!client) throw new ApiError('Backend is not configured', 'invalid_request');
  return client;
}
