import Link from "next/link";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { buildPageMetadata } from "../libs/metadata";

export const metadata = buildPageMetadata({
  title: "Accessibility Guides",
  description:
    "Step-by-step guides for scanning, reporting, remediation, and accessibility workflows.",
  path: "/guides"
});

const guides = [
  {
    slug: "getting-started",
    title: "Getting Started with Ablelytics",
    description: "Set up your first scan, define scope, and generate a baseline report.",
    tag: "Basics"
  },
  {
    slug: "scan-configuration",
    title: "Scan Configuration Playbook",
    description: "Crawl depth, include/exclude rules, and how to handle auth and staging.",
    tag: "Scanning"
  },
  {
    slug: "interpreting-results",
    title: "How to Interpret Accessibility Results",
    description: "Triage by severity, WCAG criteria, and remediation effort.",
    tag: "Reporting"
  },
  {
    slug: "reporting-and-evidence",
    title: "Reporting and Evidence Workflow",
    description: "Produce audit-ready PDFs with issue context, evidence, and screenshots.",
    tag: "Reporting"
  },
  {
    slug: "ai-fix-suggestions",
    title: "Using AI Fix Suggestions",
    description: "Apply AI-assisted remediation while keeping human review in the loop.",
    tag: "AI"
  },
  {
    slug: "manual-review-checklist",
    title: "Manual Review Checklist",
    description: "Cover keyboard, focus order, screen reader, and content quality checks.",
    tag: "Compliance"
  },
  {
    slug: "scheduling-and-monitoring",
    title: "Scheduling and Monitoring",
    description: "Set recurring scans, track regressions, and configure notifications.",
    tag: "Automation"
  },
  {
    slug: "ci-cd-integration",
    title: "CI/CD Integration",
    description: "Run scans in your pipeline and fail builds on critical regressions.",
    tag: "Automation"
  },
  {
    slug: "cookie-banner-handling",
    title: "Cookie Banner Handling",
    description: "Remove overlays cleanly to avoid false positives in your scans.",
    tag: "Scanning"
  }
];

export default function GuidesPage() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-slate-700 text-sm font-semibold mb-6">
              GUIDES
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Practical Accessibility Playbooks
            </h1>
            <p className="text-lg text-slate-600">
              Step-by-step guides for scanning, reporting, and fixing accessibility issues.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-indigo-400 hover:shadow-xl transition-all"
              >
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 mb-4">
                  {guide.tag}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600">
                  {guide.title}
                </h3>
                <p className="text-slate-600">{guide.description}</p>
              </Link>
            ))}
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Suggested learning path</h3>
              <ol className="space-y-3 text-slate-700 list-decimal list-inside">
                <li>Getting Started with Ablelytics</li>
                <li>Scan Configuration Playbook</li>
                <li>How to Interpret Accessibility Results</li>
                <li>Reporting and Evidence Workflow</li>
                <li>Manual Review Checklist</li>
              </ol>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Need a custom workflow?</h3>
              <p className="text-slate-700 mb-6">
                Book a short call and we will help you design a scanning and reporting workflow
                tailored to your team and compliance goals.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Talk to the team
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}
