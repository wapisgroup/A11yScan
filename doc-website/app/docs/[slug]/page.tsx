import { notFound } from "next/navigation";
import Link from "next/link";
import { DocHeader } from "../../components/doc-header";
import { DocFooter } from "../../components/doc-footer";
import { DocSidebar } from "../../components/doc-sidebar";
import { DocToc } from "../../components/doc-toc";
import { docPages, getDocBySlug } from "../../lib/docs";

export async function generateStaticParams() {
  return docPages.map((page) => ({ slug: page.slug }));
}

export default async function DocPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const slugValue = Array.isArray(resolvedParams.slug)
    ? resolvedParams.slug[0]
    : resolvedParams.slug;

  if (!slugValue) return notFound();

  const doc = getDocBySlug(slugValue);
  if (!doc) return notFound();

  const index = docPages.findIndex((page) => page.slug === doc.slug);
  const prev = index > 0 ? docPages[index - 1] : null;
  const next = index < docPages.length - 1 ? docPages[index + 1] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <DocHeader />
      <main id="content" className="container-pad py-10 flex-1">
        <div className="docs-shell">
          <div className="hidden lg:block">
            <DocSidebar />
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_220px]">
            <article className="space-y-10">
              <header className="doc-card">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span className="doc-badge">{doc.category}</span>
                  <span>Documentation</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-4">
                  {doc.title}
                </h1>
                <p className="text-lg text-slate-600 mt-3">{doc.description}</p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  <Link href="/" className="doc-link">Docs Home</Link>
                  <Link href="/docs/getting-started" className="doc-link">Getting Started</Link>
                  <Link href="/docs/troubleshooting" className="doc-link">Support</Link>
                </div>
              </header>

              {doc.sections.map((section) => (
                <section key={section.id} id={section.id} className="doc-card scroll-mt-24">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-3">{section.title}</h2>
                  {section.body?.map((paragraph, idx) => (
                    <p key={idx} className="text-slate-600 mb-3">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="list-disc list-inside text-slate-600 space-y-2">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {section.steps ? (
                    <ol className="list-decimal list-inside text-slate-600 space-y-2">
                      {section.steps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  ) : null}
                  {section.callout ? (
                    <div
                      className={`doc-callout ${
                        section.callout.tone === "warn" ? "doc-callout-warn" : "doc-callout-info"
                      } mt-4`}
                    >
                      <p className="font-semibold">{section.callout.title}</p>
                      <p className="mt-1">{section.callout.body}</p>
                    </div>
                  ) : null}
                </section>
              ))}

              <div className="grid gap-4 md:grid-cols-2">
                {prev ? (
                  <Link href={`/docs/${prev.slug}`} className="doc-card">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Previous</p>
                    <h3 className="text-lg font-semibold text-slate-900 mt-2">{prev.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{prev.description}</p>
                  </Link>
                ) : (
                  <div className="doc-card border-dashed text-slate-400">
                    <p className="text-sm">You are at the beginning of the docs.</p>
                  </div>
                )}
                {next ? (
                  <Link href={`/docs/${next.slug}`} className="doc-card">
                    <p className="text-xs uppercase tracking-wider text-slate-400">Next</p>
                    <h3 className="text-lg font-semibold text-slate-900 mt-2">{next.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{next.description}</p>
                  </Link>
                ) : (
                  <div className="doc-card border-dashed text-slate-400">
                    <p className="text-sm">You have reached the final page.</p>
                  </div>
                )}
              </div>
            </article>

            <div className="hidden xl:block">
              <DocToc sections={doc.sections} />
            </div>
          </div>
        </div>
      </main>
      <DocFooter />
    </div>
  );
}
