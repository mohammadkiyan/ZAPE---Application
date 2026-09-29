import type { MockState, MockStore } from './state';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MockRequest {
  method: Method;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  headers: Record<string, string>;
}

export interface MockResponse {
  status?: number;
  body?: unknown;
}

export type MockHandler = (
  request: MockRequest,
  state: MockState
) => MockResponse | Promise<MockResponse>;

/** Thrown by a handler to answer with an HTTP error, e.g. `throw new MockHttpError(401, 'Session expired')`. */
export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string
  ) {
    super(message);
  }
}

interface Route {
  method: Method;
  pattern: RegExp;
  keys: string[];
  handler: MockHandler;
}

const routes: Route[] = [];

/** Registers a handler for `"METHOD /path/:param"`. Later registrations win for the same route. */
export function registerMockRoute(route: `${Method} /${string}`, handler: MockHandler): void {
  const [method, path] = route.split(' ') as [Method, string];
  const keys: string[] = [];
  const source = path
    .replace(/^\/|\/$/g, '')
    .split('/')
    .map((segment) => {
      if (!segment.startsWith(':')) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      keys.push(segment.slice(1));
      return '([^/]+)';
    })
    .join('/');
  routes.unshift({ method, pattern: new RegExp(`^${source}$`), keys, handler });
}

function jsonResponse(status: number, body: unknown): Response {
  const text = body === undefined ? '' : JSON.stringify(body);
  // The API client only reads `ok`, `status` and `text()`, so a minimal response keeps the mock portable.
  return { ok: status >= 200 && status < 300, status, text: async () => text } as Response;
}

function delay(ms: number, signal: AbortSignal | null | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    });
  });
}

export interface MockFetcherOptions {
  baseUrl: string;
  store: MockStore;
  latencyMs?: number;
}

/** A `fetch`-compatible function served by registered mock routes. */
export function createMockFetcher({
  baseUrl,
  store,
  latencyMs = 0,
}: MockFetcherOptions): typeof fetch {
  const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  return async (input, init = {}) => {
    const url = new URL(String(input));
    const method = (init.method ?? 'GET').toUpperCase() as Method;
    if (latencyMs > 0) await delay(latencyMs, init.signal);
    if (init.signal?.aborted) throw new Error('Aborted');

    const path = url.pathname.slice(base.pathname.length).replace(/\/$/, '');
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = route.pattern.exec(path);
      if (!match) continue;
      const params = Object.fromEntries(
        route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1]!)])
      );
      const state = await store.load();
      try {
        const response = await route.handler(
          {
            method,
            path,
            params,
            query: url.searchParams,
            body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
            headers: (init.headers ?? {}) as Record<string, string>,
          },
          state
        );
        if (method !== 'GET') await store.save();
        return jsonResponse(response.status ?? 200, response.body);
      } catch (error) {
        if (error instanceof MockHttpError) {
          return jsonResponse(error.status, { message: error.message, code: error.code });
        }
        return jsonResponse(500, { message: 'Mock handler failed' });
      }
    }
    return jsonResponse(404, { message: `No mock route for ${method} /${path}` });
  };
}
