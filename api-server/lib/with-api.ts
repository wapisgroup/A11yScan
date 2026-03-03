/**
 * with-api.ts
 * -----------
 * Wraps every v1 route handler with auth → rate-limit → handle → log.
 * Route params are resolved from the Next.js context and passed to the handler.
 */
import type { NextRequest } from 'next/server';
import { authenticateApiKey, type ApiUser } from '@/lib/api-auth';
import { checkAndIncrementRateLimit } from '@/lib/rate-limit';
import { logApiCall } from '@/lib/logger';

type Params = Record<string, string>;
type Handler = (req: NextRequest, user: ApiUser, params: Params) => Promise<Response>;

export function withApi(handler: Handler) {
  return async (
    req: NextRequest,
    context?: { params?: Promise<Params> }
  ): Promise<Response> => {
    // 1. Authenticate
    const auth = await authenticateApiKey(req);
    if ('error' in auth) return auth.error;
    const { user } = auth;

    // 2. Rate limit
    const rl = await checkAndIncrementRateLimit(user);
    if (rl.limited) return rl.response;

    // 3. Resolve route params
    const params = context?.params ? await context.params : {};

    // 4. Handle
    const start = Date.now();
    let status = 500;
    let response: Response;
    try {
      response = await handler(req, user, params);
      status   = response.status;
    } catch (err) {
      console.error('[api-server] Unhandled error:', err);
      response = Response.json({ error: 'Internal server error.' }, { status: 500 });
    }

    // 5. Log (fire and forget)
    logApiCall(user.uid, req, status, Date.now() - start);

    // 6. Attach rate-limit headers when limit applies
    if (rl.remaining !== null) {
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit',     String(user.apiCallsPerDay));
      headers.set('X-RateLimit-Remaining', String(rl.remaining));
      return new Response(response.body, { status: response.status, headers });
    }

    return response;
  };
}
