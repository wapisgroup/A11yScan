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
import { prisma } from "@/lib/db";

export async function authenticateWorker(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { apiToken: token },
    select: { id: true, organizationId: true, email: true },
  });

  return user ?? null;
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
