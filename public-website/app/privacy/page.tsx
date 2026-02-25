import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { buildPageMetadata } from "../libs/metadata";
import Link from "next/link";
import {
  HiShieldCheck,
  HiLockClosed,
  HiIdentification,
  HiChartBar,
  HiCreditCard,
  HiComputerDesktop,
  HiEye,
  HiPencilSquare,
  HiTrash,
  HiPause,
  HiArrowDownTray,
  HiArrowUturnLeft,
  HiEnvelope,
  HiArrowRight,
  HiCheckBadge,
} from "react-icons/hi2";
import { PiUserLight } from "react-icons/pi";

export const metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how Ablelytics collects, processes, and safeguards personal data in compliance with GDPR.",
  path: "/privacy",
});

// ─── Small helpers ────────────────────────────────────────────────────────────

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
          style={{ background: "linear-gradient(135deg, #5f3b8f, #3861ab)" }}
        >
          {number}
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed">
          <span
            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
            style={{ background: "#5f3b8f" }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
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
                "linear-gradient(135deg, #f5f3ff 0%, #eff4ff 50%, #e8f7fb 100%)",
            }}
          />
          {/* Decorative orb */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #5f3b8f 0%, transparent 70%)",
            }}
          />

          <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 border"
                style={{
                  background: "rgba(95,59,143,0.07)",
                  borderColor: "rgba(95,59,143,0.2)",
                  color: "#5f3b8f",
                }}
              >
                <HiShieldCheck className="w-3.5 h-3.5" />
                GDPR Compliant
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                Privacy Policy
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
                We take your privacy seriously. This policy explains exactly
                what personal data we collect, why we collect it, and how you
                can exercise your rights at any time.
              </p>

              {/* Trust chips */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { Icon: HiShieldCheck, label: "GDPR Compliant" },
                  { Icon: HiLockClosed, label: "Data Encrypted" },
                  { Icon: HiCheckBadge, label: "Your Rights Protected" },
                ].map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-sm text-slate-700 shadow-sm font-medium"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#5f3b8f" }} />
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
                  ["#overview", "Overview"],
                  ["#data-categories", "Data Collected"],
                  ["#lawful-basis", "Lawful Basis"],
                  ["#purpose", "Purpose"],
                  ["#third-parties", "Third Parties"],
                  ["#retention", "Retention"],
                  ["#your-rights", "Your Rights"],
                  ["#security", "Security"],
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

              {/* 1 — Overview */}
              <SectionCard id="overview" number="1" title="Overview">
                <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                  <p>
                    Ablelytics is committed to protecting personal data and
                    ensuring compliance with the General Data Protection
                    Regulation (EU) 2016/679 ("GDPR").
                  </p>
                  <p>
                    This policy describes how personal data is collected,
                    processed, and safeguarded when you use the Ablelytics
                    accessibility testing platform.
                  </p>
                </div>
              </SectionCard>

              {/* 2 — Data Categories */}
              <SectionCard
                id="data-categories"
                number="2"
                title="Categories of Personal Data"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      Icon: PiUserLight,
                      color: "#5f3b8f",
                      bg: "rgba(95,59,143,0.06)",
                      border: "rgba(95,59,143,0.15)",
                      title: "Account & Identity",
                      items: [
                        "Name",
                        "Email address",
                        "Account credentials (securely stored)",
                      ],
                    },
                    {
                      Icon: HiChartBar,
                      color: "#3861ab",
                      bg: "rgba(56,97,171,0.06)",
                      border: "rgba(56,97,171,0.15)",
                      title: "Service Usage",
                      items: [
                        "Websites assessed",
                        "Accessibility scan results",
                        "Platform interaction data",
                      ],
                    },
                    {
                      Icon: HiCreditCard,
                      color: "#39b0ce",
                      bg: "rgba(57,176,206,0.06)",
                      border: "rgba(57,176,206,0.15)",
                      title: "Billing",
                      items: [
                        "Billing contact details",
                        "Subscription status",
                        "Payments processed by provider only",
                      ],
                    },
                    {
                      Icon: HiComputerDesktop,
                      color: "#2a7a60",
                      bg: "rgba(42,122,96,0.06)",
                      border: "rgba(42,122,96,0.15)",
                      title: "Technical",
                      items: [
                        "IP address",
                        "Device and browser metadata",
                        "Cookie identifiers",
                      ],
                    },
                  ].map(({ Icon, color, bg, border, title, items }) => (
                    <div
                      key={title}
                      className="rounded-xl p-5 border"
                      style={{ background: bg, borderColor: border }}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: color + "22" }}
                        >
                          <Icon
                            className="w-4 h-4"
                            style={{ color }}
                          />
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">
                          {title}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                          >
                            <span
                              className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                              style={{ background: color }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* 3 — Lawful Basis */}
              <SectionCard
                id="lawful-basis"
                number="3"
                title="Lawful Basis for Processing"
              >
                <p className="text-slate-600 text-sm mb-4">
                  Personal data is processed under one or more of the following
                  lawful bases:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Performance of a contract",
                    "Legal obligations",
                    "Legitimate interests",
                    "User consent (where applicable)",
                  ].map((basis) => (
                    <span
                      key={basis}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{
                        background: "rgba(95,59,143,0.06)",
                        borderColor: "rgba(95,59,143,0.2)",
                        color: "#5f3b8f",
                      }}
                    >
                      <HiCheckBadge className="w-3 h-3 flex-shrink-0" />
                      {basis}
                    </span>
                  ))}
                </div>
              </SectionCard>

              {/* 4 — Purpose */}
              <SectionCard id="purpose" number="4" title="Purpose of Processing">
                <p className="text-slate-600 text-sm mb-4">
                  Personal data is used to:
                </p>
                <BulletList
                  items={[
                    "Deliver and maintain the Service",
                    "Generate accessibility assessment reports",
                    "Manage billing and subscriptions",
                    "Monitor platform performance and security",
                    "Provide support and service communications",
                  ]}
                />
              </SectionCard>

              {/* 5 — Third Parties */}
              <SectionCard
                id="third-parties"
                number="5"
                title="Third-Party Processors"
              >
                <p className="text-slate-600 text-sm mb-4">
                  Personal data may be processed by approved third parties.
                  All processors operate under GDPR-compliant data processing
                  agreements.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    {
                      name: "Google Analytics",
                      role: "Usage analytics",
                      color: "#ea4335",
                    },
                    {
                      name: "Firebase",
                      role: "Authentication & infrastructure",
                      color: "#f59e0b",
                    },
                    {
                      name: "Payment Provider",
                      role: "Billing & transactions",
                      color: "#3861ab",
                    },
                  ].map(({ name, role, color }) => (
                    <div
                      key={name}
                      className="rounded-xl p-4 border border-slate-100 bg-slate-50"
                    >
                      <div
                        className="w-2 h-2 rounded-full mb-3"
                        style={{ background: color }}
                      />
                      <p className="font-semibold text-slate-800 text-sm">
                        {name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{role}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* 6 — Retention */}
              <SectionCard id="retention" number="6" title="Data Retention">
                <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                  <p>
                    Data is retained only for as long as necessary to fulfil
                    contractual, operational, and legal obligations.
                  </p>
                  <p>
                    Users may request deletion of personal data at any time,
                    subject to any statutory retention requirements.
                  </p>
                </div>
              </SectionCard>

              {/* 7 — Rights */}
              <SectionCard id="your-rights" number="7" title="Your Data Subject Rights">
                <p className="text-slate-600 text-sm mb-5">
                  Under GDPR, you have the following rights regarding your
                  personal data:
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      Icon: HiEye,
                      title: "Access",
                      desc: "Request a copy of your personal data",
                    },
                    {
                      Icon: HiPencilSquare,
                      title: "Rectification",
                      desc: "Correct inaccurate or incomplete data",
                    },
                    {
                      Icon: HiTrash,
                      title: "Erasure",
                      desc: "Request deletion of your data",
                    },
                    {
                      Icon: HiPause,
                      title: "Restriction",
                      desc: "Limit how we process your data",
                    },
                    {
                      Icon: HiArrowDownTray,
                      title: "Portability",
                      desc: "Receive your data in a portable format",
                    },
                    {
                      Icon: HiArrowUturnLeft,
                      title: "Withdraw Consent",
                      desc: "Withdraw consent at any time",
                    },
                  ].map(({ Icon, title, desc }) => (
                    <div
                      key={title}
                      className="rounded-xl p-4 border border-slate-100 bg-slate-50 hover:border-slate-200 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                        style={{ background: "rgba(95,59,143,0.08)" }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: "#5f3b8f" }}
                        />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm mb-1">
                        {title}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-5">
                  To exercise any of these rights, contact us at{" "}
                  <a
                    href="mailto:support@ablelytics.com"
                    className="font-medium hover:underline"
                    style={{ color: "#5f3b8f" }}
                  >
                    support@ablelytics.com
                  </a>
                  . We will respond within 30 days.
                </p>
              </SectionCard>

              {/* 8 — Security */}
              <SectionCard id="security" number="8" title="Security Measures">
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Appropriate technical and organisational measures are
                  implemented to protect personal data against unauthorised
                  access, loss, or disclosure.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Encryption in transit and at rest",
                    "Access controls and authentication",
                    "Regular security reviews",
                    "Incident response procedures",
                  ].map((measure) => (
                    <span
                      key={measure}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                    >
                      <HiLockClosed className="w-3 h-3 flex-shrink-0" />
                      {measure}
                    </span>
                  ))}
                </div>
              </SectionCard>

              {/* 9 — Contact */}
              <div
                id="contact"
                className="rounded-2xl border p-8 scroll-mt-20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(95,59,143,0.06) 0%, rgba(56,97,171,0.06) 100%)",
                  borderColor: "rgba(95,59,143,0.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #5f3b8f, #3861ab)",
                    }}
                  >
                    9
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Contact</h2>
                </div>

                <p className="text-slate-600 text-sm mb-6">
                  For privacy-related enquiries or to exercise your data
                  subject rights, contact our team directly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="mailto:support@ablelytics.com"
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #5f3b8f, #3861ab)",
                    }}
                  >
                    <HiEnvelope className="w-4 h-4" />
                    support@ablelytics.com
                  </a>
                </div>

                <p className="text-slate-400 text-xs mt-4">
                  Registered address: 
                  Waapis Group s.r.o., Slevarenska 16, 70900, Ostrava, Czech Republic
                </p>
              </div>

              {/* Related links */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {[
                  { href: "/terms/", label: "Terms & Conditions" },
                  { href: "/cookies/", label: "Cookie Policy" },
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
