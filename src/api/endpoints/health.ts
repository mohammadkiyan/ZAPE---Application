import type { ApiClient } from '../client';
import { healthResponseSchema, type HealthResponse } from '../contracts/health';

export function getHealth(api: ApiClient, signal?: AbortSignal): Promise<HealthResponse> {
  return api.request('health', { schema: healthResponseSchema, signal });
}
