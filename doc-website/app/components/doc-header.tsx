"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const navItems = [
  { label: "Docs", href: "/" },
  { label: "Getting Started", href: "/docs/getting-started" },
  { label: "Scans", href: "/docs/scans-and-runs" },
  { label: "Reports", href: "/docs/reports" },
  { label: "Billing", href: "/docs/billing-and-usage" },
];

export function DocHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="container-pad">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Ablelytics" width={140} height={36} priority />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Docs</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-slate-900">
                {item.label}
              </Link>
            ))}
            <a
              href="https://app.ablelytics.com/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-soft hover:shadow"
            >
              Go to App
            </a>
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            <span className="text-lg">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="container-pad py-4 flex flex-col gap-3 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-slate-900" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <a
              href="https://app.ablelytics.com/login"
              className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold"
            >
              Go to App
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
