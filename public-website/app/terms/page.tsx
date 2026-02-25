import { LoggedOutHeader } from "../components/organism/logged-out-header";
import { LoggedOutFooter } from "../components/organism/logged-out-footer";
import { LoggedOutLayout } from "../components/organism/logged-out-layout";
import { buildPageMetadata } from "../libs/metadata";
import Link from "next/link";
import {
  HiDocumentText,
  HiShieldCheck,
  HiExclamationTriangle,
  HiArrowRight,
  HiEnvelope,
  HiCheckCircle,
  HiXCircle,
  HiInformationCircle,
  HiScale,
  HiUserGroup,
  HiLockClosed,
  HiCreditCard,
  HiPuzzlePiece,
  HiWrenchScrewdriver,
  HiNoSymbol,
  HiArrowTopRightOnSquare,
} from "react-icons/hi2";

export const metadata = buildPageMetadata({
  title: "Terms and Conditions",
  description:
    "Terms governing access to and use of the Ablelytics accessibility platform.",
  path: "/terms",
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
          style={{ background: "linear-gradient(135deg, #3861ab, #5f3b8f)" }}
        >
          {number}
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** Amber-tinted card used for legally critical sections (disclaimers, liability). */
function CriticalCard({
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
      className="rounded-2xl border p-8 scroll-mt-20"
      style={{
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(234,88,12,0.04) 100%)",
        borderColor: "rgba(245,158,11,0.3)",
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #d97706, #ea580c)" }}
        >
          {number}
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ml-auto"
          style={{
            background: "rgba(245,158,11,0.12)",
            color: "#b45309",
          }}
        >
          <HiExclamationTriangle className="w-3 h-3" />
          Important
        </span>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed"
        >
          <span
            className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
            style={{ background: "#3861ab" }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ProhibitedList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed"
        >
          <HiXCircle
            className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TermsPage() {
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
                "linear-gradient(135deg, #eff4ff 0%, #f5f3ff 50%, #faf5ff 100%)",
            }}
          />
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #3861ab 0%, transparent 70%)",
            }}
          />

          <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 border"
                style={{
                  background: "rgba(56,97,171,0.07)",
                  borderColor: "rgba(56,97,171,0.2)",
                  color: "#3861ab",
                }}
              >
                <HiDocumentText className="w-3.5 h-3.5" />
                Legal Agreement
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                Terms &amp; Conditions
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
                By accessing or using the Ablelytics platform you agree to
                these Terms in full. Please read them carefully, in particular
                the disclaimer, no-warranty, and liability sections.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { Icon: HiShieldCheck, label: "GDPR Compliant" },
                  { Icon: HiScale, label: "EU Law Governed" },
                  { Icon: HiDocumentText, label: "Last updated 13 Jan 2026" },
                ].map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-sm text-slate-700 shadow-sm font-medium"
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: "#3861ab" }}
                    />
                    {label}
                  </div>
                ))}
              </div>

              {/* Key-clause signpost */}
              <div
                className="inline-flex items-start gap-3 px-4 py-3 rounded-xl border text-sm"
                style={{
                  background: "rgba(245,158,11,0.07)",
                  borderColor: "rgba(245,158,11,0.25)",
                }}
              >
                <HiExclamationTriangle
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#b45309" }}
                />
                <span className="text-slate-700">
                  Sections marked{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "#b45309" }}
                  >
                    Important
                  </span>{" "}
                  contain critical disclaimers and liability limitations. Read
                  them before using the Service.
                </span>
              </div>
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
                  ["#scope", "Scope"],
                  ["#definitions", "Definitions"],
                  ["#account", "Account"],
                  ["#permitted-use", "Permitted Use"],
                  ["#disclaimer", "Disclaimer"],
                  ["#no-warranty", "No Warranty"],
                  ["#fees", "Fees"],
                  ["#ip", "IP"],
                  ["#liability", "Liability"],
                  ["#indemnification", "Indemnification"],
                  ["#availability", "Availability"],
                  ["#termination", "Termination"],
                  ["#governing-law", "Governing Law"],
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

              {/* 1 — Purpose and Scope */}
              <SectionCard id="scope" number="1" title="Purpose and Scope">
                <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                  <p>
                    These Terms and Conditions ("Terms") govern access to and
                    use of the Ablelytics platform ("Service"), operated by
                    Waapis Group s.r.o. ("the Provider", "we", "us").
                  </p>
                  <p>
                    The Service enables registered users to run automated
                    accessibility scans on websites and generate indicative
                    reports. It does not provide legal advice, auditing services,
                    or any guarantee of compliance with any law or standard.
                  </p>
                  <p>
                    By accessing or using the Service in any way, you confirm
                    that you have read, understood, and irrevocably agree to be
                    bound by these Terms and our{" "}
                    <Link
                      href="/privacy/"
                      className="font-medium underline underline-offset-2"
                      style={{ color: "#3861ab" }}
                    >
                      Privacy Policy
                    </Link>
                    . If you do not agree, you must stop using the Service
                    immediately.
                  </p>
                </div>
              </SectionCard>

              {/* 2 — Definitions */}
              <SectionCard id="definitions" number="2" title="Definitions">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      term: "User",
                      def: "Any individual or organisation that accesses or uses the Service, whether or not registered.",
                    },
                    {
                      term: "Account",
                      def: "A registered user profile created to access the full features of the Service.",
                    },
                    {
                      term: "Report",
                      def: "The automated output generated by the Service identifying potential, indicative accessibility issues.",
                    },
                    {
                      term: "Website Under Test",
                      def: "Any website submitted by the User to be scanned by the Service.",
                    },
                    {
                      term: "Service",
                      def: "The Ablelytics web application, APIs, reports, tooling, and all associated features.",
                    },
                    {
                      term: "Provider",
                      def: "Waapis Group s.r.o., the entity operating and maintaining the Service.",
                    },
                  ].map(({ term, def }) => (
                    <div
                      key={term}
                      className="rounded-xl p-4 border border-slate-100 bg-slate-50"
                    >
                      <p
                        className="font-semibold text-sm mb-1"
                        style={{ color: "#3861ab" }}
                      >
                        {term}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {def}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* 3 — Account */}
              <SectionCard
                id="account"
                number="3"
                title="Account Registration and Responsibilities"
              >
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Access to most features of the Service requires account
                  registration. By registering, you accept sole responsibility
                  for:
                </p>
                <BulletList
                  items={[
                    "Maintaining the confidentiality of your login credentials",
                    "Ensuring all information provided during registration is accurate, current, and complete",
                    "All activity conducted under your Account, whether authorised by you or not",
                    "Notifying us immediately at support@ablelytics.com if you suspect any unauthorised use",
                  ]}
                />
                <div
                  className="flex items-start gap-3 mt-5 px-4 py-3 rounded-xl border"
                  style={{
                    background: "rgba(56,97,171,0.04)",
                    borderColor: "rgba(56,97,171,0.15)",
                  }}
                >
                  <HiInformationCircle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: "#3861ab" }}
                  />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The Provider reserves the right to suspend or permanently
                    terminate any Account that breaches these Terms, without
                    prior notice and without liability.
                  </p>
                </div>
              </SectionCard>

              {/* 4 — Permitted Use */}
              <SectionCard
                id="permitted-use"
                number="4"
                title="Permitted Use and Prohibited Conduct"
              >
                <p className="text-slate-600 text-sm mb-4 font-medium">
                  Permitted use
                </p>
                <BulletList
                  items={[
                    "Scanning only websites you own or have been explicitly authorised in writing to test",
                    "Using the Service in compliance with all applicable laws and regulations",
                    "Using Reports for your own internal accessibility improvement purposes only",
                  ]}
                />

                <p className="text-slate-600 text-sm mt-6 mb-4 font-medium">
                  Prohibited conduct — you must not:
                </p>
                <ProhibitedList
                  items={[
                    "Scan websites you do not own or lack explicit written authorisation to test",
                    "Use the Service to perform or facilitate any form of denial-of-service, web scraping, or load testing",
                    "Reverse engineer, decompile, or attempt to extract the source code or underlying algorithms of the Service",
                    "Resell, sublicense, or commercially redistribute the Service or its output without prior written consent",
                    "Circumvent, disable, or otherwise interfere with access controls or security features",
                    "Upload or transmit malware, harmful code, or content that violates any applicable law",
                    "Attempt to gain unauthorised access to any other user's Account or data",
                    "Use the Service in any way that could damage the reputation, systems, or interests of the Provider",
                  ]}
                />
                <p className="text-slate-500 text-xs mt-4">
                  Prohibited use may result in immediate suspension, permanent
                  termination, and legal action.
                </p>
              </SectionCard>

              {/* 5 — Disclaimer ⚠️ */}
              <CriticalCard
                id="disclaimer"
                number="5"
                title="Accessibility Assessment Disclaimer"
              >
                <div className="text-slate-700 text-sm leading-relaxed space-y-4">
                  <p className="font-semibold text-slate-900">
                    The Service is an automated scanning tool only. It is not a
                    legal compliance service, an accessibility audit, or a
                    substitute for professional advice.
                  </p>

                  <p>
                    All Reports generated by the Service are{" "}
                    <strong>indicative and non-exhaustive</strong>. They
                    represent the output of automated algorithms applied at a
                    single point in time and are subject to change without
                    notice.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 my-4">
                    {[
                      "Reports do NOT constitute legal advice",
                      "Reports do NOT represent a professional accessibility audit",
                      "Reports do NOT certify compliance with any standard",
                      "Reports do NOT guarantee a website is usable by disabled users",
                      "Automated tools detect only a subset of accessibility issues",
                      "False positives and false negatives may occur",
                      "Results may vary between scans due to dynamic page content",
                      "Manual testing is always required for comprehensive assessment",
                    ].map((point) => (
                      <div
                        key={point}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg border text-xs text-slate-700"
                        style={{
                          background: "rgba(245,158,11,0.05)",
                          borderColor: "rgba(245,158,11,0.2)",
                        }}
                      >
                        <HiXCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                        {point}
                      </div>
                    ))}
                  </div>

                  <p>
                    The Provider makes{" "}
                    <strong>
                      no representation, warranty, or guarantee
                    </strong>{" "}
                    — express or implied — that use of the Service will result
                    in legal or regulatory compliance with any accessibility
                    legislation, standard, or framework, including but not
                    limited to WCAG 2.0, WCAG 2.1, WCAG 2.2, EN 301 549, the
                    European Accessibility Act, the Americans with Disabilities
                    Act (ADA), or any equivalent national legislation.
                  </p>

                  <div
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                    style={{
                      background: "rgba(234,88,12,0.06)",
                      borderColor: "rgba(234,88,12,0.2)",
                    }}
                  >
                    <HiExclamationTriangle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: "#ea580c" }}
                    />
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong>
                        Responsibility for accessibility compliance remains
                        entirely with the User.
                      </strong>{" "}
                      Any compliance decisions made on the basis of Reports are
                      made at the User's sole risk. The Provider accepts no
                      liability whatsoever for compliance failures, regulatory
                      penalties, litigation, or any loss arising from the use
                      of or reliance on the Service or its output.
                    </p>
                  </div>
                </div>
              </CriticalCard>

              {/* 6 — No Warranty ⚠️ */}
              <CriticalCard id="no-warranty" number="6" title="No Warranty">
                <div className="text-slate-700 text-sm leading-relaxed space-y-4">
                  <p>
                    <strong>
                      The Service is provided strictly "as is" and "as
                      available", without warranty of any kind.
                    </strong>
                  </p>
                  <p>
                    To the fullest extent permitted by applicable law, the
                    Provider expressly disclaims all warranties, whether
                    express, implied, statutory, or otherwise, including but
                    not limited to:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        title: "Merchantability",
                        desc: "No warranty that the Service is fit for general commercial use.",
                      },
                      {
                        title: "Fitness for purpose",
                        desc: "No warranty that the Service meets any particular need or purpose.",
                      },
                      {
                        title: "Accuracy",
                        desc: "No warranty that scan results are accurate, complete, or free from error.",
                      },
                      {
                        title: "Non-infringement",
                        desc: "No warranty that the Service does not infringe any third-party rights.",
                      },
                      {
                        title: "Uninterrupted availability",
                        desc: "No warranty that the Service will be available at any time or without interruption.",
                      },
                      {
                        title: "Security",
                        desc: "No warranty that the Service is free from vulnerabilities or that data will never be compromised.",
                      },
                    ].map(({ title, desc }) => (
                      <div
                        key={title}
                        className="rounded-xl p-4 border"
                        style={{
                          background: "rgba(245,158,11,0.04)",
                          borderColor: "rgba(245,158,11,0.18)",
                        }}
                      >
                        <p className="font-semibold text-slate-800 text-xs mb-1">
                          {title}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Some jurisdictions do not permit certain warranty
                    exclusions. Where mandatory consumer protection law applies,
                    these exclusions apply only to the maximum extent permitted.
                  </p>
                </div>
              </CriticalCard>

              {/* 7 — Fees */}
              <SectionCard id="fees" number="7" title="Fees and Payments">
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  Access to certain features of the Service requires a paid
                  subscription.
                </p>
                <BulletList
                  items={[
                    "All pricing is displayed clearly before purchase",
                    "Payments are processed by a third-party payment provider; the Provider does not store card details",
                    "Subscriptions renew automatically at the end of each billing period unless cancelled before the renewal date",
                    "You are responsible for cancelling your subscription before renewal if you do not wish to continue",
                    "Refunds are not provided except where required by applicable law",
                    "The Provider reserves the right to change pricing at any time with reasonable notice",
                  ]}
                />
              </SectionCard>

              {/* 8 — IP */}
              <SectionCard id="ip" number="8" title="Intellectual Property">
                <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                  <p>
                    All intellectual property rights in the Service — including
                    but not limited to software, algorithms, databases, user
                    interface, documentation, and branding — are and remain the
                    exclusive property of the Provider or its licensors.
                  </p>
                  <p>
                    Subject to these Terms, you are granted a limited,
                    non-exclusive, non-transferable, non-sublicensable,
                    revocable licence to access and use the Service and to use
                    Reports solely for your own internal accessibility
                    improvement purposes.
                  </p>
                  <p>
                    This licence does not permit you to copy, modify, create
                    derivative works from, publicly display, sell, or
                    redistribute the Service or any Reports for commercial
                    purposes without the prior written consent of the Provider.
                  </p>
                </div>
              </SectionCard>

              {/* 9 — Limitation of Liability ⚠️ */}
              <CriticalCard
                id="liability"
                number="9"
                title="Limitation of Liability"
              >
                <div className="text-slate-700 text-sm leading-relaxed space-y-4">
                  <p>
                    <strong>
                      To the maximum extent permitted by applicable law, the
                      Provider, its directors, employees, agents, licensors,
                      and service providers shall not be liable for any:
                    </strong>
                  </p>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {[
                      "Indirect, incidental, special, or punitive damages",
                      "Consequential or exemplary damages of any kind",
                      "Loss of business, contracts, or commercial opportunity",
                      "Loss of revenue, profit, or anticipated savings",
                      "Loss of data or corruption of data",
                      "Loss of goodwill or reputation",
                      "Accessibility compliance failures or regulatory penalties",
                      "Third-party claims arising from the User's use of Reports",
                      "Costs of procurement of substitute goods or services",
                      "Damages resulting from reliance on the accuracy of Reports",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg border text-xs text-slate-700"
                        style={{
                          background: "rgba(245,158,11,0.04)",
                          borderColor: "rgba(245,158,11,0.18)",
                        }}
                      >
                        <HiNoSymbol className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                    style={{
                      background: "rgba(234,88,12,0.06)",
                      borderColor: "rgba(234,88,12,0.2)",
                    }}
                  >
                    <HiExclamationTriangle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: "#ea580c" }}
                    />
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong>Aggregate liability cap.</strong> In any event,
                      the Provider's total aggregate liability to you for all
                      claims arising under or in connection with these Terms
                      shall not exceed the greater of: (a) the total fees paid
                      by you to the Provider in the twelve (12) months
                      immediately preceding the event giving rise to the claim,
                      or (b) €100.
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    Nothing in these Terms limits liability for fraud,
                    fraudulent misrepresentation, death or personal injury
                    caused by negligence, or any other liability that cannot be
                    excluded by law.
                  </p>
                </div>
              </CriticalCard>

              {/* 10 — Indemnification */}
              <SectionCard
                id="indemnification"
                number="10"
                title="Indemnification"
              >
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                  You agree to indemnify, defend, and hold harmless the
                  Provider and its directors, officers, employees, agents, and
                  licensors from and against any and all claims, liabilities,
                  damages, losses, costs, and expenses (including reasonable
                  legal fees) arising out of or in connection with:
                </p>
                <BulletList
                  items={[
                    "Your use of or access to the Service",
                    "Your breach of any provision of these Terms",
                    "Your violation of any applicable law or regulation",
                    "Any compliance decisions you make based on Reports generated by the Service",
                    "Any claim by a third party that your use of the Service infringes their rights",
                    "Any content you submit to or through the Service",
                  ]}
                />
              </SectionCard>

              {/* 11 — Availability */}
              <SectionCard
                id="availability"
                number="11"
                title="Service Availability and Modifications"
              >
                <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                  <p>
                    The Provider does not guarantee that the Service will be
                    available at any particular time, continuously, or without
                    interruption, delay, or error. The Service is provided on
                    a best-efforts basis only.
                  </p>
                  <p>
                    The Provider reserves the right, at any time and without
                    notice or liability, to:
                  </p>
                  <BulletList
                    items={[
                      "Modify, suspend, or discontinue the Service or any part thereof",
                      "Change pricing, features, or functionality",
                      "Perform scheduled or unscheduled maintenance",
                      "Impose usage limits or restrictions on any Account",
                    ]}
                  />
                </div>
              </SectionCard>

              {/* 12 — Termination */}
              <SectionCard id="termination" number="12" title="Termination">
                <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                  <p>
                    <strong className="text-slate-800">
                      Termination by the Provider:
                    </strong>{" "}
                    The Provider may suspend or terminate your access to the
                    Service at any time, with or without cause, and with or
                    without notice. Grounds include but are not limited to:
                    breach of these Terms, non-payment, fraudulent activity, or
                    abuse of the Service.
                  </p>
                  <p>
                    <strong className="text-slate-800">
                      Termination by you:
                    </strong>{" "}
                    You may terminate your Account at any time by cancelling
                    your subscription and ceasing use of the Service. Fees
                    already paid are non-refundable.
                  </p>
                  <p>
                    <strong className="text-slate-800">
                      Effect of termination:
                    </strong>{" "}
                    Upon termination for any reason: your access to the Service
                    ceases immediately; the Provider may delete your Account and
                    associated data; the Provider has no obligation to retain or
                    forward any data or Reports. The Provider accepts no
                    liability for any loss resulting from termination.
                  </p>
                  <p>
                    Provisions of these Terms that by their nature should
                    survive termination — including Sections 5, 6, 8, 9, and 10
                    — shall survive.
                  </p>
                </div>
              </SectionCard>

              {/* 13 — Governing Law */}
              <SectionCard
                id="governing-law"
                number="13"
                title="Governing Law and Disputes"
              >
                <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                  <p>
                    These Terms are governed by and construed in accordance with
                    the laws of the Czech Republic and, where applicable,
                    European Union law, without regard to conflict-of-law
                    principles.
                  </p>
                  <p>
                    Any dispute arising out of or in connection with these Terms
                    that cannot be resolved through good-faith negotiation shall
                    be subject to the exclusive jurisdiction of the courts of
                    the Czech Republic, unless mandatory consumer protection law
                    in your jurisdiction requires otherwise.
                  </p>
                  <p>
                    These Terms constitute the entire agreement between you and
                    the Provider regarding the Service and supersede all prior
                    agreements or understandings. If any provision is found
                    unenforceable, the remaining provisions continue in full
                    force and effect.
                  </p>
                </div>
              </SectionCard>

              {/* 14 — Contact */}
              <div
                id="contact"
                className="rounded-2xl border p-8 scroll-mt-20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56,97,171,0.07) 0%, rgba(95,59,143,0.07) 100%)",
                  borderColor: "rgba(56,97,171,0.2)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #3861ab, #5f3b8f)",
                    }}
                  >
                    14
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Contact</h2>
                </div>

                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  If you have questions about these Terms or wish to contact us
                  regarding your Account, reach out to our support team.
                </p>

                <a
                  href="mailto:support@ablelytics.com"
                  className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #3861ab, #5f3b8f)",
                  }}
                >
                  <HiEnvelope className="w-4 h-4" />
                  support@ablelytics.com
                </a>

                <p className="text-slate-400 text-xs mt-4">
                  Waapis Group s.r.o., Slevarenska 16, 70900 Ostrava, Czech Republic
                </p>
              </div>

              {/* Related links */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {[
                  { href: "/privacy/", label: "Privacy Policy" },
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
