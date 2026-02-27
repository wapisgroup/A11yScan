import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { buildPageMetadata } from "../libs/metadata";
import Link from "next/link";
import {
  HiShieldCheck,
  HiCog6Tooth,
  HiChartBar,
  HiLockClosed,
  HiEnvelope,
  HiArrowRight,
  HiCheckCircle,
  HiXCircle,
  HiInformationCircle,
  HiGlobeAlt,
  HiSparkles,
} from "react-icons/hi2";

export const metadata = buildPageMetadata({
  title: "Cookies Policy",
  description:
    "Details on how Ablelytics uses cookies, analytics, and consent controls.",
  path: "/cookies",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 scroll-mt-20"
    >
      <div className="flex items-center gap-3 mb-6">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #39b0ce, #3861ab)" }}
        >
          {number}
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CookiesPage() {
  return (
    <LoggedOutLayout>
      <LoggedOutHeader />

      <main>
        {/* ── Hero ── */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #e8f7fb 0%, #eff4ff 50%, #f5f3ff 100%)",
            }}
          />
          {/* Decorative orb */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #39b0ce 0%, transparent 70%)",
            }}
          />

          <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 border"
                style={{
                  background: "rgba(57,176,206,0.08)",
                  borderColor: "rgba(57,176,206,0.25)",
                  color: "#1a8099",
                }}
              >
                <HiSparkles className="w-3.5 h-3.5" />
                Transparent by design
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                Cookie Policy
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
                We only use cookies that are necessary for the platform to work,
                or where you have given explicit consent. Here is exactly what
                we set and why.
              </p>

              {/* Trust chips */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { Icon: HiShieldCheck, label: "GDPR & ePrivacy Compliant" },
                  { Icon: HiCog6Tooth, label: "Consent Controlled" },
                  { Icon: HiCheckCircle, label: "No Tracking Without Consent" },
                ].map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-sm text-slate-700 shadow-sm font-medium"
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "#1a8099" }}
                    />
                    {label}
                  </div>
                ))}
              </div>

              <p className="text-sm text-slate-400">
                <em>Last updated: 13 January 2026</em>
              </p>
            </div>
          </div>
        </section>

        {/* ── Quick Navigation ── */}
        <div className="bg-white border-b border-slate-100 py-3">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto overflow-x-auto">
              <nav
                aria-label="Jump to section"
                className="flex gap-1 text-sm whitespace-nowrap"
              >
                {[
                  ["#purpose", "Purpose"],
                  ["#cookie-types", "Cookie Types"],
                  ["#management", "Management"],
                  ["#updates", "Updates"],
                  ["#contact", "Contact"],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={href!}
                    className="px-3 py-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <section className="bg-slate-50 py-12">
          <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-6">

              {/* 1 — Purpose */}
              <SectionCard id="purpose" number="1" title="Purpose">
                <p className="text-slate-600 text-sm leading-relaxed">
                  This Cookie Policy explains how Ablelytics uses cookies and
                  similar technologies in accordance with GDPR and ePrivacy
                  requirements. We are committed to full transparency about what
                  is stored in your browser and why.
                </p>
              </SectionCard>

              {/* 2 — Cookie Types */}
              <div id="cookie-types" className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4 px-1">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #39b0ce, #3861ab)",
                    }}
                  >
                    2
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Categories of Cookies Used
                  </h2>
                </div>

                <div className="flex flex-col gap-4">

                  {/* Strictly Necessary */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div
                      className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                      style={{ background: "rgba(42,122,96,0.04)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(42,122,96,0.12)" }}
                        >
                          <HiLockClosed
                            className="w-4 h-4"
                            style={{ color: "#2a7a60" }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            Strictly Necessary
                          </p>
                          <p className="text-xs text-slate-500">
                            Authentication &amp; core functionality
                          </p>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(42,122,96,0.1)",
                          color: "#2a7a60",
                        }}
                      >
                        <HiCheckCircle className="w-3 h-3" />
                        Always active
                      </span>
                    </div>
                    <div className="px-6 py-5">
                      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                        These cookies are essential for the platform to
                        function. They cannot be disabled without breaking core
                        features.
                      </p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[
                          { label: "User authentication", icon: "🔑" },
                          { label: "Session management", icon: "🔄" },
                          { label: "Core platform features", icon: "⚙️" },
                        ].map(({ label, icon }) => (
                          <div
                            key={label}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600"
                          >
                            <span>{icon}</span>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div
                      className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                      style={{ background: "rgba(57,176,206,0.04)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(57,176,206,0.12)" }}
                        >
                          <HiChartBar
                            className="w-4 h-4"
                            style={{ color: "#1a8099" }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            Analytics Cookies
                          </p>
                          <p className="text-xs text-slate-500">
                            Google Analytics — consent required
                          </p>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(57,176,206,0.1)",
                          color: "#1a8099",
                        }}
                      >
                        <HiCog6Tooth className="w-3 h-3" />
                        Consent required
                      </span>
                    </div>
                    <div className="px-6 py-5">
                      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                        Google Analytics collects aggregated, anonymised usage
                        data to help us understand how the platform is used and
                        improve the experience. These cookies are only set where
                        consent has been provided.
                      </p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[
                          { label: "Page interactions", icon: "📄" },
                          { label: "Session duration", icon: "⏱" },
                          { label: "Device &amp; browser type", icon: "💻" },
                        ].map(({ label, icon }) => (
                          <div
                            key={label}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600"
                          >
                            <span>{icon}</span>
                            <span dangerouslySetInnerHTML={{ __html: label }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Firebase */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div
                      className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
                      style={{ background: "rgba(245,158,11,0.04)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(245,158,11,0.12)" }}
                        >
                          <HiGlobeAlt
                            className="w-4 h-4"
                            style={{ color: "#b45309" }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            Firebase Cookies
                          </p>
                          <p className="text-xs text-slate-500">
                            Infrastructure &amp; performance
                          </p>
                        </div>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          color: "#b45309",
                        }}
                      >
                        <HiCheckCircle className="w-3 h-3" />
                        Always active
                      </span>
                    </div>
                    <div className="px-6 py-5">
                      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                        Firebase sets cookies to support platform
                        infrastructure. These are required for secure login
                        sessions and real-time error detection.
                      </p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[
                          { label: "Secure login", icon: "🔐" },
                          { label: "Performance monitoring", icon: "📊" },
                          { label: "Error detection", icon: "🛡" },
                        ].map(({ label, icon }) => (
                          <div
                            key={label}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600"
                          >
                            <span>{icon}</span>
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 — Management */}
              <SectionCard id="management" number="3" title="Cookie Management">
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  You can control which non-essential cookies are set at any
                  time. Disabling strictly necessary cookies may affect
                  platform functionality.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      title: "Browser Settings",
                      desc: "Most browsers let you block or delete cookies through their privacy or security settings.",
                      Icon: HiCog6Tooth,
                      color: "#3861ab",
                      bg: "rgba(56,97,171,0.06)",
                      border: "rgba(56,97,171,0.15)",
                    },
                    {
                      title: "Consent Banner",
                      desc: "When you first visit, you can accept or decline analytics cookies via our consent banner.",
                      Icon: HiShieldCheck,
                      color: "#1a8099",
                      bg: "rgba(57,176,206,0.06)",
                      border: "rgba(57,176,206,0.15)",
                    },
                  ].map(({ title, desc, Icon, color, bg, border }) => (
                    <div
                      key={title}
                      className="rounded-xl p-5 border"
                      style={{ background: bg, borderColor: border }}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: color + "22" }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">
                          {title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-start gap-3 mt-4 px-4 py-3 rounded-xl border"
                  style={{
                    background: "rgba(245,158,11,0.04)",
                    borderColor: "rgba(245,158,11,0.2)",
                  }}
                >
                  <HiInformationCircle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: "#b45309" }}
                  />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Disabling strictly necessary cookies will prevent login and
                    may break core platform features. Analytics cookies can be
                    declined without affecting functionality.
                  </p>
                </div>
              </SectionCard>

              {/* 4 — Updates */}
              <SectionCard id="updates" number="4" title="Policy Updates">
                <p className="text-slate-600 text-sm leading-relaxed">
                  This policy may be updated to reflect changes in regulation,
                  technology, or platform features. When we make material
                  changes, we will update the date at the top of this page and,
                  where appropriate, notify you directly.
                </p>
              </SectionCard>

              {/* 5 — Contact */}
              <div
                id="contact"
                className="rounded-2xl border p-8 scroll-mt-20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(57,176,206,0.07) 0%, rgba(56,97,171,0.07) 100%)",
                  borderColor: "rgba(57,176,206,0.25)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #39b0ce, #3861ab)",
                    }}
                  >
                    5
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Contact</h2>
                </div>

                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  If you have questions about how we use cookies or wish to
                  withdraw consent, get in touch with our privacy team.
                </p>

                <a
                  href="mailto:support@ablelytics.com"
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #39b0ce, #3861ab)",
                  }}
                >
                  <HiEnvelope className="w-4 h-4" />
                  support@ablelytics.com
                </a>
              </div>

              {/* Related links */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {[
                  { href: "/privacy/", label: "Privacy Policy" },
                  { href: "/terms/", label: "Terms & Conditions" },
                  { href: "/contact/", label: "Contact Us" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {label}
                    <HiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>
      </main>

      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}
