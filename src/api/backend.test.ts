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
});
