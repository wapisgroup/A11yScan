"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getDocIndex, docsByCategory } from "../lib/docs";
import { HiSparkles, HiGlobeAlt, HiShieldCheck, HiCodeBracket } from "react-icons/hi2";

const options = [
  {
    title: "Compliance Teams",
    description: "Build defensible reports, track risk, and stay audit-ready.",
    href: "/docs/reports",
    icon: HiShieldCheck,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Agencies & Consultants",
    description: "Deliver repeatable audits and client-ready documentation.",
    href: "/docs/reports",
    icon: HiSparkles,
    color: "from-indigo-500 to-violet-500",
  },
  {
    title: "Developers",
    description: "Translate issues into fixes with selectors and WCAG references.",
    href: "/docs/interpreting-results",
    icon: HiCodeBracket,
    color: "from-sky-500 to-blue-500",
  },
  {
    title: "Product Owners",
    description: "Scan entire sites and monitor progress over time.",
    href: "/docs/scans-and-runs",
    icon: HiGlobeAlt,
    color: "from-amber-500 to-orange-500",
  },
];

export function DocHome() {
  const [query, setQuery] = useState("");
  const index = getDocIndex();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index;
    return index.filter((doc) =>
      [doc.title, doc.description, doc.category].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [query, index]);

  return (
    <div className="space-y-16">
      <section className="doc-card bg-gradient-to-br from-white to-slate-50 border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <span className="doc-chip bg-indigo-50 text-indigo-700 border-indigo-200">
              Documentation
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-4">
              Ablelytics Client Documentation
            </h1>
            <p className="text-lg text-slate-600 mt-4 max-w-2xl">
              Everything you need to run scans, interpret accessibility results, and deliver
              compliance-ready reports. Start with the docs below or pick a path.
            </p>
          </div>
          <div className="w-full lg:w-[360px]">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-soft">
              <p className="text-sm uppercase tracking-wider text-slate-300">Quick start</p>
              <ol className="mt-4 space-y-3 text-sm">
                <li>1. Create a project</li>
                <li>2. Crawl or upload a sitemap</li>
                <li>3. Run a scan and review issues</li>
                <li>4. Generate a report</li>
              </ol>
              <Link
                href="/docs/getting-started"
                className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold"
              >
                Start here
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Choose your path</h2>
          <span className="text-sm text-slate-500">Tailored entry points</span>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {options.map((option) => (
            <Link key={option.title} href={option.href} className="doc-card group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center text-white mb-4`}>
                <option.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                {option.title}
              </h3>
              <p className="text-sm text-slate-600 mt-2">{option.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="doc-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Find documentation</h2>
            <p className="text-slate-600">Search by feature, workflow, or topic.</p>
          </div>
          <input
            type="search"
            placeholder="Search docs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-72 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <Link key={doc.slug} href={`/docs/${doc.slug}`} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-soft transition">
              <p className="text-xs uppercase tracking-wider text-slate-400">{doc.category}</p>
              <h3 className="text-lg font-semibold text-slate-900 mt-2">{doc.title}</h3>
              <p className="text-sm text-slate-600 mt-2">{doc.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse by category</h2>
          <span className="text-sm text-slate-500">Full documentation set</span>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {docsByCategory.map((group) => (
            <div key={group.category} className="doc-card">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{group.category}</h3>
              <ul className="space-y-2 text-sm">
                {group.pages.map((page) => (
                  <li key={page.slug}>
                    <Link href={`/docs/${page.slug}`} className="doc-link">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
