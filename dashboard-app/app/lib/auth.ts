// Full Auth.js config — server-side only (Node.js runtime).
// Do NOT import this from middleware.ts (use auth.config.ts there instead).
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.firstName
            ? `${user.firstName} ${user.lastName ?? ""}`.trim()
            : null,
          organizationId: user.organizationId,
          firstName: user.firstName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // On first sign-in, populate token from user object
      if (user) {
        token.id = user.id;
        token.organizationId = (user as { organizationId?: string | null }).organizationId ?? null;
        token.firstName = (user as { firstName?: string | null }).firstName ?? null;
      }

      // After OAuth (Google), fetch org/profile from DB since OAuth provider
      // doesn't know about organizationId
      if (account && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub ?? (token.id as string) },
          select: { id: true, organizationId: true, firstName: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.organizationId = dbUser.organizationId ?? null;
          token.firstName = dbUser.firstName ?? null;
        }
      }

      // Re-fetch from DB when session.update() is triggered client-side
      // (e.g. after setupOrganization completes)
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { organizationId: true, firstName: true },
        });
        if (dbUser) {
          token.organizationId = dbUser.organizationId ?? null;
          token.firstName = dbUser.firstName ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = (token.organizationId as string | null | undefined) ?? null;
        session.user.firstName = (token.firstName as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
