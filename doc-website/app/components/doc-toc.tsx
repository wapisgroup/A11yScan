import Link from "next/link";
import type { DocSection } from "../lib/docs";

export function DocToc({ sections }: { sections: DocSection[] }) {
  return (
    <div className="sticky top-24 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">On this page</p>
      <ul className="space-y-2 text-sm text-slate-600">
        {sections.map((section) => (
          <li key={section.id}>
            <Link href={`#${section.id}`} className="doc-link">
              {section.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
