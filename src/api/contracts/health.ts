import { z } from 'zod';

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  time: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
