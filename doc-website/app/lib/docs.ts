export type DocSection = {
  id: string;
  title: string;
  body?: string[];
  bullets?: string[];
  steps?: string[];
  callout?: {
    tone: "info" | "warn";
    title: string;
    body: string;
  };
};

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  category: string;
  path?: string;
  sections: DocSection[];
};

export const docPages: DocPage[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Create your first project, discover pages, and run a scan in minutes.",
    category: "Getting Started",
    sections: [
      {
        id: "overview",
        title: "Overview",
        body: [
          "Ablelytics helps you audit accessibility across entire websites and track improvements over time.",
          "A typical workflow is: create a project, collect pages, run scans, and generate reports."
        ],
      },
      {
        id: "first-project",
        title: "Create Your First Project",
        steps: [
          "Sign in and open the Workspace.",
          "Click New Project and enter a name and primary domain.",
          "Confirm the project to create a workspace container."
        ],
      },
      {
        id: "discover-pages",
        title: "Discover Pages",
        body: [
          "You can populate pages in two ways: crawl the site or upload a sitemap.",
          "Once pages are discovered, they appear in the Pages tab and can be scanned individually or in bulk."
        ],
        bullets: [
          "Crawl: Automatically finds internal pages from your domain.",
          "Sitemap Upload: Import a known list of URLs quickly."
        ],
      },
      {
        id: "first-scan",
        title: "Run Your First Scan",
        steps: [
          "Open the Runs tab and choose Full Scan or select specific pages.",
          "Wait for the run to move from queued to running.",
          "Open results to view issues, severity, and WCAG references."
        ],
      },
      {
        id: "next-steps",
        title: "Recommended Next Steps",
        bullets: [
          "Create page sets for critical flows (checkout, signup, pricing).",
          "Generate a PDF report for stakeholders.",
          "Schedule periodic scans to track progress."
        ],
      },
    ],
  },
  {
    slug: "onboarding",
    title: "Onboarding & Workspace",
    description: "Set up your account, roles, and organization context.",
    category: "Getting Started",
    sections: [
      {
        id: "account-setup",
        title: "Account Setup",
        body: [
          "After registration, your profile is created automatically and linked to your organization.",
          "You can update your personal details in the account settings section."
        ],
      },
      {
        id: "organization",
        title: "Organization Context",
        body: [
          "Projects live inside your organization and are scoped to your subscription limits.",
          "The workspace overview shows active runs, recent pages, and quick actions."
        ],
      },
      {
        id: "security",
        title: "Security Best Practices",
        bullets: [
          "Invite only trusted team members.",
          "Use strong passwords or single sign-on where available.",
          "Remove access for inactive users."
        ],
      },
    ],
  },
  {
    slug: "projects-and-domains",
    title: "Projects & Domains",
    description: "How projects are structured and how domains are used during scanning.",
    category: "Core Concepts",
    sections: [
      {
        id: "project-model",
        title: "Project Model",
        body: [
          "A project represents a website or product area you want to audit.",
          "Each project contains pages, runs, scans, and reports."
        ],
      },
      {
        id: "domains",
        title: "Domain Rules",
        bullets: [
          "Crawling is scoped to the primary domain you set on the project.",
          "If you need to scan multiple domains, create separate projects.",
          "Use page sets to focus on critical paths within a domain."
        ],
      },
      {
        id: "page-sets",
        title: "Page Sets",
        body: [
          "Page sets are filtered collections of pages based on URL patterns or manual selection.",
          "They allow focused scans and smaller reports for specific flows."
        ],
      },
    ],
  },
  {
    slug: "page-collection",
    title: "Page Collection (Crawling)",
    description: "Use the crawler to discover pages and build your coverage map.",
    category: "Scanning & Crawling",
    sections: [
      {
        id: "crawler-overview",
        title: "What the Crawler Does",
        body: [
          "The crawler navigates your site and discovers internal links to build a page inventory.",
          "Discovered pages are stored under your project and can be scanned immediately."
        ],
      },
      {
        id: "start-crawl",
        title: "Start a Crawl",
        steps: [
          "Go to your project and open the Runs tab.",
          "Select Page Collection and start the run.",
          "Monitor progress as pages are discovered."
        ],
      },
      {
        id: "crawl-output",
        title: "What You Get",
        bullets: [
          "A list of URLs with titles and status metadata.",
          "A run entry with status, timing, and totals.",
          "Optional sitemap files for navigation review."
        ],
      },
      {
        id: "callout",
        title: "Important",
        callout: {
          tone: "warn",
          title: "Dynamic or gated pages",
          body: "Pages behind auth or blocked by robots may not be discoverable in a crawl. Add those pages manually or via sitemap upload."
        }
      }
    ],
  },
  {
    slug: "scans-and-runs",
    title: "Scans & Runs",
    description: "Understand runs, statuses, and how scans are processed.",
    category: "Scanning & Crawling",
    sections: [
      {
        id: "runs-overview",
        title: "Runs Overview",
        body: [
          "A run is a single job that scans pages and aggregates results.",
          "Runs are queued and processed in the background by the worker."
        ],
      },
      {
        id: "run-types",
        title: "Run Types",
        bullets: [
          "Full Scan: scans every page in the project.",
          "Selected Pages: scans a chosen subset.",
          "Page Collection and Sitemap runs update your page inventory."
        ],
      },
      {
        id: "statuses",
        title: "Run Statuses",
        bullets: [
          "Queued: waiting for a worker slot.",
          "Running: pages are actively being scanned.",
          "Done: results are ready and reportable.",
          "Failed: the run stopped due to an error."
        ],
      },
      {
        id: "progress",
        title: "Progress Tracking",
        body: [
          "Runs update progress during scanning so you can see live completion percentage.",
          "Large sites may take longer depending on page count and complexity."
        ],
      },
    ],
  },
  {
    slug: "interpreting-results",
    title: "Interpreting Results",
    description: "How to read issues, severity, and WCAG references.",
    category: "Scanning & Crawling",
    sections: [
      {
        id: "issue-data",
        title: "Issue Details",
        body: [
          "Each issue includes severity, WCAG references, selectors, and context to help teams fix problems quickly.",
          "Use the issue detail view to see affected elements and guidance."
        ],
      },
      {
        id: "severity",
        title: "Severity Levels",
        bullets: [
          "Critical: high legal or functional risk.",
          "Serious: major impact for assistive tech users.",
          "Moderate: important but less blocking.",
          "Minor: usability or best-practice improvement."
        ],
      },
      {
        id: "wcag",
        title: "WCAG Mapping",
        body: [
          "Issues map to WCAG criteria so you can align fixes with compliance requirements.",
          "Use these references to prioritize remediation efforts and document progress."
        ],
      },
    ],
  },
  {
    slug: "reports",
    title: "Reports",
    description: "Generate professional PDF reports for stakeholders and audits.",
    category: "Reporting",
    sections: [
      {
        id: "report-types",
        title: "Report Types",
        bullets: [
          "Full reports across an entire project.",
          "Focused reports for page sets or selected pages."
        ],
      },
      {
        id: "create-report",
        title: "Create a Report",
        steps: [
          "Open a project and go to the Reports tab.",
          "Choose pages or a page set.",
          "Submit the request and wait for generation to finish."
        ],
      },
      {
        id: "report-content",
        title: "What’s Included",
        bullets: [
          "Executive summary and aggregate issue counts.",
          "Per-page breakdown with severity details.",
          "WCAG references and remediation guidance."
        ],
      },
      {
        id: "callout",
        title: "Tip",
        callout: {
          tone: "info",
          title: "Shareable outputs",
          body: "Reports are stored in secure cloud storage and can be downloaded or shared with stakeholders." 
        }
      }
    ],
  },
  {
    slug: "billing-and-usage",
    title: "Billing & Usage",
    description: "Manage plans, trials, and usage limits.",
    category: "Administration",
    sections: [
      {
        id: "plans",
        title: "Plans and Trials",
        body: [
          "New accounts can start on a trial plan and upgrade when ready.",
          "Billing is managed from the Workspace Billing page."
        ],
      },
      {
        id: "usage",
        title: "Usage Limits",
        bullets: [
          "Active projects per organization.",
          "Scans per month and report generation limits.",
          "Limits are shown in your billing dashboard."
        ],
      },
      {
        id: "changes",
        title: "Plan Changes",
        bullets: [
          "Upgrades take effect immediately with prorated charges.",
          "Downgrades are scheduled for the next billing period.",
          "You can cancel at period end from the Billing page."
        ],
      },
    ],
  },
  {
    slug: "api-and-integrations",
    title: "Integrations & API",
    description: "Connect Ablelytics to your workflows and tooling.",
    category: "Administration",
    sections: [
      {
        id: "integrations",
        title: "Integrations Overview",
        body: [
          "Ablelytics supports integrations for automated workflows and reporting.",
          "Contact support if you need custom integrations or webhook access."
        ],
      },
      {
        id: "automation",
        title: "Automation Ideas",
        bullets: [
          "Trigger scans after a deployment.",
          "Generate weekly compliance reports for stakeholders.",
          "Monitor priority page sets continuously."
        ],
      },
    ],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description: "Common issues and how to resolve them quickly.",
    category: "Support",
    sections: [
      {
        id: "stuck-queue",
        title: "Run Stuck in Queue",
        bullets: [
          "Large sites may queue longer; wait a few minutes.",
          "Verify your subscription allows the scan type you requested.",
          "Try re-running the scan on a smaller page set."
        ],
      },
      {
        id: "missing-pages",
        title: "Missing Pages After Crawl",
        bullets: [
          "Pages behind login or blocked by robots may not be discovered.",
          "Upload a sitemap to include hidden or gated URLs.",
          "Add pages manually if needed."
        ],
      },
      {
        id: "report-delay",
        title: "Report Generation Delay",
        bullets: [
          "Reports are generated after scans finish.",
          "Large reports take longer; check the run status.",
          "Contact support if a report stays queued for an extended time."
        ],
      },
    ],
  },
];

export const docCategories = Array.from(
  new Set(docPages.map((page) => page.category))
);

export const docsByCategory = docCategories.map((category) => ({
  category,
  pages: docPages.filter((page) => page.category === category),
}));

export function getDocBySlug(slug: string): DocPage | undefined {
  return docPages.find((page) => page.slug === slug);
}

export function getDocIndex() {
  return docPages.map((page) => ({
    slug: page.slug,
    title: page.title,
    description: page.description,
    category: page.category,
  }));
}
