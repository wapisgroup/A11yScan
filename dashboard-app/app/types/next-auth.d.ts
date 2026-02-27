// Type augmentations for next-auth to include custom session fields.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    organizationId?: string | null;
    firstName?: string | null;
  }

  interface Session {
    user: {
      id: string;
      organizationId?: string | null;
      firstName?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    organizationId?: string | null;
    firstName?: string | null;
  }
}
