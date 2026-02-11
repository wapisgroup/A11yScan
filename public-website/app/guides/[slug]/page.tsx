import Link from "next/link";
import { notFound } from "next/navigation";
import { LoggedOutLayout } from "../../components/organism/logged-out-layout";
import { LoggedOutHeader } from "../../components/organism/logged-out-header";
import { LoggedOutFooter } from "../../components/organism/logged-out-footer";
import { buildPageMetadata } from "../../libs/metadata";
import { URL_FRONTEND_GUIDES } from "../../services/urlServices";

type GuideSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

type GuideEntry = {
  title: string;
  summary: string;
  sections: GuideSection[];
};

const guides: Record<string, GuideEntry> = {
  "getting-started": {
    title: "Getting Started with Ablelytics",
    summary: "Set up a project, run your first scan, and establish a baseline report for accessibility compliance.",
    sections: [
      {
        heading: "1. Create a project",
        body: "Start by adding the primary domain you want to monitor. This becomes the source of truth for crawl scope and reporting.",
        bullets: [
          "Choose a clear project name for stakeholders",
          "Add the canonical domain (including https)",
          "Define the initial crawl depth and page cap"
        ]
      },
      {
        heading: "2. Run a baseline scan",
        body: "Run a one-time scan to establish your current issue count and severity mix. Use this as your baseline for future reporting.",
        bullets: [
          "Start with a full crawl to identify coverage gaps",
          "Export a PDF report for stakeholder alignment",
          "Tag the scan as your baseline for future comparisons"
        ]
      },
      {
        heading: "3. Prioritize remediation",
        body: "Focus on Critical and Serious issues first, then address systemic Moderate issues that appear across multiple pages.",
        bullets: [
          "Sort by severity and frequency",
          "Group fixes by component or template",
          "Track progress with recurring scans"
        ]
      }
    ]
  },
  "scan-configuration": {
    title: "Scan Configuration Playbook",
    summary: "Tune crawl settings, handle staging environments, and avoid noisy results from third-party widgets.",
    sections: [
      {
        heading: "Scope and crawl depth",
        body: "Define the maximum crawl depth and page cap to keep scans predictable while ensuring coverage.",
        bullets: [
          "Use include rules for key sections (e.g., /docs, /pricing)",
          "Exclude known non-product pages (e.g., /careers)",
          "Set page caps for very large sites"
        ]
      },
      {
        heading: "Authentication and staging",
        body: "For private sites, use a staging URL or secure tunnel. Keep environments stable to avoid flaky results.",
        bullets: [
          "Prefer staging mirrors of production content",
          "Ensure authentication banners do not block rendering",
          "Schedule scans during low-traffic periods"
        ]
      },
      {
        heading: "Cookie banners and overlays",
        body: "Remove overlays before scanning to avoid false positives and blocked content.",
        bullets: [
          "Enable cookie banner removal",
          "Validate DOM after banner removal",
          "Re-scan if overlays block navigation"
        ]
      }
    ]
  },
  "interpreting-results": {
    title: "How to Interpret Accessibility Results",
    summary: "Use severity, frequency, and WCAG mappings to triage the most impactful fixes.",
    sections: [
      {
        heading: "Severity and impact",
        body: "Critical and Serious issues typically block access or legal compliance and should be handled first.",
        bullets: [
          "Start with issues that block keyboard or screen reader use",
          "Resolve color contrast failures in high-traffic templates",
          "Use evidence and selectors to confirm fixes"
        ]
      },
      {
        heading: "Frequency over quantity",
        body: "A single rule failing on hundreds of pages often indicates a shared component or template.",
        bullets: [
          "Prioritize fixes with the widest page coverage",
          "Group by component or pattern",
          "Retest after each deployment"
        ]
      }
    ]
  },
  "reporting-and-evidence": {
    title: "Reporting and Evidence Workflow",
    summary: "Generate audit-ready PDFs and retain evidence for compliance reporting.",
    sections: [
      {
        heading: "Build defensible reports",
        body: "Use PDF exports to share an executive overview while keeping technical evidence attached to issues.",
        bullets: [
          "Include engine attribution and confidence scores",
          "Attach screenshots and HTML snippets",
          "Document manual checks separately"
        ]
      },
      {
        heading: "Align to standards",
        body: "Map issues to WCAG criteria and label manual checks for items that require human validation.",
        bullets: [
          "Use WCAG 2.1/2.2 references in reports",
          "Mark manual-only criteria clearly",
          "Maintain an audit trail for compliance audits"
        ]
      }
    ]
  },
  "ai-fix-suggestions": {
    title: "Using AI Fix Suggestions",
    summary: "Accelerate remediation while keeping human review in the loop for risk-sensitive changes.",
    sections: [
      {
        heading: "When to use AI fixes",
        body: "AI suggestions work best for repeatable HTML/CSS changes and ARIA pattern fixes.",
        bullets: [
          "Use for templated components",
          "Validate with visual QA and screen reader checks",
          "Avoid autopublishing large refactors"
        ]
      },
      {
        heading: "Human review workflow",
        body: "Require a developer or accessibility lead to approve AI changes before release.",
        bullets: [
          "Add AI suggestions to tickets",
          "Verify expected outcomes in staging",
          "Keep a changelog for compliance audits"
        ]
      }
    ]
  },
  "manual-review-checklist": {
    title: "Manual Review Checklist",
    summary: "Cover the manual-only checks that automated testing cannot fully validate.",
    sections: [
      {
        heading: "Keyboard navigation",
        body: "Ensure all interactive elements are reachable and usable with the keyboard.",
        bullets: [
          "Tab order follows visual flow",
          "Visible focus indicators",
          "No keyboard traps"
        ]
      },
      {
        heading: "Screen reader UX",
        body: "Validate with VoiceOver or NVDA and check meaningful labels and announcements.",
        bullets: [
          "Headings describe structure",
          "Labels are descriptive",
          "Status messages are announced"
        ]
      },
      {
        heading: "Content quality",
        body: "Verify that alt text, captions, and error messages are meaningful and helpful.",
        bullets: [
          "Alt text adds context",
          "Captions cover key audio",
          "Errors provide next steps"
        ]
      }
    ]
  },
  "scheduling-and-monitoring": {
    title: "Scheduling and Monitoring",
    summary: "Automate scans, catch regressions early, and share weekly progress updates.",
    sections: [
      {
        heading: "Set scan cadence",
        body: "Daily scans catch regressions, while weekly scans are enough for most marketing sites.",
        bullets: [
          "Use daily scans for product apps",
          "Run weekly scans for content sites",
          "Schedule off-peak for large crawls"
        ]
      },
      {
        heading: "Notifications and alerting",
        body: "Send notifications to Slack or email when new Critical issues appear.",
        bullets: [
          "Enable issue threshold alerts",
          "Track trends by severity",
          "Share summary reports monthly"
        ]
      }
    ]
  },
  "ci-cd-integration": {
    title: "CI/CD Integration",
    summary: "Enforce accessibility gates in your deployment pipeline.",
    sections: [
      {
        heading: "Pipeline gates",
        body: "Fail builds when new Critical or Serious issues are introduced.",
        bullets: [
          "Run scans on preview deployments",
          "Compare against baseline scan",
          "Block release on regressions"
        ]
      },
      {
        heading: "API-first workflows",
        body: "Use the API to trigger scans and fetch results as part of release automation.",
        bullets: [
          "Trigger scans from CI jobs",
          "Parse JSON results for policy checks",
          "Attach reports to release notes"
        ]
      }
    ]
  },
  "cookie-banner-handling": {
    title: "Cookie Banner Handling",
    summary: "Prevent overlays from blocking DOM analysis and avoid false positives.",
    sections: [
      {
        heading: "Why overlays matter",
        body: "Cookie banners and modals can hide content and break keyboard focus during scans.",
        bullets: [
          "Remove overlays before scanning",
          "Re-run scans when banners change",
          "Keep a record of banner vendors"
        ]
      },
      {
        heading: "Validation",
        body: "Confirm the DOM is fully visible and interactive after banner removal.",
        bullets: [
          "Check that navigation is accessible",
          "Verify focus order",
          "Validate primary CTAs are visible"
        ]
      }
    ]
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides[slug];

  if (!guide) {
    return buildPageMetadata({
      title: "Guide Not Found",
      description: "The requested guide could not be found.",
      path: `/guides/${slug}`
    });
  }

  return buildPageMetadata({
    title: guide.title,
    description: guide.summary,
    path: `/guides/${slug}`,
    type: "article"
  });
}

export default async function GuidePlaceholderPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const guide = guides[resolvedParams.slug];
  if (!guide) {
    notFound();
  }

  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 text-sm font-semibold mb-6">
                GUIDE
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                {guide.title}
              </h1>
              <p className="text-lg text-slate-600 mb-10">
                {guide.summary}
              </p>

              <div className="space-y-10">
                {guide.sections.map((section) => (
                  <div key={section.heading} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">{section.heading}</h2>
                    <p className="text-slate-700 mb-4">{section.body}</p>
                    {section.bullets ? (
                      <ul className="list-disc list-inside text-slate-700 space-y-2">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between">
                <Link href={URL_FRONTEND_GUIDES} className="text-indigo-600 font-semibold hover:text-indigo-700">
                  Back to guides
                </Link>
                <Link href="/contact" className="text-slate-700 font-semibold hover:text-slate-900">
                  Need help? Talk to us →
                </Link>
              </div>
          </div>
        </div>
      </section>
      <LoggedOutFooter />
    </LoggedOutLayout>
  );
}
