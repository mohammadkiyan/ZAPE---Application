import { parseRuntimeConfig } from './runtime-config';

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
});
