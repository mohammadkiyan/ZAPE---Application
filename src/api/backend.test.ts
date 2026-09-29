import { ApiError, createApiClient } from './client';
import { createBackendClient, withSessionGuard } from './backend';
import { getHealth } from './endpoints/health';

describe('backend selection', () => {
  it('parses real responses through the contract', async () => {
    const fetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"ok":true,"time":"2026-09-29T10:00:00.000Z"}',
    });
    const api = createBackendClient(
      { backend: 'real', apiBaseUrl: 'https://api.example.com' },
      { fetcher }
    );
    expect(await getHealth(api!)).toEqual({ ok: true, time: '2026-09-29T10:00:00.000Z' });
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://api.example.com/health');
  });

  it('rejects a response that does not match the contract', async () => {
    const api = createBackendClient(
      { backend: 'real', apiBaseUrl: 'https://api.example.com' },
      {
        fetcher: jest
          .fn()
          .mockResolvedValue({ ok: true, status: 200, text: async () => '{"ok":1}' }),
      }
    );
    await expect(getHealth(api!)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('serves the mock backend without a network', async () => {
    const api = createBackendClient({ backend: 'mock', apiBaseUrl: undefined });
    expect((await getHealth(api!)).ok).toBe(true);
  });

  it('makes no client for a misconfigured build', () => {
    expect(createBackendClient({ backend: 'misconfigured', apiBaseUrl: undefined })).toBeNull();
  });
});

describe('session guard', () => {
  const failing = (status: number) =>
    createApiClient({
      baseUrl: 'https://api.example.com',
      fetcher: jest.fn().mockResolvedValue({ ok: false, status, text: async () => '' }),
    });

  it('clears the session on an unauthorized response and rethrows', async () => {
    const clear = jest.fn(async () => undefined);
    await expect(withSessionGuard(failing(401), clear).request('me')).rejects.toBeInstanceOf(
      ApiError
    );
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('leaves the session alone for other failures', async () => {
    const clear = jest.fn(async () => undefined);
    await expect(withSessionGuard(failing(500), clear).request('me')).rejects.toMatchObject({
      status: 500,
    });
    expect(clear).not.toHaveBeenCalled();
  });

  const respond = (...bodies: [number, unknown][]) => {
    const fetcher = jest.fn();
    for (const [status, body] of bodies) {
      fetcher.mockResolvedValueOnce({
        ok: status < 300,
        status,
        text: async () => JSON.stringify(body),
      });
    }
    return { fetcher, api: createApiClient({ baseUrl: 'https://api.example.com', fetcher }) };
  };
  const expired = [401, { code: 'try_refresh_token' }] as [number, unknown];

  it('refreshes an expired access token once and retries the request', async () => {
    const { api, fetcher } = respond(expired, [200, { ok: true }]);
    const clear = jest.fn(async () => undefined);
    const refresh = jest.fn(async () => true);
    expect(await withSessionGuard(api, clear, refresh).request('me')).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(clear).not.toHaveBeenCalled();
  });

  it('signs out when the refresh token is rejected', async () => {
    const { api } = respond(expired);
    const clear = jest.fn(async () => undefined);
    await expect(
      withSessionGuard(api, clear, async () => false).request('me')
    ).rejects.toMatchObject({ status: 401 });
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the refresh cannot reach the backend', async () => {
    const { api } = respond(expired);
    const clear = jest.fn(async () => undefined);
    const offline = new ApiError('Network request failed', 'network_error');
    await expect(
      withSessionGuard(api, clear, async () => Promise.reject(offline)).request('me')
    ).rejects.toBe(offline);
    expect(clear).not.toHaveBeenCalled();
  });

  it('never refreshes or signs out for auth calls', async () => {
    const { api } = respond([401, { code: 'unauthorised' }]);
    const clear = jest.fn(async () => undefined);
    const refresh = jest.fn(async () => true);
    await expect(
      withSessionGuard(api, clear, refresh).request('auth/session/refresh')
    ).rejects.toMatchObject({ status: 401 });
    expect(refresh).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });
});
