/**
 * pagination.ts
 * -------------
 * Cursor-based pagination helpers shared by all list endpoints.
 */
import type { NextRequest } from 'next/server';

export function parsePagination(
  req: NextRequest,
  defaults: { limit: number; max: number } = { limit: 50, max: 200 }
): { limit: number; after: string | undefined } {
  const url   = new URL(req.url);
  const raw   = parseInt(url.searchParams.get('limit') ?? String(defaults.limit));
  const limit = Math.min(isNaN(raw) ? defaults.limit : raw, defaults.max);
  const after = url.searchParams.get('after') ?? undefined;
  return { limit, after };
}

export function buildPage<T extends { id: string }>(
  rows: T[],
  limit: number
): { data: T[]; pagination: { limit: number; nextCursor: string | null; hasMore: boolean } } {
  const hasMore    = rows.length > limit;
  const data       = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;
  return { data, pagination: { limit, nextCursor, hasMore } };
}
