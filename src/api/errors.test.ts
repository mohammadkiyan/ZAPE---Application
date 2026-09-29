import { i18n } from '@/localization/i18n';
import { ApiError, type ApiErrorCode } from './client';
import { describeError } from './errors';

describe('user-facing API errors', () => {
  it.each<[ApiErrorCode, number | undefined, string | null, boolean]>([
    ['network_error', undefined, 'errors.network', true],
    ['timeout', undefined, 'errors.timeout', true],
    ['authorization_error', undefined, 'errors.unauthorized', false],
    ['invalid_response', 200, 'errors.invalidResponse', true],
    ['invalid_request', undefined, 'errors.request', false],
    ['http_error', 401, 'errors.unauthorized', false],
    ['http_error', 404, 'errors.notFound', false],
    ['http_error', 422, 'errors.request', false],
    ['http_error', 429, 'errors.server', true],
    ['http_error', 500, 'errors.server', true],
    ['http_error', 503, 'errors.server', true],
  ])('maps %s (%s) to %s', (code, status, key, retryable) => {
    expect(describeError(new ApiError('raw detail', code, status, 'req-1'))).toEqual({
      messageKey: key,
      retryable,
    });
  });

  it('stays silent for aborted requests', () => {
    expect(describeError(new ApiError('Request aborted', 'aborted'))).toBeNull();
  });

  it('treats unknown throwables as a generic server error', () => {
    expect(describeError(new Error('boom'))).toEqual({
      messageKey: 'errors.server',
      retryable: true,
    });
  });

  it('has a localized message for every key without leaking raw details', () => {
    const error = describeError(
      new ApiError('Internal: stack at x.js:1', 'http_error', 500, 'r1')
    )!;
    const fa = i18n.t(error.messageKey, { lng: 'fa' });
    const en = i18n.t(error.messageKey, { lng: 'en' });
    expect(fa).not.toContain('Internal');
    expect(en).toBe('Something went wrong. Try again in a moment.');
  });
});
