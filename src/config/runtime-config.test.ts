import { parseRuntimeConfig, resolveDevApiBaseUrl } from './runtime-config';

describe('runtime config', () => {
  it('uses the real backend when a public API URL is configured', () => {
    expect(
      parseRuntimeConfig(
        { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com' },
        { development: false }
      )
    ).toEqual({ apiBaseUrl: 'https://api.example.com', backend: 'real' });
  });

  it('uses the mock in development without a URL or when the flag is set', () => {
    expect(parseRuntimeConfig({}, { development: true })).toEqual({
      apiBaseUrl: undefined,
      backend: 'mock',
    });
    expect(
      parseRuntimeConfig(
        { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com', EXPO_PUBLIC_API_MOCK: 'true' },
        { development: true }
      ).backend
    ).toBe('mock');
    expect(
      parseRuntimeConfig(
        { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com', EXPO_PUBLIC_API_MOCK: 'false' },
        { development: true }
      ).backend
    ).toBe('real');
  });

  it('reports a misconfigured release build instead of silently using the mock', () => {
    expect(parseRuntimeConfig({}, { development: false }).backend).toBe('misconfigured');
    expect(
      parseRuntimeConfig(
        { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com', EXPO_PUBLIC_API_MOCK: 'true' },
        { development: false }
      ).backend
    ).toBe('misconfigured');
  });

  it('rejects invalid URLs and flag values', () => {
    expect(() => parseRuntimeConfig({ EXPO_PUBLIC_API_BASE_URL: 'secret' })).toThrow();
    expect(() =>
      parseRuntimeConfig({ EXPO_PUBLIC_API_BASE_URL: 'ftp://api.example.com' })
    ).toThrow();
    expect(() =>
      parseRuntimeConfig({ EXPO_PUBLIC_API_BASE_URL: 'https://user:password@api.example.com' })
    ).toThrow();
    expect(() =>
      parseRuntimeConfig({ EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com?api_key=secret' })
    ).toThrow();
    expect(() => parseRuntimeConfig({ EXPO_PUBLIC_API_MOCK: 'yes' })).toThrow();
  });

  it('points a loopback URL at the Metro host in development only', () => {
    const env = { EXPO_PUBLIC_API_BASE_URL: 'http://localhost:5173/api/app/v1' };
    expect(
      parseRuntimeConfig(env, { development: true, devServerHost: '192.168.1.140' }).apiBaseUrl
    ).toBe('http://192.168.1.140:5173/api/app/v1');
    expect(
      parseRuntimeConfig(env, { development: false, devServerHost: '192.168.1.140' }).apiBaseUrl
    ).toBe('http://localhost:5173/api/app/v1');
    expect(parseRuntimeConfig(env, { development: true }).apiBaseUrl).toBe(
      'http://localhost:5173/api/app/v1'
    );
  });

  it('leaves non-loopback hosts alone', () => {
    expect(resolveDevApiBaseUrl('https://zape.house/api/app/v1', '192.168.1.140')).toBe(
      'https://zape.house/api/app/v1'
    );
    expect(resolveDevApiBaseUrl('http://127.0.0.1:5173', '10.0.2.2')).toBe('http://10.0.2.2:5173');
  });
});
