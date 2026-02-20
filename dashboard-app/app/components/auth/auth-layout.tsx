"use client";

/**
 * Auth Layout
 * Shared component in auth/auth-layout.tsx.
 */

import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackLink?: boolean;
  backLinkHref?: string;
  backLinkText?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackLink = false,
  backLinkHref = "/",
  backLinkText = "Back to home",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-white">
      <div className="flex min-h-screen flex-col">
        {/* Header with Logo */}
        <header className="w-full px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4">
              <Image
                src="/logo.svg"
                alt="Ablelytics"
                width={160}
                height={40}
                priority
              />
            </Link>
            
            {showBackLink && (
              <Link
                href={backLinkHref}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                {backLinkText}
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[480px]">
            {/* Title Section */}
            {title && (
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-lg text-slate-600">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Card Container */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <p>© 2026 Ablelytics · Automated accessibility scanning</p>
              <nav className="flex gap-6">
                <Link
                  href="/privacy"
                  className="hover:text-slate-900 transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-slate-900 transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-slate-900 transition-colors"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
