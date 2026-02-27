// auth.config.ts — Edge-compatible minimal Auth.js config used by middleware.
// Must NOT import Prisma, bcryptjs, or any Node.js-only modules.
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // Populated in app/lib/auth.ts
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isWorkspace = nextUrl.pathname.startsWith("/workspace");
      if (isWorkspace) return isLoggedIn;
      return true;
    },
  },
};
