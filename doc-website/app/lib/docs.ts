export type QueryParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type ApiEndpoint = {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth?: string;
  queryParams?: QueryParam[];
  requestBody?: string;
  responseBody?: string;
  statusCodes?: string[];
  notes?: string[];
  codeExamples?: { curl?: string; javascript?: string; python?: string };
};

export type DocSection = {
  id: string;
  title: string;
  body?: string[];
  bullets?: string[];
  steps?: string[];
  endpoints?: ApiEndpoint[];
  code?: { language?: string; content: string };
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
    description: "REST API overview, authentication, rate limits, and links to endpoint references.",
    category: "API & Integrations",
    sections: [
      {
        id: "overview",
        title: "Overview",
        body: [
          "The Ablelytics REST API lets you integrate accessibility scanning into CI/CD pipelines, internal tooling, and third-party platforms.",
          "All endpoints are served from api.ablelytics.com and follow predictable REST conventions with JSON request and response bodies.",
        ],
      },
      {
        id: "base-url",
        title: "Base URL",
        body: ["All v1 endpoints are prefixed with:"],
        code: { language: "text", content: "https://api.ablelytics.com/v1" },
      },
      {
        id: "authentication",
        title: "Authentication",
        body: [
          "Every protected endpoint requires an API key sent as the x-api-key request header. Generate your key from Workspace → API Settings.",
        ],
        code: { language: "bash", content: "x-api-key: YOUR_API_KEY" },
        bullets: [
          "Invalid or missing key → 401 Unauthorized",
          "Valid key but plan without API access → 403 Forbidden",
          "API access is available on the Starter plan and above.",
        ],
      },
      {
        id: "rate-limits",
        title: "Rate Limits",
        body: [
          "Each subscription has a daily API call limit. When exceeded the API returns 429 with these headers:",
        ],
        bullets: [
          "X-RateLimit-Limit — your plan's daily call limit",
          "X-RateLimit-Remaining — calls remaining today",
          "Retry-After — seconds until the counter resets at midnight UTC",
        ],
      },
      {
        id: "async-pattern",
        title: "Async Operations",
        body: [
          "Scans and page collection are long-running. These endpoints return 202 Accepted with a runId immediately.",
          "Poll GET /v1/runs/:runId every 5–10 seconds until status is done or failed.",
        ],
        callout: {
          tone: "info",
          title: "CI/CD tip",
          body: "See the CI/CD Integration guide for a complete GitHub Actions workflow example.",
        },
      },
      {
        id: "endpoint-pages",
        title: "Endpoint Reference",
        bullets: [
          "Auth and Health → /docs/api-auth-and-health",
          "Projects → /docs/api-projects",
          "Pages and Collection → /docs/api-pages-and-collection",
          "Page Sets → /docs/api-page-sets",
          "Scans and Issues → /docs/api-scans-and-issues",
          "Reports → /docs/api-reports",
          "Runs (polling) → /docs/api-runs",
          "Pagination Guide → /docs/api-pagination",
          "Error Reference → /docs/api-errors",
          "CI/CD Integration → /docs/api-ci-cd",
        ],
      },
    ],
  },
  {
    slug: "api-auth-and-health",
    title: "API: Auth and Health",
    description: "Authentication, rate limit headers, and the public health check endpoint.",
    category: "API & Integrations",
    sections: [
      {
        id: "health-endpoint",
        title: "Health Check",
        endpoints: [
          {
            id: "health-get",
            method: "GET",
            path: "/v1/health",
            description: "Public endpoint — no API key required. Use this to verify connectivity before running automated workflows.",
            responseBody: `{
  "status": "ok",
  "version": "v1"
}`,
            statusCodes: ["200 OK"],
            codeExamples: {
              curl: `curl https://api.ablelytics.com/v1/health`,
              javascript: `const res = await fetch('https://api.ablelytics.com/v1/health');
const data = await res.json();
console.log(data.status); // "ok"`,
              python: `import requests
resp = requests.get('https://api.ablelytics.com/v1/health')
print(resp.json())  # {'status': 'ok', 'version': 'v1'}`,
            },
          },
        ],
      },
      {
        id: "auth-rules",
        title: "Authentication",
        body: [
          "Protected routes require an x-api-key header containing your API key. Generate your key from Workspace → API Settings.",
        ],
        bullets: [
          "Invalid or missing key → 401 Unauthorized",
          "Valid key, plan without API access → 403 Forbidden",
          "API access requires the Starter plan or higher.",
        ],
      },
      {
        id: "rate-limit-rules",
        title: "Rate Limit Headers",
        body: ["Every successful response includes these headers so you can track usage:"],
        bullets: [
          "X-RateLimit-Limit — your plan's daily call limit",
          "X-RateLimit-Remaining — calls remaining today",
          "X-RateLimit-Reset — ISO timestamp of the midnight UTC reset",
        ],
      },
    ],
  },
  {
    slug: "api-projects",
    title: "API: Projects",
    description: "List, create, update, configure settings, and delete projects.",
    category: "API & Integrations",
    sections: [
      {
        id: "projects-endpoints",
        title: "Project Endpoints",
        endpoints: [
          {
            id: "projects-list",
            method: "GET",
            path: "/v1/projects",
            description: "List all projects in the authenticated organisation, ordered by creation date descending.",
            auth: "x-api-key",
            responseBody: `{
  "data": [
    {
      "id": "clxk1234",
      "name": "Marketing Site",
      "domain": "https://example.com",
      "status": "active",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ]
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "403 Forbidden", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  https://api.ablelytics.com/v1/projects`,
              javascript: `const res = await fetch('https://api.ablelytics.com/v1/projects', {
  headers: { 'x-api-key': process.env.ABLELYTICS_API_KEY }
});
const { data } = await res.json();
console.log(data.length + ' projects found');`,
              python: `import requests, os
resp = requests.get(
    'https://api.ablelytics.com/v1/projects',
    headers={'x-api-key': os.environ['ABLELYTICS_API_KEY']}
)
projects = resp.json()['data']`,
            },
          },
          {
            id: "projects-create",
            method: "POST",
            path: "/v1/projects",
            description: "Create a new project under the authenticated organisation.",
            auth: "x-api-key",
            requestBody: `{
  "name": "Marketing Site",
  "domain": "https://example.com",
  "description": "Public-facing website"
}`,
            responseBody: `{
  "data": {
    "id": "clxk1234",
    "name": "Marketing Site",
    "domain": "https://example.com",
    "status": "active",
    "createdAt": "2024-01-15T09:00:00Z"
  }
}`,
            statusCodes: ["201 Created", "400 Bad Request", "401 Unauthorized", "403 Forbidden", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X POST https://api.ablelytics.com/v1/projects \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Marketing Site","domain":"https://example.com"}'`,
              javascript: `const res = await fetch('https://api.ablelytics.com/v1/projects', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.ABLELYTICS_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Marketing Site',
    domain: 'https://example.com',
  }),
});
const { data } = await res.json();
const projectId = data.id;`,
              python: `import requests, os
resp = requests.post(
    'https://api.ablelytics.com/v1/projects',
    headers={'x-api-key': os.environ['ABLELYTICS_API_KEY']},
    json={'name': 'Marketing Site', 'domain': 'https://example.com'}
)
project = resp.json()['data']
project_id = project['id']`,
            },
          },
          {
            id: "projects-patch",
            method: "PATCH",
            path: "/v1/projects/:id",
            description: "Update project name, domain, description, or status. Only provided fields are changed.",
            auth: "x-api-key",
            requestBody: `{
  "name": "Marketing Site v2",
  "status": "active"
}`,
            responseBody: `{
  "data": {
    "id": "clxk1234",
    "name": "Marketing Site v2",
    "domain": "https://example.com",
    "status": "active",
    "updatedAt": "2024-01-16T12:00:00Z"
  }
}`,
            statusCodes: ["200 OK", "400 Bad Request", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X PATCH https://api.ablelytics.com/v1/projects/PROJECT_ID \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Marketing Site v2"}'`,
            },
          },
          {
            id: "projects-settings",
            method: "PATCH",
            path: "/v1/projects/:id/settings",
            description: "Replace the settings object on the project. Used to configure crawl depth, page limits, and scan options.",
            auth: "x-api-key",
            requestBody: `{
  "settings": {
    "maxPages": 500,
    "crawlDepth": 5
  }
}`,
            responseBody: `{
  "data": {
    "id": "clxk1234",
    "settings": {
      "maxPages": 500,
      "crawlDepth": 5
    }
  }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X PATCH https://api.ablelytics.com/v1/projects/PROJECT_ID/settings \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"settings":{"maxPages":500,"crawlDepth":5}}'`,
            },
          },
          {
            id: "projects-delete",
            method: "DELETE",
            path: "/v1/projects/:id",
            description: "Permanently delete a project and all associated pages, scans, runs, and reports. This action cannot be undone.",
            auth: "x-api-key",
            responseBody: `{
  "data": {
    "id": "clxk1234",
    "deleted": true
  }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X DELETE https://api.ablelytics.com/v1/projects/PROJECT_ID \\
  -H "x-api-key: $ABLELYTICS_API_KEY"`,
            },
          },
        ],
      },
    ],
  },
  {
    slug: "api-pages-and-collection",
    title: "API: Pages and Collection",
    description: "Manage pages and trigger async page collection (crawl).",
    category: "API & Integrations",
    sections: [
      {
        id: "pages-endpoints",
        title: "Page Endpoints",
        endpoints: [
          {
            id: "pages-list",
            method: "GET",
            path: "/v1/projects/:id/pages",
            description: "List pages in the project, ordered by creation date. Supports cursor pagination.",
            auth: "x-api-key",
            queryParams: [
              { name: "limit", type: "integer", required: false, description: "Pages to return. Default 50, max 500." },
              { name: "after", type: "string", required: false, description: "Cursor from pagination.nextCursor to fetch the next page." },
            ],
            responseBody: `{
  "data": [
    {
      "id": "pageId",
      "url": "https://example.com/about",
      "title": "About Us",
      "statusCode": 200,
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "nextCursor": "cm9wa3BqMzQ1Ng",
    "hasMore": true
  }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  "https://api.ablelytics.com/v1/projects/PROJECT_ID/pages?limit=100"`,
              javascript: `const res = await fetch(
  'https://api.ablelytics.com/v1/projects/PROJECT_ID/pages?limit=100',
  { headers: { 'x-api-key': process.env.ABLELYTICS_API_KEY } }
);
const { data, pagination } = await res.json();`,
              python: `import requests, os
resp = requests.get(
    'https://api.ablelytics.com/v1/projects/PROJECT_ID/pages',
    headers={'x-api-key': os.environ['ABLELYTICS_API_KEY']},
    params={'limit': 100}
)
result = resp.json()
pages, next_cursor = result['data'], result['pagination']['nextCursor']`,
            },
          },
          {
            id: "pages-create",
            method: "POST",
            path: "/v1/projects/:id/pages",
            description: "Manually add a page to the project. Useful for pages behind authentication or not discoverable by the crawler.",
            auth: "x-api-key",
            requestBody: `{
  "url": "https://example.com/dashboard",
  "title": "User Dashboard"
}`,
            responseBody: `{
  "data": {
    "id": "pageId",
    "url": "https://example.com/dashboard",
    "title": "User Dashboard",
    "statusCode": null,
    "createdAt": "2024-01-15T09:00:00Z"
  }
}`,
            statusCodes: ["201 Created", "400 Bad Request", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X POST https://api.ablelytics.com/v1/projects/PROJECT_ID/pages \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/dashboard","title":"User Dashboard"}'`,
              javascript: `const res = await fetch(
  'https://api.ablelytics.com/v1/projects/PROJECT_ID/pages',
  {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ABLELYTICS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: 'https://example.com/dashboard' }),
  }
);
const { data } = await res.json();`,
              python: `import requests, os
resp = requests.post(
    'https://api.ablelytics.com/v1/projects/PROJECT_ID/pages',
    headers={'x-api-key': os.environ['ABLELYTICS_API_KEY']},
    json={'url': 'https://example.com/dashboard', 'title': 'User Dashboard'}
)
page = resp.json()['data']`,
            },
          },
          {
            id: "pages-delete",
            method: "DELETE",
            path: "/v1/projects/:id/pages/:pageId",
            description: "Remove a page from the project. Associated scan results are retained.",
            auth: "x-api-key",
            responseBody: `{
  "data": { "id": "pageId", "deleted": true }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X DELETE \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/pages/PAGE_ID \\
  -H "x-api-key: $ABLELYTICS_API_KEY"`,
            },
          },
        ],
      },
      {
        id: "collect-pages",
        title: "Collect Pages (Crawl)",
        endpoints: [
          {
            id: "pages-collect",
            method: "POST",
            path: "/v1/projects/:id/collect-pages",
            description: "Queue an async page collection job. The crawler discovers internal links from your project domain and adds them as pages. Returns immediately with a runId to poll.",
            auth: "x-api-key",
            responseBody: `{
  "data": {
    "runId": "clxr7890",
    "status": "queued",
    "message": "Page collection started. Poll GET /v1/runs/clxr7890 for status."
  }
}`,
            statusCodes: ["202 Accepted", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            notes: [
              "This is an async operation — response is 202 Accepted, not 200.",
              "Poll GET /v1/runs/:runId every 5–10 seconds until status is done or failed.",
              "Newly discovered pages are automatically added to the project.",
            ],
            codeExamples: {
              curl: `curl -X POST \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/collect-pages \\
  -H "x-api-key: $ABLELYTICS_API_KEY"`,
              javascript: `// Start collection
const res = await fetch(
  'https://api.ablelytics.com/v1/projects/PROJECT_ID/collect-pages',
  { method: 'POST', headers: { 'x-api-key': process.env.ABLELYTICS_API_KEY } }
);
const { data } = await res.json();
const runId = data.runId;

// Poll for completion
let run;
do {
  await new Promise(r => setTimeout(r, 5000));
  const poll = await fetch(
    'https://api.ablelytics.com/v1/runs/' + runId,
    { headers: { 'x-api-key': process.env.ABLELYTICS_API_KEY } }
  );
  run = (await poll.json()).data;
} while (run.status === 'queued' || run.status === 'running');
console.log('Collection', run.status, '— pages found:', run.pagesTotal);`,
              python: `import requests, os, time

api_key = os.environ['ABLELYTICS_API_KEY']
headers = {'x-api-key': api_key}

# Start collection
resp = requests.post(
    'https://api.ablelytics.com/v1/projects/PROJECT_ID/collect-pages',
    headers=headers)
run_id = resp.json()['data']['runId']

# Poll for completion
while True:
    poll = requests.get(
        f'https://api.ablelytics.com/v1/runs/{run_id}', headers=headers)
    status = poll.json()['data']['status']
    if status in ('done', 'failed'):
        break
    time.sleep(5)
print('Collection:', status)`,
            },
          },
        ],
      },
    ],
  },
  {
    slug: "api-page-sets",
    title: "API: Page Sets",
    description: "Create and manage page sets for focused scans and reports.",
    category: "API & Integrations",
    sections: [
      {
        id: "page-sets-endpoints",
        title: "Page Set Endpoints",
        endpoints: [
          {
            id: "sets-list",
            method: "GET",
            path: "/v1/projects/:id/page-sets",
            description: "List all page sets for the project.",
            auth: "x-api-key",
            responseBody: `{
  "data": [
    {
      "id": "setId",
      "name": "Checkout Flow",
      "filterSpec": { "regex": "/checkout" },
      "pageCount": 12,
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ]
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/page-sets`,
            },
          },
          {
            id: "sets-create",
            method: "POST",
            path: "/v1/projects/:id/page-sets",
            description: "Create a page set using a URL filter pattern, explicit page IDs, or both.",
            auth: "x-api-key",
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
    "pageCount": 14
  }
}`,
            statusCodes: ["201 Created", "400 Bad Request", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X POST https://api.ablelytics.com/v1/projects/PROJECT_ID/page-sets \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Checkout Flow","regex":"/checkout"}'`,
              javascript: `const res = await fetch(
  'https://api.ablelytics.com/v1/projects/PROJECT_ID/page-sets',
  {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ABLELYTICS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Checkout Flow', regex: '/checkout' }),
  }
);
const { data } = await res.json();
const setId = data.id;`,
            },
          },
          {
            id: "sets-patch",
            method: "PATCH",
            path: "/v1/projects/:id/page-sets/:setId",
            description: "Update a page set's name, filter pattern, or explicit page list.",
            auth: "x-api-key",
            requestBody: `{
  "name": "Checkout Primary",
  "pageIds": ["pageA", "pageB", "pageC"]
}`,
            responseBody: `{
  "data": {
    "id": "setId",
    "name": "Checkout Primary",
    "pageCount": 3,
    "updatedAt": "2024-01-16T12:00:00Z"
  }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X PATCH \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/page-sets/SET_ID \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Checkout Primary"}'`,
            },
          },
          {
            id: "sets-delete",
            method: "DELETE",
            path: "/v1/projects/:id/page-sets/:setId",
            description: "Delete a page set. Does not delete the pages it referenced.",
            auth: "x-api-key",
            responseBody: `{
  "data": { "id": "setId", "deleted": true }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X DELETE \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/page-sets/SET_ID \\
  -H "x-api-key: $ABLELYTICS_API_KEY"`,
            },
          },
          {
            id: "sets-pages",
            method: "GET",
            path: "/v1/projects/:id/page-sets/:setId/pages",
            description: "Resolve and return the pages that belong to this set, applying filter patterns against the project's page list.",
            auth: "x-api-key",
            queryParams: [
              { name: "limit", type: "integer", required: false, description: "Pages to return. Default 50, max 500." },
              { name: "after", type: "string", required: false, description: "Pagination cursor." },
            ],
            responseBody: `{
  "data": [
    { "id": "pageId", "url": "https://example.com/checkout", "title": "Checkout" }
  ],
  "pagination": { "limit": 50, "nextCursor": null, "hasMore": false }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/page-sets/SET_ID/pages`,
            },
          },
        ],
      },
    ],
  },
  {
    slug: "api-scans-and-issues",
    title: "API: Scans and Issues",
    description: "Trigger async accessibility scans and retrieve per-page issue results.",
    category: "API & Integrations",
    sections: [
      {
        id: "scans-endpoint",
        title: "Start a Scan",
        endpoints: [
          {
            id: "scans-create",
            method: "POST",
            path: "/v1/projects/:id/scans",
            description: "Queue an async accessibility scan. Choose from a full project scan, a list of specific pages, or a saved page set. Returns a runId to poll for completion.",
            auth: "x-api-key",
            requestBody: `// Full project scan
{ "type": "full" }

// Specific pages only
{ "type": "pages", "pageIds": ["pageA", "pageB"] }

// A saved page set
{ "type": "page-set", "pageSetId": "setId" }`,
            responseBody: `{
  "data": {
    "runId": "clxr7890",
    "status": "queued",
    "pagesCount": 120
  },
  "message": "Scan started. Poll GET /v1/runs/clxr7890 for status."
}`,
            statusCodes: ["202 Accepted", "400 Bad Request", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            notes: [
              "type must be full, pages, or page-set.",
              "For type pages, include a pageIds array.",
              "For type page-set, include a pageSetId string.",
              "Poll GET /v1/runs/:runId every 5–10 seconds. Stop when status is done or failed.",
            ],
            codeExamples: {
              curl: `curl -X POST https://api.ablelytics.com/v1/projects/PROJECT_ID/scans \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"full"}'`,
              javascript: `const res = await fetch(
  'https://api.ablelytics.com/v1/projects/PROJECT_ID/scans',
  {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ABLELYTICS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'full' }),
  }
);
const { data } = await res.json();
console.log('Run queued:', data.runId, '— pages:', data.pagesCount);`,
              python: `import requests, os
resp = requests.post(
    'https://api.ablelytics.com/v1/projects/PROJECT_ID/scans',
    headers={'x-api-key': os.environ['ABLELYTICS_API_KEY']},
    json={'type': 'full'}
)
data = resp.json()['data']
run_id, pages = data['runId'], data['pagesCount']
print(f'Run queued: {run_id} ({pages} pages)')`,
            },
          },
        ],
      },
      {
        id: "issues-endpoint",
        title: "Retrieve Issues",
        endpoints: [
          {
            id: "issues-list",
            method: "GET",
            path: "/v1/projects/:id/issues",
            description: "Return scan results with accessibility issues for the project, newest first. Each item represents one scanned page and includes the raw axe-core violation data.",
            auth: "x-api-key",
            queryParams: [
              { name: "limit", type: "integer", required: false, description: "Scan results to return. Default 100, max 500." },
              { name: "after", type: "string", required: false, description: "Cursor (scan ID) for the next page of results." },
            ],
            responseBody: `{
  "data": [
    {
      "scanId": "scanId",
      "pageId": "pageId",
      "pageUrl": "https://example.com/about",
      "pageTitle": "About Us",
      "summary": {
        "critical": 1,
        "serious": 3,
        "moderate": 7,
        "minor": 4
      },
      "issues": [
        {
          "id": "image-alt",
          "impact": "critical",
          "description": "Ensures <img> elements have alternative text",
          "nodes": [{ "html": "<img src='logo.png'>", "target": ["img"] }]
        }
      ],
      "scannedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "nextCursor": "scanId",
    "hasMore": false
  }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            notes: [
              "Only pages that have been scanned at least once are included.",
              "issues contains the full axe-core violation array for each page.",
              "Use the summary counts to triage before processing the full issue payload.",
            ],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  "https://api.ablelytics.com/v1/projects/PROJECT_ID/issues?limit=50"`,
              javascript: `const res = await fetch(
  'https://api.ablelytics.com/v1/projects/PROJECT_ID/issues?limit=50',
  { headers: { 'x-api-key': process.env.ABLELYTICS_API_KEY } }
);
const { data, pagination } = await res.json();
const critical = data.filter(s => s.summary.critical > 0);
console.log(critical.length + ' pages with critical issues');`,
              python: `import requests, os
resp = requests.get(
    'https://api.ablelytics.com/v1/projects/PROJECT_ID/issues',
    headers={'x-api-key': os.environ['ABLELYTICS_API_KEY']},
    params={'limit': 50}
)
for scan in resp.json()['data']:
    if scan['summary']['critical'] > 0:
        print(scan['pageUrl'], scan['summary'])`,
            },
          },
        ],
      },
    ],
  },
  {
    slug: "api-reports",
    title: "API: Reports",
    description: "Generate, poll, download, and delete accessibility reports.",
    category: "API & Integrations",
    sections: [
      {
        id: "reports-endpoints",
        title: "Report Endpoints",
        endpoints: [
          {
            id: "reports-list",
            method: "GET",
            path: "/v1/projects/:id/reports",
            description: "List all reports for the project, newest first.",
            auth: "x-api-key",
            queryParams: [
              { name: "limit", type: "integer", required: false, description: "Reports to return. Default 50." },
              { name: "after", type: "string", required: false, description: "Pagination cursor." },
            ],
            responseBody: `{
  "data": [
    {
      "id": "reportId",
      "title": "Q1 Accessibility Audit",
      "status": "completed",
      "pdfUrl": "https://storage.googleapis.com/bucket/report.pdf",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ],
  "pagination": { "limit": 50, "nextCursor": null, "hasMore": false }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/reports`,
            },
          },
          {
            id: "reports-create",
            method: "POST",
            path: "/v1/projects/:id/reports",
            description: "Queue a new PDF accessibility report for the project. Returns immediately with status generating. Poll the GET endpoint until status is completed and pdfUrl is available.",
            auth: "x-api-key",
            requestBody: `{
  "title": "Q1 Accessibility Audit",
  "type": "project"
}`,
            responseBody: `{
  "data": {
    "id": "reportId",
    "title": "Q1 Accessibility Audit",
    "status": "generating",
    "pdfUrl": null,
    "createdAt": "2024-01-15T09:00:00Z"
  }
}`,
            statusCodes: ["201 Created", "400 Bad Request", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            notes: [
              "Poll GET /v1/projects/:id/reports/:reportId until status is completed.",
              "pdfUrl is populated once generation finishes.",
            ],
            codeExamples: {
              curl: `curl -X POST https://api.ablelytics.com/v1/projects/PROJECT_ID/reports \\
  -H "x-api-key: $ABLELYTICS_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Q1 Audit","type":"project"}'`,
              javascript: `const res = await fetch(
  'https://api.ablelytics.com/v1/projects/PROJECT_ID/reports',
  {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ABLELYTICS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Q1 Audit', type: 'project' }),
  }
);
const { data } = await res.json();
// data.status === 'generating' — poll until 'completed'`,
            },
          },
          {
            id: "reports-get",
            method: "GET",
            path: "/v1/projects/:id/reports/:reportId",
            description: "Fetch a single report record. Poll this endpoint after creation to check for pdfUrl availability.",
            auth: "x-api-key",
            responseBody: `{
  "data": {
    "id": "reportId",
    "title": "Q1 Accessibility Audit",
    "status": "completed",
    "pdfUrl": "https://storage.googleapis.com/bucket/report.pdf",
    "createdAt": "2024-01-15T09:00:00Z"
  }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/reports/REPORT_ID`,
            },
          },
          {
            id: "reports-delete",
            method: "DELETE",
            path: "/v1/projects/:id/reports/:reportId",
            description: "Delete a report record. The associated PDF file in cloud storage is also removed.",
            auth: "x-api-key",
            responseBody: `{
  "data": { "id": "reportId", "deleted": true }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            codeExamples: {
              curl: `curl -X DELETE \\
  https://api.ablelytics.com/v1/projects/PROJECT_ID/reports/REPORT_ID \\
  -H "x-api-key: $ABLELYTICS_API_KEY"`,
            },
          },
        ],
      },
    ],
  },
  {
    slug: "api-runs",
    title: "API: Runs",
    description: "Poll the status of async scan and collection operations.",
    category: "API & Integrations",
    sections: [
      {
        id: "runs-endpoint",
        title: "Run Status",
        endpoints: [
          {
            id: "runs-get",
            method: "GET",
            path: "/v1/runs/:runId",
            description: "Retrieve the current status of an async run. Use this to poll after starting a scan or page collection. The run is scoped to your organisation — you cannot access runs from other accounts.",
            auth: "x-api-key",
            responseBody: `{
  "data": {
    "id": "clxr7890",
    "type": "scan_pages",
    "status": "running",
    "pagesTotal": 120,
    "pagesScanned": 64,
    "stats": {
      "critical": 2,
      "serious": 8,
      "moderate": 14,
      "minor": 31
    },
    "startedAt": "2024-01-15T10:00:00Z",
    "finishedAt": null,
    "createdAt": "2024-01-15T09:58:00Z",
    "project": {
      "id": "clxk1234",
      "name": "Marketing Site",
      "domain": "https://example.com"
    }
  }
}`,
            statusCodes: ["200 OK", "401 Unauthorized", "404 Not Found", "500 Internal Server Error"],
            notes: [
              "status transitions: queued → running → done | failed | cancelled",
              "stats is populated progressively as pages are scanned.",
              "Poll every 5–10 seconds. Stop when status is done or failed.",
            ],
            codeExamples: {
              curl: `curl -H "x-api-key: $ABLELYTICS_API_KEY" \\
  https://api.ablelytics.com/v1/runs/RUN_ID`,
              javascript: `async function waitForRun(runId) {
  const API_KEY = process.env.ABLELYTICS_API_KEY;
  while (true) {
    const res = await fetch(
      'https://api.ablelytics.com/v1/runs/' + runId,
      { headers: { 'x-api-key': API_KEY } }
    );
    const { data } = await res.json();
    console.log('Status:', data.status,
      data.pagesScanned + '/' + data.pagesTotal + ' pages');
    if (data.status === 'done' || data.status === 'failed') return data;
    await new Promise(r => setTimeout(r, 5000));
  }
}`,
              python: `import requests, os, time

def wait_for_run(run_id):
    api_key = os.environ['ABLELYTICS_API_KEY']
    while True:
        resp = requests.get(
            f'https://api.ablelytics.com/v1/runs/{run_id}',
            headers={'x-api-key': api_key}
        )
        run = resp.json()['data']
        print(f"Status: {run['status']} "
              f"({run['pagesScanned']}/{run['pagesTotal']} pages)")
        if run['status'] in ('done', 'failed'):
            return run
        time.sleep(5)`,
            },
          },
        ],
        callout: {
          tone: "info",
          title: "Polling strategy",
          body: "Poll every 5–10 seconds. Use exponential backoff for large scans with 500+ pages to avoid hitting rate limits.",
        },
      },
    ],
  },
  {
    slug: "api-pagination",
    title: "API: Pagination",
    description: "Cursor-based pagination for list endpoints.",
    category: "API & Integrations",
    sections: [
      {
        id: "overview",
        title: "How Pagination Works",
        body: [
          "List endpoints that can return large datasets use cursor-based pagination. Instead of page numbers, each response includes a cursor pointing to the last returned item.",
          "Pass that cursor as the after query parameter to fetch the next page.",
        ],
      },
      {
        id: "params",
        title: "Query Parameters",
        bullets: [
          "limit — Number of items per page (default varies per endpoint, max 500).",
          "after — Cursor string returned in the previous response as pagination.nextCursor.",
        ],
      },
      {
        id: "response",
        title: "Response Envelope",
        body: ["Every paginated endpoint wraps its results in a data array alongside a pagination object:"],
        code: {
          language: "json",
          content: `{
  "data": [ ... ],
  "pagination": {
    "limit": 100,
    "nextCursor": "cm9wa3BqMzQ1Ng",
    "hasMore": true
  }
}`,
        },
      },
      {
        id: "iteration",
        title: "Iterating All Pages",
        body: ["Keep fetching with after=nextCursor until hasMore is false:"],
        code: {
          language: "javascript",
          content: `async function* fetchAllIssues(projectId, apiKey) {
  let cursor = undefined;
  do {
    const params = cursor ? '?after=' + cursor : '';
    const res = await fetch(
      'https://api.ablelytics.com/v1/projects/' + projectId + '/issues' + params,
      { headers: { 'x-api-key': apiKey } }
    );
    const { data, pagination } = await res.json();
    yield* data;
    cursor = pagination.hasMore ? pagination.nextCursor : undefined;
  } while (cursor);
}`,
        },
      },
      {
        id: "endpoints",
        title: "Paginated Endpoints",
        bullets: [
          "GET /v1/projects/:id/pages — default limit 50, max 500",
          "GET /v1/projects/:id/issues — default limit 100, max 500",
          "GET /v1/projects/:id/reports — default limit 50",
          "GET /v1/projects/:id/page-sets/:setId/pages — default limit 50, max 500",
        ],
      },
    ],
  },
  {
    slug: "api-errors",
    title: "API: Error Reference",
    description: "Standard error format and HTTP status code reference.",
    category: "API & Integrations",
    sections: [
      {
        id: "format",
        title: "Error Response Format",
        body: ["All errors return a JSON object with a single error field:"],
        code: {
          language: "json",
          content: `{
  "error": "Human-readable error message."
}`,
        },
      },
      {
        id: "status-codes",
        title: "Status Code Reference",
        bullets: [
          "200 OK — Request succeeded.",
          "201 Created — Resource created successfully.",
          "202 Accepted — Async operation queued; poll /v1/runs/:runId for status.",
          "400 Bad Request — Missing or invalid request body fields.",
          "401 Unauthorized — API key is missing, invalid, or revoked.",
          "403 Forbidden — Your plan does not include API access.",
          "404 Not Found — Resource does not exist or belongs to a different account.",
          "429 Too Many Requests — Daily rate limit exceeded.",
          "500 Internal Server Error — Unexpected server failure.",
        ],
      },
      {
        id: "rate-limit-errors",
        title: "Rate Limit Headers on 429",
        body: ["A 429 response includes headers to help you back off:"],
        bullets: [
          "X-RateLimit-Limit — your plan's daily call limit",
          "X-RateLimit-Remaining — always 0 when 429 is returned",
          "Retry-After — seconds until the daily counter resets",
        ],
      },
      {
        id: "not-found",
        title: "404 Error Messages",
        body: ["Each 404 identifies the missing resource:"],
        bullets: [
          '"Project not found." — project ID is missing or unauthorized.',
          '"Page not found." — page ID not in project.',
          '"Page set not found." — page set not in project.',
          '"Run not found." — run ID not scoped to your account.',
          '"Report not found." — report ID not in project.',
        ],
      },
    ],
  },
  {
    slug: "api-ci-cd",
    title: "API: CI/CD Integration",
    description: "Integrate accessibility scanning into GitHub Actions and other CI/CD pipelines.",
    category: "API & Integrations",
    sections: [
      {
        id: "overview",
        title: "Overview",
        body: [
          "Run automated accessibility scans on every deploy using the Ablelytics REST API.",
          "A typical CI workflow: trigger a scan after deployment → poll until done → fail the build if critical issues are found.",
        ],
      },
      {
        id: "github-actions",
        title: "GitHub Actions Workflow",
        body: ["Add the following workflow to .github/workflows/accessibility.yml:"],
        code: {
          language: "yaml",
          content: `name: Accessibility Scan

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  a11y-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Start accessibility scan
        id: scan
        run: |
          RESPONSE=$(curl -s -X POST \\
            -H "x-api-key: \${{ secrets.ABLELYTICS_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"type":"full"}' \\
            https://api.ablelytics.com/v1/projects/\${{ vars.ABLELYTICS_PROJECT_ID }}/scans)
          RUN_ID=$(echo $RESPONSE | jq -r '.data.runId')
          PAGES=$(echo $RESPONSE | jq -r '.data.pagesCount')
          echo "run_id=$RUN_ID" >> $GITHUB_OUTPUT
          echo "Queued scan for $PAGES pages (run: $RUN_ID)"

      - name: Wait for scan to complete
        id: result
        run: |
          RUN_ID="\${{ steps.scan.outputs.run_id }}"
          while true; do
            RESP=$(curl -s \\
              -H "x-api-key: \${{ secrets.ABLELYTICS_API_KEY }}" \\
              https://api.ablelytics.com/v1/runs/$RUN_ID)
            STATUS=$(echo $RESP | jq -r '.data.status')
            CRITICAL=$(echo $RESP | jq -r '.data.stats.critical // 0')
            echo "Status: $STATUS | Critical: $CRITICAL"
            if [ "$STATUS" = "done" ]; then
              echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
              break
            fi
            if [ "$STATUS" = "failed" ]; then
              echo "Scan failed" && exit 1
            fi
            sleep 10
          done

      - name: Fail on critical issues
        if: steps.result.outputs.critical != '0'
        run: |
          echo "Found \${{ steps.result.outputs.critical }} critical accessibility issues"
          exit 1`,
        },
      },
      {
        id: "secrets",
        title: "Required Secrets & Variables",
        bullets: [
          "ABLELYTICS_API_KEY (Secret) — your API key from Workspace → API Settings.",
          "ABLELYTICS_PROJECT_ID (Variable) — the project ID to scan. Find it in the project URL.",
        ],
      },
      {
        id: "node-example",
        title: "Node.js Script",
        body: ["Use this script for non-GitHub environments or custom orchestration:"],
        code: {
          language: "javascript",
          content: `#!/usr/bin/env node
const API_KEY = process.env.ABLELYTICS_API_KEY;
const PROJECT_ID = process.env.ABLELYTICS_PROJECT_ID;
const BASE = 'https://api.ablelytics.com/v1';
const HEADERS = { 'x-api-key': API_KEY, 'Content-Type': 'application/json' };

async function run() {
  // 1. Start scan
  const scanRes = await fetch(BASE + '/projects/' + PROJECT_ID + '/scans', {
    method: 'POST', headers: HEADERS,
    body: JSON.stringify({ type: 'full' }),
  });
  const { data: { runId, pagesCount } } = await scanRes.json();
  console.log('Scan queued:', runId, '(' + pagesCount + ' pages)');

  // 2. Poll until done
  let run;
  do {
    await new Promise(r => setTimeout(r, 8000));
    const pollRes = await fetch(BASE + '/runs/' + runId, { headers: HEADERS });
    run = (await pollRes.json()).data;
    console.log('Status:', run.status, run.pagesScanned + '/' + run.pagesTotal);
  } while (run.status === 'queued' || run.status === 'running');

  // 3. Exit non-zero if critical issues found
  if (run.status === 'failed') process.exit(1);
  if (run.stats?.critical > 0) {
    console.error('Critical issues found:', run.stats.critical);
    process.exit(1);
  }
  console.log('Scan passed — no critical issues.');
}

run().catch(err => { console.error(err); process.exit(1); });`,
        },
      },
      {
        id: "tips",
        title: "Tips",
        bullets: [
          "Store ABLELYTICS_API_KEY as an encrypted secret, never in plain text.",
          "Scope scans to a page set for faster CI checks on critical user flows.",
          "Consider running full scans on a schedule (nightly) rather than on every push.",
          "Use the issues endpoint after a scan to programmatically triage new regressions.",
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
