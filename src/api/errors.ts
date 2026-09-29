import { ApiError } from './client';

/** Keys in the `common` namespace; raw error text and request IDs never reach the user. */
export type ErrorMessageKey =
  | 'errors.network'
  | 'errors.timeout'
  | 'errors.server'
  | 'errors.notFound'
  | 'errors.invalidResponse'
  | 'errors.unauthorized'
  | 'errors.request';

export interface UserFacingError {
  messageKey: ErrorMessageKey;
  /** Whether a "Try again" action makes sense. */
  retryable: boolean;
}

/** Maps any thrown value to a short localized message key. Returns null for user-initiated aborts. */
export function describeError(error: unknown): UserFacingError | null {
  if (!(error instanceof ApiError)) return { messageKey: 'errors.server', retryable: true };
  switch (error.code) {
    case 'aborted':
      return null;
    case 'network_error':
      return { messageKey: 'errors.network', retryable: true };
    case 'timeout':
      return { messageKey: 'errors.timeout', retryable: true };
    case 'authorization_error':
      return { messageKey: 'errors.unauthorized', retryable: false };
    case 'invalid_response':
      return { messageKey: 'errors.invalidResponse', retryable: true };
    case 'invalid_request':
      return { messageKey: 'errors.request', retryable: false };
    case 'http_error': {
      const status = error.status ?? 500;
      if (status === 401) return { messageKey: 'errors.unauthorized', retryable: false };
      if (status === 404) return { messageKey: 'errors.notFound', retryable: false };
      if (status === 408 || status === 429 || status >= 500)
        return { messageKey: status === 408 ? 'errors.timeout' : 'errors.server', retryable: true };
      return { messageKey: 'errors.request', retryable: false };
    }
  }
}
