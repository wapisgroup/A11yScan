import Link from "next/link";
import {
  HiArrowTrendingUp,
  HiClipboardDocumentCheck,
  HiShieldCheck,
  HiSparkles,
  HiWrenchScrewdriver
} from "react-icons/hi2";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { buildPageMetadata } from "../libs/metadata";
import {
  URL_FRONTEND_SOLUTIONS_COMPLIANCE,
  URL_FRONTEND_SOLUTIONS_AGENCIES,
  URL_FRONTEND_SOLUTIONS_DEVELOPERS,
  URL_FRONTEND_CONTACT
} from "../services/urlServices";

export const metadata = buildPageMetadata({
  title: "Solutions",
  description:
    "Accessibility programs tailored for compliance teams, agencies, and developers.",
  path: "/solutions"
});

export default function SolutionsPage() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 text-sm font-semibold mb-6">
              SOLUTIONS BY TEAM
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Accessibility Programs Built for Your Workflow
            </h1>
            <p className="text-lg text-slate-600">
              Whether you are a compliance officer, an agency, or an engineering team, Ablelytics
              adapts to how you audit, fix, and report.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Link href={URL_FRONTEND_SOLUTIONS_COMPLIANCE} className="group bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-indigo-400 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600">Compliance</h3>
              <p className="text-slate-600 mb-4">Audit-ready reporting and traceable evidence for WCAG, ADA, and Section 508.</p>
              <span className="text-indigo-600 font-semibold">Explore compliance →</span>
            </Link>

            <Link href={URL_FRONTEND_SOLUTIONS_AGENCIES} className="group bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-emerald-400 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600">Agencies</h3>
              <p className="text-slate-600 mb-4">Manage multiple client sites with white-label reports and automated monitoring.</p>
              <span className="text-emerald-600 font-semibold">Explore agencies →</span>
            </Link>

            <Link href={URL_FRONTEND_SOLUTIONS_DEVELOPERS} className="group bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600">Developers</h3>
              <p className="text-slate-600 mb-4">Integrate scans into CI/CD, review issues faster, and ship accessible code.</p>
              <span className="text-blue-600 font-semibold">Explore developers →</span>
            </Link>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <HiClipboardDocumentCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compliance-ready coverage</h3>
              <p className="text-slate-200">Map every issue to WCAG criteria and keep a clear audit trail with evidence.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <HiWrenchScrewdriver className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Fix faster across teams</h3>
              <p className="text-slate-600">Prioritize issues, share guidance, and keep remediation moving without handoffs.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <HiArrowTrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Track progress over time</h3>
              <p className="text-slate-600">Monitor score changes, regressions, and improvements across releases.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                A workflow that fits how you deliver
              </h2>
              <p className="text-slate-200 text-lg mb-6">
                Start with automated coverage, layer in proprietary checks, then add AI-backed
                insights for the hard-to-spot issues. Keep everything tied to evidence so teams can
                move from findings to fixes with confidence.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">Evidence snapshots</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">Manual review prompts</span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">Actionable reports</span>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="bg-white/10 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-white font-semibold mb-2">
                  <HiSparkles className="w-5 h-5 text-indigo-200" />
                  <span>Scan and prioritize</span>
                </div>
                <p className="text-slate-200 text-sm">Crawl sites or single pages, then group issues by severity and WCAG criteria.</p>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-white font-semibold mb-2">
                  <HiShieldCheck className="w-5 h-5 text-emerald-200" />
                  <span>Validate with evidence</span>
                </div>
                <p className="text-slate-200 text-sm">Capture screenshots, selectors, and notes so audits hold up to scrutiny.</p>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-white font-semibold mb-2">
                  <HiClipboardDocumentCheck className="w-5 h-5 text-purple-200" />
                  <span>Report with clarity</span>
                </div>
                <p className="text-slate-200 text-sm">Export reports that stakeholders can understand and teams can act on.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Pick the solution that matches your team
            </h2>
            <p className="text-lg text-slate-600">
              Each path includes shared reporting and evidence, with workflows tuned to how you work.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Compliance teams</h3>
              <p className="text-slate-600 mb-4">Executive-ready dashboards, audit trails, and manual checklists.</p>
              <Link href={URL_FRONTEND_SOLUTIONS_COMPLIANCE} className="text-indigo-600 font-semibold">View compliance workflows →</Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Agencies</h3>
              <p className="text-slate-600 mb-4">Client reporting, portfolio monitoring, and consistent QA delivery.</p>
              <Link href={URL_FRONTEND_SOLUTIONS_AGENCIES} className="text-emerald-600 font-semibold">View agency workflows →</Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Engineering</h3>
              <p className="text-slate-600 mb-4">CI-friendly scans, issue triage, and dev-focused remediation details.</p>
              <Link href={URL_FRONTEND_SOLUTIONS_DEVELOPERS} className="text-blue-600 font-semibold">View engineering workflows →</Link>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href={URL_FRONTEND_CONTACT} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors">
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}
