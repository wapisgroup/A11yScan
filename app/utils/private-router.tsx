"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./firebase";


type PrivateRouteProps = {
  children: ReactNode;
  /**
   * Where to send unauthenticated users.
   * Default matches a typical Next.js route: `/login`.
   */
  redirectTo?: string;
};

export function PrivateRoute({ children, redirectTo = "/auth/login" }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) return <div className="p-8">Loading...</div>;

  // While redirecting, render nothing to avoid flashing protected UI.
  if (!user) return null;

  return <>{children}</>;
}