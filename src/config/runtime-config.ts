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
});

export type RuntimeConfig = { apiBaseUrl: string | undefined };

export function parseRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const parsed = publicConfigSchema.parse(env);
  return { apiBaseUrl: parsed.EXPO_PUBLIC_API_BASE_URL };
}

export const runtimeConfig = parseRuntimeConfig({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
});
