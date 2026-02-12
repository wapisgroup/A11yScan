"use client";

/**
 * Header
 * Shared component in molecule/header.tsx.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/utils/firebase";
import { URL_APP_PROFILE, URL_AUTH_LOGIN } from "@/utils/urls";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = async () => {
    await logout();
    router.replace(URL_AUTH_LOGIN);
  };

  return (
    <header className="flex h-14 items-center gap-8 px-4 sm:px-6 border-b border-white/10">
      <div className="flex items-center p-4 w-full justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <img src="/web-logo-02.svg" alt="Ablelytics" className="h-10" />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-300">
                Hi, <Link href={URL_APP_PROFILE}>{user.firstName || user.email}</Link>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              <Link
                href={URL_AUTH_LOGIN}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}