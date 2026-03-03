/**
 * rate-limit.ts
 * -------------
 * Checks and increments the daily API call counter stored in Subscription.currentUsage.
 * The counter resets automatically when the date changes (UTC).
 */
import { prisma } from '@/lib/db';
import type { ApiUser } from '@/lib/api-auth';

type RateLimitOk   = { limited: false; remaining: number | null };
type RateLimitFail = { limited: true;  response: Response };

export async function checkAndIncrementRateLimit(
  user: ApiUser
): Promise<RateLimitOk | RateLimitFail> {
  const { apiCallsPerDay } = user;

  // Unlimited plan — skip DB read entirely.
  if (apiCallsPerDay === null) return { limited: false, remaining: null };

  const sub = await prisma.subscription.findUnique({
    where: { userId: user.uid },
    select: { currentUsage: true },
  });

  const usage   = (sub?.currentUsage ?? {}) as Record<string, unknown>;
  const today   = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const sameDay = (usage.apiUsageDate as string | undefined) === today;
  const current = sameDay ? Number(usage.apiCallsToday ?? 0) : 0;

  if (current >= apiCallsPerDay) {
    return {
      limited: true,
      response: Response.json(
        { error: 'Daily API rate limit reached.', limit: apiCallsPerDay, resetAt: 'midnight UTC' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit':     String(apiCallsPerDay),
            'X-RateLimit-Remaining': '0',
            'Retry-After':           '86400',
          },
        }
      ),
    };
  }

  // Increment — fire and forget, does not block the request.
  void prisma.subscription.update({
    where: { userId: user.uid },
    data: {
      currentUsage: {
        ...usage,
        apiCallsToday: current + 1,
        apiUsageDate:  today,
      } as any,
    },
  });

  return { limited: false, remaining: apiCallsPerDay - current - 1 };
}
