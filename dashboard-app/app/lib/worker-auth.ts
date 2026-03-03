/**
 * worker-auth.ts
 * --------------
 * Verifies the API token sent by the worker in the Authorization header.
 *
 * Usage (in v2 API routes):
 *   const user = await authenticateWorker(req);
 *   if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
 */

import type { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

export type WorkerIdentity = {
  id: string;
  organizationId: string | null;
  email: string | null;
  isSystem?: boolean;
};

function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }

  const apiKey = req.headers.get("x-api-key")?.trim();
  if (apiKey) return apiKey;

  return null;
}

function safeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function authenticateWorker(req: NextRequest): Promise<WorkerIdentity | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { apiToken: token },
    select: { id: true, organizationId: true, email: true },
  });
  if (user) return { ...user, isSystem: false };

  // Optional machine-to-machine token for independently deployed workers.
  // If set, worker can process jobs across organizations.
  const sharedToken = process.env.WORKER_SHARED_TOKEN?.trim();
  if (sharedToken && safeEquals(token, sharedToken)) {
    return {
      id: "__system_worker__",
      organizationId: null,
      email: null,
      isSystem: true,
    } satisfies WorkerIdentity;
  }

  return null;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function notFound(message = "Not found") {
  return Response.json({ error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}
