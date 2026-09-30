import Constants from 'expo-constants';
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

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);

/**
 * In development, a loopback API host means "the machine running Metro": on a phone,
 * emulator or simulator, `localhost` is the device itself. `devServerHost` is the host
 * part of Metro's `hostUri` (e.g. `192.168.1.140`). Release builds never rewrite.
 */
export function resolveDevApiBaseUrl(
  apiBaseUrl: string,
  devServerHost: string | undefined
): string {
  const url = new URL(apiBaseUrl);
  if (!devServerHost || !LOOPBACK_HOSTS.has(url.hostname)) return apiBaseUrl;
  url.hostname = devServerHost;
  return url.toString().replace(/\/$/, '');
}

export function parseRuntimeConfig(
  env: Record<string, string | undefined>,
  {
    development = __DEV__,
    devServerHost,
  }: { development?: boolean; devServerHost?: string } = {}
): RuntimeConfig {
  const parsed = publicConfigSchema.parse(env);
  const configured = parsed.EXPO_PUBLIC_API_BASE_URL;
  const apiBaseUrl =
    configured && development ? resolveDevApiBaseUrl(configured, devServerHost) : configured;
  const wantsMock = parsed.EXPO_PUBLIC_API_MOCK === 'true';
  let backend: Backend;
  if (apiBaseUrl && !wantsMock) backend = 'real';
  else backend = development ? 'mock' : 'misconfigured';
  return { apiBaseUrl, backend };
}

/** The host Metro serves this development build from, without its port. */
function metroHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? hostUri.replace(/:\d+$/, '') || undefined : undefined;
}

export const runtimeConfig = parseRuntimeConfig(
  {
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    EXPO_PUBLIC_API_MOCK: process.env.EXPO_PUBLIC_API_MOCK,
  },
  { devServerHost: __DEV__ ? metroHost() : undefined }
);
