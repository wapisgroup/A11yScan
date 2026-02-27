// middleware.ts — Route protection via Auth.js JWT verification.
// Uses the Edge-compatible auth.config (no Prisma, no bcrypt).
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all /workspace/** routes; skip static assets & API routes
  matcher: ["/workspace/:path*"],
};
