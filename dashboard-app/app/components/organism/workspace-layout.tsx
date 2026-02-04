"use client";

import React, { type ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Header from "@/components/molecule/header";
import {
  URL_APP_DASHBOARD,
  URL_APP_PROJECTS,
  URL_APP_REPORTS,
  URL_APP_SCANS,
} from "@/utils/urls";
import { PiCirclesFourLight, PiFolderOpenLight, PiNotepadLight } from "react-icons/pi";
import { FiUser, FiLogOut, FiSettings, FiCreditCard } from "react-icons/fi";
import { useToast } from "../providers/window-provider";
import { subscribeToJobsWithToasts } from "@/services/jobsService";
import { useAuth } from "@/utils/firebase";
import { URL_APP_PROFILE, URL_APP_ORGANISATION, URL_APP_BILLING } from "@/utils/urls";
import { useRouter } from "next/navigation";

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const toast = useToast();
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToJobsWithToasts(toast);
    return unsubscribe;
  }, [toast]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navItems = [
    { href: URL_APP_DASHBOARD, label: "Dashboard", icon: <PiCirclesFourLight /> },
    { href: URL_APP_PROJECTS, label: "Projects", icon: <PiFolderOpenLight /> },
    { href: URL_APP_SCANS, label: "Scans", icon: <PiNotepadLight /> },
    { href: URL_APP_REPORTS, label: "Reports", icon: <PiNotepadLight /> },
  ];

  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* <Header /> */}

      <div className="min-h-screen flex">
        {/* Fixed Sidebar Navigation */}
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#0a0e1a] via-[#0e1628] to-[#0a0e1a] border-r border-[#1e293b] flex flex-col shadow-2xl z-50">
          {/* Logo Section */}
          <div className="px-6 pt-8 pb-6 border-b border-[#1e293b]/50">
            <div className="flex items-center justify-start">
              <img 
                src="/logo-white.svg" 
                alt="Ablelytics" 
                className="h-10 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      `group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ` +
                      (pathname === item.href
                        ? "bg-gradient-to-r from-cyan-500/10 to-purple-600/10 text-cyan-400 shadow-lg shadow-cyan-500/10"
                        : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white")
                    }
                  >
                    {/* Active indicator */}
                    {pathname === item.href && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-r-full" />
                    )}
                    
                    <span className={
                      `flex-shrink-0 text-xl transition-transform duration-200 ` +
                      (pathname === item.href ? "scale-110" : "group-hover:scale-110")
                    }>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section at Bottom */}
          <div className="border-t border-[#1e293b]/50 mt-auto">
            {user && (
              <div className="px-4 py-4 border-b border-[#1e293b]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                    {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    {(user.firstName || user.lastName) && (
                      <div className="text-white font-medium text-sm truncate">
                        {user.firstName} {user.lastName}
                      </div>
                    )}
                    <div className="text-[#64748b] text-xs truncate">{user.email}</div>
                  </div>
                </div>
              </div>
            )}
            
            <ul className="flex flex-col gap-1 py-3 px-3">
              <li>
                <Link
                  href={URL_APP_PROFILE}
                  className={
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ` +
                    (pathname === URL_APP_PROFILE
                      ? "bg-[#1e293b] text-cyan-400"
                      : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white")
                  }
                >
                  <span className="flex-shrink-0">
                    <FiUser />
                  </span>
                  <span className="text-sm">My account</span>
                </Link>
              </li>
              <li>
                <Link
                  href={URL_APP_ORGANISATION}
                  className={
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ` +
                    (pathname === URL_APP_ORGANISATION
                      ? "bg-[#1e293b] text-cyan-400"
                      : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white")
                  }
                >
                  <span className="flex-shrink-0">
                    <FiSettings />
                  </span>
                  <span className="text-sm">Organisation</span>
                </Link>
              </li>
              <li>
                <Link
                  href={URL_APP_BILLING}
                  className={
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ` +
                    (pathname === URL_APP_BILLING
                      ? "bg-[#1e293b] text-cyan-400"
                      : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-white")
                  }
                >
                  <span className="flex-shrink-0">
                    <FiCreditCard />
                  </span>
                  <span className="text-sm">Billing</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#94a3b8] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                >
                  <span className="flex-shrink-0">
                    <FiLogOut />
                  </span>
                  <span className="text-sm">Sign out</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content Area with left margin to account for fixed sidebar */}
        <div className="flex-1 ml-64">
          <div className="flex flex-col gap-x-2 bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#FFFFFF] min-h-screen">
            <main className="px-6 pt-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}