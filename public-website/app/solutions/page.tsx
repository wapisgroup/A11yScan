import Link from "next/link";
import {
  HiShieldCheck,
  HiWrenchScrewdriver,
  HiArrowTrendingUp,
  HiSparkles,
  HiClipboardDocumentCheck,
  HiBriefcase,
  HiCodeBracket,
  HiCheckCircle,
  HiExclamationTriangle,
  HiScale,
  HiGlobeAlt,
} from "react-icons/hi2";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { buildPageMetadata } from "../libs/metadata";
import {
  URL_FRONTEND_SOLUTIONS_COMPLIANCE,
  URL_FRONTEND_SOLUTIONS_AGENCIES,
  URL_FRONTEND_SOLUTIONS_DEVELOPERS,
  URL_FRONTEND_CONTACT,
  URL_AUTH_REGISTER,
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

      {/* Hero */}
      <section className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, rgba(45,45,110,0.04), rgba(95,59,143,0.06), rgba(57,176,206,0.04))' }} />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
              style={{ background: 'rgba(95,59,143,0.07)', borderColor: 'rgba(95,59,143,0.2)', color: '#5f3b8f' }}>
              <HiSparkles className="w-4 h-4" />
              SOLUTIONS BY TEAM
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Accessibility That Fits{" "}
              <span style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab, #39b0ce)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                How You Work
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Whether you own compliance, run client audits, or ship code - Ablelytics has a workflow built around your role.
            </p>
          </div>

          {/* 3 solution cards */}
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <Link href={URL_FRONTEND_SOLUTIONS_COMPLIANCE}
              className="group bg-white border-2 border-slate-200 hover:border-[#5f3b8f] rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(95,59,143,0.1)' }}>
                <HiShieldCheck className="w-6 h-6" style={{ color: '#5f3b8f' }} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#5f3b8f] transition-colors">Compliance Teams</h3>
              <p className="text-slate-600 mb-5 text-sm leading-relaxed">Audit-ready reports with WCAG criterion mapping, traceable evidence, and continuous monitoring to stay defensible before an auditor or regulator calls.</p>
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#5f3b8f' }}>
                Explore compliance <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>

            <Link href={URL_FRONTEND_SOLUTIONS_AGENCIES}
              className="group bg-white border-2 border-slate-200 hover:border-[#3861ab] rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(56,97,171,0.1)' }}>
                <HiBriefcase className="w-6 h-6" style={{ color: '#3861ab' }} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#3861ab] transition-colors">Agencies</h3>
              <p className="text-slate-600 mb-5 text-sm leading-relaxed">Manage multiple client sites, deliver white-label branded PDF reports, and automate recurring monitoring - so you spend time consulting, not testing manually.</p>
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#3861ab' }}>
                Explore agencies <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>

            <Link href={URL_FRONTEND_SOLUTIONS_DEVELOPERS}
              className="group bg-white border-2 border-slate-200 hover:border-[#39b0ce] rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(57,176,206,0.1)' }}>
                <HiCodeBracket className="w-6 h-6" style={{ color: '#39b0ce' }} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#39b0ce] transition-colors">Developers</h3>
              <p className="text-slate-600 mb-5 text-sm leading-relaxed">Trigger scans from CI/CD, receive results via webhook, and query violations through the REST API. Shift accessibility left without changing how you ship.</p>
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#39b0ce' }}>
                Explore developers <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* The stakes - why it matters */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Accessibility is no longer optional
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Legal exposure, user exclusion, and regulatory deadlines are converging. The question is when you address it - not whether.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(95,59,143,0.1)' }}>
                  <HiExclamationTriangle className="w-6 h-6" style={{ color: '#5f3b8f' }} />
                </div>
                <div className="text-3xl font-black mb-1" style={{ color: '#5f3b8f' }}>4,600+</div>
                <div className="text-sm font-semibold text-slate-500 mb-3">Lawsuits filed per year</div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  ADA Title III web accessibility lawsuits hit record highs. Average settlement and legal costs exceed $75,000 - and rising.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(56,97,171,0.1)' }}>
                  <HiScale className="w-6 h-6" style={{ color: '#3861ab' }} />
                </div>
                <div className="text-3xl font-black mb-1" style={{ color: '#3861ab' }}>June 2025</div>
                <div className="text-sm font-semibold text-slate-500 mb-3">EAA enforcement deadline</div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The European Accessibility Act mandates WCAG compliance for digital products sold in the EU, with fines up to €100,000 per violation.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(57,176,206,0.1)' }}>
                  <HiGlobeAlt className="w-6 h-6" style={{ color: '#39b0ce' }} />
                </div>
                <div className="text-3xl font-black mb-1" style={{ color: '#39b0ce' }}>1 in 4</div>
                <div className="text-sm font-semibold text-slate-500 mb-3">Adults have a disability</div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  That's over 1.3 billion people globally. Inaccessible sites exclude a massive audience - and expose you to risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you get - 3 capability pillars */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                One platform. Every role covered.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Shared reporting and evidence - with workflows tuned to how each team actually works.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl p-8 border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(95,59,143,0.1)' }}>
                  <HiClipboardDocumentCheck className="w-6 h-6" style={{ color: '#5f3b8f' }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Compliance-ready coverage</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">Every issue mapped to WCAG criteria with selector-level evidence. Produce audit trails that hold up to scrutiny.</p>
                <ul className="space-y-1.5">
                  {["WCAG 2.2, ADA, Section 508, EN 301 549", "Timestamped scan history", "Branded PDF export"].map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                      <HiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#5f3b8f' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-8 border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(56,97,171,0.1)' }}>
                  <HiWrenchScrewdriver className="w-6 h-6" style={{ color: '#3861ab' }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Fix faster across teams</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">CSS selectors, code context, and AI-generated fix suggestions mean developers spend time fixing - not deciphering reports.</p>
                <ul className="space-y-1.5">
                  {["Element selectors and code context", "AI fix suggestions per finding", "Severity-ranked issue lists"].map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                      <HiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3861ab' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl p-8 border border-slate-100 bg-slate-50 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(57,176,206,0.1)' }}>
                  <HiArrowTrendingUp className="w-6 h-6" style={{ color: '#39b0ce' }} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Track progress over time</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">Score trends across every scan show whether you're improving or regressing - useful for internal reporting and stakeholder buy-in.</p>
                <ul className="space-y-1.5">
                  {["Scan score trend charts", "Regression alerts on new violations", "Portfolio view across projects"].map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs text-slate-600">
                      <HiCheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#39b0ce' }} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow section - brand gradient */}
      <section className="py-16 md:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2d2d6e 0%, #5f3b8f 55%, #3861ab 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #39b0ce, transparent)' }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative">
          <div className="grid gap-8 lg:grid-cols-2 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                A workflow that fits how you deliver
              </h2>
              <p className="text-slate-200 text-lg mb-6 leading-relaxed">
                Start with automated coverage, layer in proprietary checks, then add AI-backed insights for the hard-to-spot issues. Keep everything tied to evidence so teams can move from findings to fixes with confidence.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Evidence snapshots", "Manual review prompts", "Actionable reports", "Scheduled monitoring"].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">{tag}</span>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              {[
                { icon: HiSparkles, color: 'rgba(57,176,206,0.3)', title: 'Scan and prioritize', desc: 'Crawl sites or single pages, then group issues by severity and WCAG criteria.' },
                { icon: HiShieldCheck, color: 'rgba(95,59,143,0.3)', title: 'Validate with evidence', desc: 'Capture selectors, context, and notes so audits hold up to scrutiny.' },
                { icon: HiClipboardDocumentCheck, color: 'rgba(56,97,171,0.3)', title: 'Report with clarity', desc: 'Export reports that stakeholders can understand and teams can act on.' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="bg-white/10 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 text-white font-semibold mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: color }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span>{title}</span>
                  </div>
                  <p className="text-slate-200 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Pick the solution that matches your team
            </h2>
            <p className="text-lg text-slate-600">
              All solutions share the same scan engines and evidence - just different workflows.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto mb-10">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Compliance teams</h3>
              <p className="text-slate-600 mb-4 text-sm">Executive dashboards, audit trails, and manual review checklists.</p>
              <Link href={URL_FRONTEND_SOLUTIONS_COMPLIANCE} className="text-sm font-semibold" style={{ color: '#5f3b8f' }}>View compliance workflows →</Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Agencies</h3>
              <p className="text-slate-600 mb-4 text-sm">Client reporting, portfolio monitoring, and white-label delivery.</p>
              <Link href={URL_FRONTEND_SOLUTIONS_AGENCIES} className="text-sm font-semibold" style={{ color: '#3861ab' }}>View agency workflows →</Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Engineering</h3>
              <p className="text-slate-600 mb-4 text-sm">CI-friendly scans, issue triage, and dev-focused remediation details.</p>
              <Link href={URL_FRONTEND_SOLUTIONS_DEVELOPERS} className="text-sm font-semibold" style={{ color: '#39b0ce' }}>View engineering workflows →</Link>
            </div>
          </div>
          <div className="text-center">
            <Link href={URL_FRONTEND_CONTACT}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #5f3b8f, #3861ab)' }}>
              Talk to sales
            </Link>
          </div>
        </div>
      </section>

      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}
