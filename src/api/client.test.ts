import { z } from 'zod';
import { ApiError, createApiClient } from './client';

describe('generic API client', () => {
  it('injects authorization and request ID and validates JSON', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 200, text: async () => '{"ok":true}' });
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher,
      getAuthorization: async () => 'Bearer opaque',
      createRequestId: () => 'request-1',
    });
    expect(await api.request('/health', { schema: z.object({ ok: z.boolean() }) })).toEqual({
      ok: true,
    });
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer opaque',
      'X-Request-Id': 'request-1',
    });
  });

  it('normalizes HTTP failures', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher: jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => '{"message":"Unavailable"}',
      }),
    });
    await expect(api.request('/health')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      code: 'http_error',
      message: 'Unavailable',
    } satisfies Partial<ApiError>);
  });

  it('keeps the machine-readable error code from the response body', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher: jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => '{"message":"Wrong code","code":"otp_invalid"}',
      }),
    });
    await expect(api.request('/auth/otp/verify')).rejects.toMatchObject({
      status: 400,
      serverCode: 'otp_invalid',
    } satisfies Partial<ApiError>);
  });

  it('normalizes invalid responses', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher: jest
        .fn()
        .mockResolvedValue({ ok: true, status: 200, text: async () => '{"ok":"no"}' }),
    });
    await expect(
      api.request('/health', { schema: z.object({ ok: z.boolean() }) })
    ).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('never forwards authorization to an off-origin URL', async () => {
    const fetcher = jest.fn();
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher,
      getAuthorization: () => 'Bearer opaque',
    });
    await expect(api.request('https://other.example.com/steal')).rejects.toMatchObject({
      code: 'invalid_request',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('does not fetch when the caller signal was already aborted', async () => {
    const fetcher = jest.fn();
    const controller = new AbortController();
    controller.abort();
    const api = createApiClient({ baseUrl: 'https://api.example.com', fetcher });
    await expect(api.request('/health', { signal: controller.signal })).rejects.toMatchObject({
      code: 'aborted',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('preserves HTTP status when a server sends a non-JSON error body', async () => {
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher: jest
        .fn()
        .mockResolvedValue({ ok: false, status: 502, text: async () => 'Bad gateway' }),
    });
    await expect(api.request('/health')).rejects.toMatchObject({ code: 'http_error', status: 502 });
  });

  it('normalizes authorization provider failures before any network request', async () => {
    const fetcher = jest.fn();
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher,
      getAuthorization: async () => {
        throw new Error('keychain unavailable');
      },
    });
    await expect(api.request('/health')).rejects.toMatchObject({ code: 'authorization_error' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('cancels a request while authorization is pending', async () => {
    const fetcher = jest.fn();
    const controller = new AbortController();
    const api = createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher,
      getAuthorization: () => new Promise<string>(() => undefined),
    });
    const request = api.request('/health', { signal: controller.signal });
    controller.abort();
    await expect(request).rejects.toMatchObject({ code: 'aborted' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('times out a hung authorization provider', async () => {
    jest.useFakeTimers();
    try {
      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        getAuthorization: () => new Promise<string>(() => undefined),
        timeoutMs: 20,
      });
      const request = api.request('/health');
      const expectation = expect(request).rejects.toMatchObject({ code: 'timeout' });
      await jest.advanceTimersByTimeAsync(21);
      await expectation;
    } finally {
      jest.useRealTimers();
    }
  });
});
