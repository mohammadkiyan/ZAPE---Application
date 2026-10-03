import type { z } from 'zod';
import { recordServerDate } from './server-clock';

export type ApiErrorCode =
  | 'http_error'
  | 'network_error'
  | 'timeout'
  | 'aborted'
  | 'authorization_error'
  | 'invalid_request'
  | 'invalid_response';

export class ApiError extends Error {
  readonly name = 'ApiError';
  /** The machine-readable `code` from an error response body, e.g. `otp_invalid`. */
  readonly serverCode?: string;
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly status?: number,
    readonly requestId?: string,
    options?: ErrorOptions & { serverCode?: string }
  ) {
    super(message, options);
    this.serverCode = options?.serverCode;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
  getAuthorization?: () => string | null | undefined | Promise<string | null | undefined>;
  createRequestId?: () => string;
  timeoutMs?: number;
}

export interface ApiRequestOptions<T> {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface ApiClient {
  request<T = unknown>(path: string, options?: ApiRequestOptions<T>): Promise<T>;
}

export function createApiClient(config: ApiClientOptions): ApiClient {
  const fetcher = config.fetcher ?? fetch;
  let baseUrl: URL;
  try {
    baseUrl = new URL(config.baseUrl.endsWith('/') ? config.baseUrl : `${config.baseUrl}/`);
    if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error('Unsupported protocol');
  } catch (cause) {
    throw new ApiError('Invalid API base URL', 'invalid_request', undefined, undefined, { cause });
  }
  return {
    async request<T>(path: string, options: ApiRequestOptions<T> = {}): Promise<T> {
      let requestUrl: URL;
      try {
        requestUrl = new URL(path.replace(/^\//, ''), baseUrl);
      } catch (cause) {
        throw new ApiError('Invalid request URL', 'invalid_request', undefined, undefined, {
          cause,
        });
      }
      if (requestUrl.origin !== baseUrl.origin) {
        throw new ApiError('Request URL must stay on the configured API origin', 'invalid_request');
      }
      if (options.signal?.aborted) throw new ApiError('Request aborted', 'aborted');
      const requestId = config.createRequestId?.();
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs ?? config.timeoutMs ?? 15000;
      let abortReason: 'timeout' | 'aborted' | undefined;
      let rejectInterruption: (error: ApiError) => void = () => undefined;
      const interrupted = new Promise<never>((_, reject) => {
        rejectInterruption = reject;
      });
      const interrupt = (reason: 'timeout' | 'aborted') => {
        if (controller.signal.aborted) return;
        abortReason = reason;
        controller.abort();
        rejectInterruption(
          new ApiError(
            reason === 'timeout' ? 'Request timed out' : 'Request aborted',
            reason,
            undefined,
            requestId
          )
        );
      };
      const timer = setTimeout(() => interrupt('timeout'), timeoutMs);
      const onAbort = () => interrupt('aborted');
      options.signal?.addEventListener('abort', onAbort);
      try {
        let authorization: string | null | undefined;
        try {
          authorization = await Promise.race([
            Promise.resolve(config.getAuthorization?.()),
            interrupted,
          ]);
        } catch (cause) {
          if (cause instanceof ApiError) throw cause;
          throw new ApiError(
            'Authorization provider failed',
            'authorization_error',
            undefined,
            requestId,
            { cause }
          );
        }
        const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
        if (authorization) headers.Authorization = authorization;
        if (requestId) headers['X-Request-Id'] = requestId;
        if (options.body !== undefined) headers['Content-Type'] = 'application/json';
        const requestedAt = Date.now();
        const response = await Promise.race([
          fetcher(requestUrl.toString(), {
            method: options.method ?? 'GET',
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: controller.signal,
          }),
          interrupted,
        ]);
        // Every answer, error or not, says what time the server thinks it is.
        recordServerDate(response.headers?.get?.('Date'), requestedAt, Date.now());
        const raw = await Promise.race([response.text(), interrupted]);
        let data: unknown;
        try {
          data = raw ? JSON.parse(raw) : undefined;
        } catch (cause) {
          if (response.ok)
            throw new ApiError(
              'Invalid JSON response',
              'invalid_response',
              response.status,
              requestId,
              { cause }
            );
        }
        if (!response.ok) {
          const message =
            data &&
            typeof data === 'object' &&
            'message' in data &&
            typeof data.message === 'string'
              ? data.message
              : `Request failed (${response.status})`;
          const serverCode =
            data && typeof data === 'object' && 'code' in data && typeof data.code === 'string'
              ? data.code
              : undefined;
          throw new ApiError(message, 'http_error', response.status, requestId, { serverCode });
        }
        if (options.schema) {
          const result = options.schema.safeParse(data);
          if (!result.success)
            throw new ApiError('Invalid response', 'invalid_response', response.status, requestId, {
              cause: result.error,
            });
          return result.data;
        }
        return data as T;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (controller.signal.aborted)
          throw new ApiError(
            abortReason === 'timeout' ? 'Request timed out' : 'Request aborted',
            abortReason ?? 'aborted',
            undefined,
            requestId,
            {
              cause: error,
            }
          );
        throw new ApiError('Network request failed', 'network_error', undefined, requestId, {
          cause: error,
        });
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', onAbort);
      }
    },
  };
}
