"use client";

import { useSession, signOut } from "next-auth/react";

/**
 * User shape compatible with the old Firebase-based AuthUser.
 * Both American (organizationId) and British (organisationId) spellings are provided
 * so existing workspace components continue to work without changes.
 */
export type AuthUser = {
  uid: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  organisationId?: string | null;  // British — used by existing components
  organizationId?: string | null;  // American — canonical DB field name
};

/**
 * useAuth — thin wrapper around next-auth's useSession().
 *
 * Drop-in replacement for the old Firebase-based useAuth() from @/utils/firebase.
 * Provides: user, loading, logout, update.
 *
 * Note: login/register/loginWithGoogle are no longer returned here.
 * Use signIn() from next-auth/react and the registerUser server action instead.
 */
export function useAuth() {
  const { data: session, status, update } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        uid: session.user.id,
        email: session.user.email ?? null,
        firstName: session.user.firstName ?? null,
        lastName: null,
        organisationId: session.user.organizationId ?? null,
        organizationId: session.user.organizationId ?? null,
      }
    : null;

  return {
    user,
    loading: status === "loading",
    logout: () => signOut({ callbackUrl: "/auth/login" }),
    /** Call update() after setupOrganization() to refresh the JWT with the new org. */
    update,
  };
}
