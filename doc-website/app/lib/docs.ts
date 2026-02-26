export type ApiEndpoint = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth?: string;
  requestBody?: string;
  responseBody?: string;
  statusCodes?: string[];
  notes?: string[];
};

export type DocSection = {
  id: string;
  title: string;
  body?: string[];
  bullets?: string[];
  steps?: string[];
  endpoints?: ApiEndpoint[];
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
    description: "API overview and links to detailed endpoint references.",
    category: "API & Integrations",
    sections: [
      {
        id: "overview",
        title: "Overview",
        body: [
          "Ablelytics exposes a REST API through Firebase Functions. Routes are mounted under `/api/v1`.",
          "Use the endpoint pages below for request payloads, responses, and status code behavior."
        ],
      },
      {
        id: "authentication",
        title: "Authentication and Access",
        bullets: [
          "Header: `x-api-key: YOUR_API_TOKEN`.",
          "API token is resolved from `users.apiToken`.",
          "Only subscriptions with `features.apiAccess = true` can call protected endpoints."
        ],
      },
      {
        id: "rate-limits",
        title: "Rate Limits",
        bullets: [
          "Rate limiting is enforced per subscription using `limits.apiCallsPerDay`.",
          "Exceeding limit returns `429` with `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining`.",
          "Daily counters reset automatically when usage period rolls over."
        ],
      },
      {
        id: "endpoint-pages",
        title: "Endpoint Reference Pages",
        bullets: [
          "Auth and Health: `/docs/api-auth-and-health`",
          "Projects: `/docs/api-projects`",
          "Pages and Collection: `/docs/api-pages-and-collection`",
          "Page Sets: `/docs/api-page-sets`",
          "Scans and Issues: `/docs/api-scans-and-issues`",
          "Reports: `/docs/api-reports`",
          "Runs: `/docs/api-runs`"
        ],
      },
      {
        id: "base-url",
        title: "Base URL",
        body: [
          "Production pattern: `https://REGION-PROJECT_ID.cloudfunctions.net/api/v1`.",
          "Emulator pattern: `http://localhost:5001/PROJECT_ID/us-central1/api/v1`."
        ],
      },
    ],
  },
  {
    slug: "api-auth-and-health",
    title: "API: Auth and Health",
    description: "Authentication requirements, rate limits, and health check endpoint.",
    category: "API & Integrations",
    sections: [
      {
        id: "health-endpoint",
        title: "Health Endpoint",
        endpoints: [
          {
            id: "health-get",
            method: "GET",
            path: "/api/v1/health",
            description: "Public health endpoint (no API key).",
            responseBody: `{
  "status": "ok",
  "version": "v1"
}`,
            statusCodes: ["200 OK"]
          }
        ]
      },
      {
        id: "auth-rules",
        title: "Authentication Rules",
        bullets: [
          "Protected routes require `x-api-key` header.",
          "Invalid or missing key returns `401`.",
          "Plan without API access returns `403`."
        ]
      },
      {
        id: "rate-limit-rules",
        title: "Rate Limit Rules",
        bullets: [
          "Limit is loaded from `subscriptions/{uid}.limits.apiCallsPerDay`.",
          "Exceeded limit returns `429` and `Retry-After`.",
          "Response headers include `X-RateLimit-Limit` and `X-RateLimit-Remaining`."
        ]
      }
    ],
  },
  {
    slug: "api-projects",
    title: "API: Projects",
    description: "List, create, update, settings update, and delete projects.",
    category: "API & Integrations",
    sections: [
      {
        id: "projects-endpoints",
        title: "Project Endpoints",
        endpoints: [
          {
            id: "projects-list",
            method: "GET",
            path: "/api/v1/projects",
            description: "List projects in the authenticated organisation.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": [
    { "id": "projectId", "name": "Site A", "domain": "https://example.com" }
  ]
}`,
            statusCodes: ["200 OK", "500 Internal Server Error"]
          },
          {
            id: "projects-create",
            method: "POST",
            path: "/api/v1/projects",
            description: "Create a project.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "name": "Site A",
  "domain": "https://example.com",
  "description": "Primary website"
}`,
            responseBody: `{
  "data": {
    "id": "projectId",
    "name": "Site A",
    "domain": "https://example.com",
    "status": "active"
  }
}`,
            statusCodes: ["201 Created", "400 Bad Request", "500 Internal Server Error"]
          },
          {
            id: "projects-patch",
            method: "PATCH",
            path: "/api/v1/projects/:id",
            description: "Update project fields: `name`, `domain`, `description`, `status`.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "name": "Site A (Updated)",
  "status": "active"
}`,
            responseBody: `{
  "data": {
    "id": "projectId",
    "name": "Site A (Updated)",
    "updatedAt": "<timestamp>"
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "projects-settings",
            method: "PATCH",
            path: "/api/v1/projects/:id/settings",
            description: "Set `settings` object on project.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "settings": {
    "maxPages": 500
  }
}`,
            responseBody: `{
  "data": {
    "id": "projectId",
    "settings": {
      "maxPages": 500
    }
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "projects-delete",
            method: "DELETE",
            path: "/api/v1/projects/:id",
            description: "Delete project document.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": {
    "id": "projectId",
    "deleted": true
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          }
        ]
      }
    ],
  },
  {
    slug: "api-pages-and-collection",
    title: "API: Pages and Collection",
    description: "Page CRUD and async page collection endpoints.",
    category: "API & Integrations",
    sections: [
      {
        id: "pages-endpoints",
        title: "Page Endpoints",
        endpoints: [
          {
            id: "pages-list",
            method: "GET",
            path: "/api/v1/projects/:id/pages",
            description: "List pages for project.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": [
    { "id": "pageId", "url": "https://example.com/about", "title": "About" }
  ]
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "pages-create",
            method: "POST",
            path: "/api/v1/projects/:id/pages",
            description: "Create page in project.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "url": "https://example.com/new-page",
  "title": "New Page"
}`,
            responseBody: `{
  "data": {
    "id": "pageId",
    "url": "https://example.com/new-page",
    "title": "New Page"
  }
}`,
            statusCodes: ["201 Created", "400 Bad Request", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "pages-delete",
            method: "DELETE",
            path: "/api/v1/projects/:id/pages/:pageId",
            description: "Delete page from project.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": {
    "id": "pageId",
    "deleted": true
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          }
        ]
      },
      {
        id: "collect-pages",
        title: "Collect Pages Endpoint",
        endpoints: [
          {
            id: "pages-collect",
            method: "POST",
            path: "/api/v1/projects/:id/collect-pages",
            description: "Queue page collection job and return run id.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": {
    "runId": "runId",
    "status": "queued"
  },
  "message": "Page collection started. Poll GET /runs/:runId for status."
}`,
            statusCodes: ["202 Accepted", "404 Not Found", "500 Internal Server Error"],
            notes: ["Asynchronous endpoint. Poll `/api/v1/runs/:runId`."]
          }
        ]
      }
    ],
  },
  {
    slug: "api-page-sets",
    title: "API: Page Sets",
    description: "Manage page sets and resolve pages in a set.",
    category: "API & Integrations",
    sections: [
      {
        id: "page-sets-endpoints",
        title: "Page Set Endpoints",
        endpoints: [
          {
            id: "sets-list",
            method: "GET",
            path: "/api/v1/projects/:id/page-sets",
            description: "List page sets for project.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": [
    { "id": "setId", "name": "Checkout Flow", "pageCount": 12 }
  ]
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "sets-create",
            method: "POST",
            path: "/api/v1/projects/:id/page-sets",
            description: "Create page set from filter spec and/or explicit pages.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "name": "Checkout Flow",
  "regex": "/checkout",
  "excludePatterns": ["/checkout/success"],
  "pageIds": ["pageA", "pageB"]
}`,
            responseBody: `{
  "data": {
    "id": "setId",
    "name": "Checkout Flow",
    "filterSpec": {
      "regex": "/checkout",
      "excludePatterns": ["/checkout/success"]
    },
    "pageCount": 2
  }
}`,
            statusCodes: ["201 Created", "400 Bad Request", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "sets-patch",
            method: "PATCH",
            path: "/api/v1/projects/:id/page-sets/:setId",
            description: "Update page set fields.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "name": "Checkout Primary",
  "regex": "/checkout",
  "pageIds": ["pageA", "pageB", "pageC"]
}`,
            responseBody: `{
  "data": {
    "id": "setId",
    "name": "Checkout Primary",
    "pageCount": 3,
    "updatedAt": "<timestamp>"
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "sets-delete",
            method: "DELETE",
            path: "/api/v1/projects/:id/page-sets/:setId",
            description: "Delete page set.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": {
    "id": "setId",
    "deleted": true
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "sets-pages",
            method: "GET",
            path: "/api/v1/projects/:id/page-sets/:setId/pages",
            description: "Resolve and return pages for page set.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": [
    { "id": "pageId", "url": "https://example.com/checkout" }
  ]
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          }
        ]
      }
    ],
  },
  {
    slug: "api-scans-and-issues",
    title: "API: Scans and Issues",
    description: "Start asynchronous scans and query issues.",
    category: "API & Integrations",
    sections: [
      {
        id: "scans-endpoint",
        title: "Scans Endpoint",
        endpoints: [
          {
            id: "scans-create",
            method: "POST",
            path: "/api/v1/projects/:id/scans",
            description: "Queue a full scan, selected pages scan, or page set scan.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "type": "full"
}`,
            responseBody: `{
  "data": {
    "runId": "runId",
    "status": "queued",
    "pagesCount": 120
  },
  "message": "Scan started. Poll GET /runs/:runId for status."
}`,
            statusCodes: ["202 Accepted", "400 Bad Request", "404 Not Found", "500 Internal Server Error"],
            notes: [
              "`type` can be `full`, `pages`, or `page-set`.",
              "For `pages`, send `pageIds` array.",
              "For `page-set`, send `pageSetId`."
            ]
          }
        ]
      },
      {
        id: "issues-endpoint",
        title: "Issues Endpoint",
        endpoints: [
          {
            id: "issues-list",
            method: "GET",
            path: "/api/v1/projects/:id/issues",
            description: "List issues collection for project.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": [
    {
      "id": "issueId",
      "impact": "serious",
      "ruleId": "image-alt"
    }
  ]
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          }
        ]
      }
    ],
  },
  {
    slug: "api-reports",
    title: "API: Reports",
    description: "List, create, fetch, and delete reports.",
    category: "API & Integrations",
    sections: [
      {
        id: "reports-endpoints",
        title: "Report Endpoints",
        endpoints: [
          {
            id: "reports-list",
            method: "GET",
            path: "/api/v1/projects/:id/reports",
            description: "List reports for project.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": [
    { "id": "reportId", "title": "Weekly Report", "status": "completed", "pdfUrl": "https://..." }
  ]
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "reports-create",
            method: "POST",
            path: "/api/v1/projects/:id/reports",
            description: "Create report record and queue report generation job.",
            auth: "Requires x-api-key.",
            requestBody: `{
  "type": "project",
  "title": "Weekly Accessibility Report"
}`,
            responseBody: `{
  "data": {
    "id": "reportId",
    "status": "generating",
    "pdfUrl": null
  }
}`,
            statusCodes: ["201 Created", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "reports-get",
            method: "GET",
            path: "/api/v1/projects/:id/reports/:reportId",
            description: "Fetch report details including `pdfUrl` when available.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": {
    "id": "reportId",
    "status": "completed",
    "pdfUrl": "https://..."
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          },
          {
            id: "reports-delete",
            method: "DELETE",
            path: "/api/v1/projects/:id/reports/:reportId",
            description: "Delete report document.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": {
    "id": "reportId",
    "deleted": true
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          }
        ]
      }
    ],
  },
  {
    slug: "api-runs",
    title: "API: Runs",
    description: "Poll run status for asynchronous operations.",
    category: "API & Integrations",
    sections: [
      {
        id: "runs-endpoint",
        title: "Run Status Endpoint",
        endpoints: [
          {
            id: "runs-get",
            method: "GET",
            path: "/api/v1/runs/:runId",
            description: "Lookup run by ID across projects in authenticated organisation.",
            auth: "Requires x-api-key.",
            responseBody: `{
  "data": {
    "id": "runId",
    "projectId": "projectId",
    "status": "running",
    "pagesTotal": 120,
    "pagesScanned": 64,
    "stats": {
      "critical": 2,
      "serious": 5,
      "moderate": 12,
      "minor": 18
    }
  }
}`,
            statusCodes: ["200 OK", "404 Not Found", "500 Internal Server Error"]
          }
        ],
        callout: {
          tone: "info",
          title: "Polling strategy",
          body: "Poll every 5-10 seconds and stop when status becomes `done` or `failed`."
        }
      }
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
