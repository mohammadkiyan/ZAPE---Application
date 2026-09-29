import { parseRuntimeConfig } from './runtime-config';

describe('runtime config', () => {
  it('accepts a single public API URL', () => {
    expect(parseRuntimeConfig({ EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com' })).toEqual({
      apiBaseUrl: 'https://api.example.com',
    });
  });

  it('allows an unconfigured development app', () => {
    expect(parseRuntimeConfig({})).toEqual({ apiBaseUrl: undefined });
  });

  it('rejects invalid URLs', () => {
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
  });
});
