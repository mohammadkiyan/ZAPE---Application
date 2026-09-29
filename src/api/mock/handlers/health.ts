import { healthResponseSchema } from '../../contracts/health';
import { registerMockRoute } from '../router';

registerMockRoute('GET /health', () => ({
  body: healthResponseSchema.parse({ ok: true, time: new Date().toISOString() }),
}));
