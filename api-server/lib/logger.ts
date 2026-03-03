/**
 * logger.ts
 * ---------
 * Writes one ApiLog row per request. Always fire-and-forget — never awaited.
 */
import { prisma } from '@/lib/db';
import type { NextRequest } from 'next/server';

export function logApiCall(
  userId: string,
  req: NextRequest,
  status: number,
  durationMs: number
): void {
  void prisma.apiLog.create({
    data: {
      userId,
      method:     req.method,
      path:       new URL(req.url).pathname,
      status,
      durationMs,
      ip:         req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null,
      userAgent:  req.headers.get('user-agent') ?? null,
    },
  });
}
