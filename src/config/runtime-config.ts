import { z } from 'zod';

const publicConfigSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash
      );
    }, 'Use a credential-free HTTP(S) API URL without query or fragment')
    .optional(),
  EXPO_PUBLIC_API_MOCK: z.enum(['true', 'false']).optional(),
});

/**
 * - `real`: a base URL is configured and the mock is not requested.
 * - `mock`: a development build asked for the mock or has no base URL.
 * - `misconfigured`: a release build without a usable base URL; the mock never runs in release.
 */
export type Backend = 'real' | 'mock' | 'misconfigured';

export type RuntimeConfig = { apiBaseUrl: string | undefined; backend: Backend };

export function parseRuntimeConfig(
  env: Record<string, string | undefined>,
  { development = __DEV__ }: { development?: boolean } = {}
): RuntimeConfig {
  const parsed = publicConfigSchema.parse(env);
  const apiBaseUrl = parsed.EXPO_PUBLIC_API_BASE_URL;
  const wantsMock = parsed.EXPO_PUBLIC_API_MOCK === 'true';
  let backend: Backend;
  if (apiBaseUrl && !wantsMock) backend = 'real';
  else backend = development ? 'mock' : 'misconfigured';
  return { apiBaseUrl, backend };
}

export const runtimeConfig = parseRuntimeConfig({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_API_MOCK: process.env.EXPO_PUBLIC_API_MOCK,
});
