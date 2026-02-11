"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsByCategory } from "../lib/docs";

export function DocSidebar() {
  const pathname = usePathname();

  return (
    <aside className="space-y-6">
      {docsByCategory.map((group) => (
        <div key={group.category}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {group.category}
          </p>
          <div className="space-y-1">
            {group.pages.map((page) => {
              const href = `/docs/${page.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={page.slug}
                  href={href}
                  className={`doc-sidebar-link ${isActive ? "doc-sidebar-link-active" : ""}`}
                >
                  {page.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
