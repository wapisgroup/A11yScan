# Using Accessibility Rules on Public Website

This guide shows how to create an "Accessibility Rules" section on your public website with a listing page and clickable rule details.

## Architecture

```
public-website/
├── app/
│   └── accessibility-rules/
│       ├── page.tsx              # List all rules
│       └── [ruleId]/
│           └── page.tsx          # Individual rule detail
└── api/
    └── accessibility-rules/
        ├── route.ts              # GET all rules
        └── [ruleId]/
            └── route.ts          # GET single rule
```

## Step 1: Create API Routes

### Get All Rules (List)

**File: `app/api/accessibility-rules/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import path from 'path';
import { AccessibilityRulesService } from '@/accessibility-rules/rules-service';

// Initialize the service
const rulesPath = path.join(process.cwd(), 'accessibility-rules', 'rules');
const rulesService = new AccessibilityRulesService(rulesPath);

export async function GET() {
  try {
    const rules = await rulesService.getAllRuleSummaries();
    
    // Sort by severity and title
    const sortedRules = rules.sort((a, b) => {
      const severityOrder = { Critical: 0, Serious: 1, Moderate: 2, Minor: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return a.title.localeCompare(b.title);
    });
    
    return NextResponse.json(sortedRules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility rules' },
      { status: 500 }
    );
  }
}
```

### Get Single Rule (Detail)

**File: `app/api/accessibility-rules/[ruleId]/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import path from 'path';
import { AccessibilityRulesService } from '@/accessibility-rules/rules-service';

const rulesPath = path.join(process.cwd(), 'accessibility-rules', 'rules');
const rulesService = new AccessibilityRulesService(rulesPath);

export async function GET(
  request: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const rule = await rulesService.getRule(params.ruleId);
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rule' },
      { status: 500 }
    );
  }
}
```

## Step 2: Create Rules Listing Page

**File: `app/accessibility-rules/page.tsx`**

```tsx
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility Rules | Your Site',
  description: 'Comprehensive guide to web accessibility rules and how to fix common issues.',
};

interface RuleSummary {
  ruleId: string;
  title: string;
  severity: 'Critical' | 'Serious' | 'Moderate' | 'Minor';
  wcag: string;
  description: string;
}

async function getRules(): Promise<RuleSummary[]> {
  // Fetch from your API (server-side)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/accessibility-rules`, {
    next: { revalidate: 3600 } // Revalidate every hour
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch rules');
  }
  
  return res.json();
}

// Group rules by category
function groupRulesByCategory(rules: RuleSummary[]) {
  const categories = {
    'ARIA': [] as RuleSummary[],
    'Forms & Inputs': [] as RuleSummary[],
    'Images & Media': [] as RuleSummary[],
    'Document Structure': [] as RuleSummary[],
    'Lists & Landmarks': [] as RuleSummary[],
    'Navigation & Interaction': [] as RuleSummary[],
  };
  
  rules.forEach(rule => {
    const id = rule.ruleId;
    if (id.startsWith('aria-')) {
      categories['ARIA'].push(rule);
    } else if (['label', 'input-button-name', 'button-name', 'autocomplete-valid'].includes(id)) {
      categories['Forms & Inputs'].push(rule);
    } else if (['image-alt', 'video-caption', 'audio-caption', 'area-alt'].includes(id)) {
      categories['Images & Media'].push(rule);
    } else if (['document-title', 'html-has-lang', 'html-lang-valid', 'page-has-heading-one', 'heading-order', 'empty-heading', 'duplicate-id'].includes(id)) {
      categories['Document Structure'].push(rule);
    } else if (['list', 'listitem', 'landmark-one-main', 'definition-list', 'dlitem'].includes(id)) {
      categories['Lists & Landmarks'].push(rule);
    } else {
      categories['Navigation & Interaction'].push(rule);
    }
  });
  
  return categories;
}

function getSeverityBadgeClass(severity: string) {
  const classes = {
    Critical: 'bg-red-100 text-red-800 border-red-200',
    Serious: 'bg-orange-100 text-orange-800 border-orange-200',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Minor: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return classes[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export default async function AccessibilityRulesPage() {
  const rules = await getRules();
  const categorizedRules = groupRulesByCategory(rules);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Accessibility Rules
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Comprehensive guide to web accessibility rules. Each rule includes detailed
          explanations, code examples, and testing strategies.
        </p>
        
        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{rules.length}</div>
            <div className="text-sm text-gray-600">Total Rules</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-900">
              {rules.filter(r => r.severity === 'Critical').length}
            </div>
            <div className="text-sm text-red-700">Critical</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-900">
              {rules.filter(r => r.severity === 'Serious').length}
            </div>
            <div className="text-sm text-orange-700">Serious</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-900">
              {rules.filter(r => r.severity === 'Moderate').length}
            </div>
            <div className="text-sm text-yellow-700">Moderate</div>
          </div>
        </div>
      </div>
      
      {/* Rules by Category */}
      <div className="space-y-12">
        {Object.entries(categorizedRules).map(([category, categoryRules]) => {
          if (categoryRules.length === 0) return null;
          
          return (
            <section key={category}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-200">
                {category} ({categoryRules.length})
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryRules.map((rule) => (
                  <Link
                    key={rule.ruleId}
                    href={`/accessibility-rules/${rule.ruleId}`}
                    className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all group"
                  >
                    {/* Severity Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadgeClass(rule.severity)}`}>
                        {rule.severity}
                      </span>
                      <svg 
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                      {rule.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {rule.description}
                    </p>
                    
                    {/* WCAG */}
                    <div className="text-xs text-gray-500">
                      {rule.wcag}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
```

## Step 3: Create Rule Detail Page

**File: `app/accessibility-rules/[ruleId]/page.tsx`**

```tsx
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Rule {
  ruleId: string;
  title: string;
  severity: string;
  wcag: string;
  description: string;
  whyItMatters: string;
  howToFix: string;
  ruleDescription: string;
  commonMistakes?: string;
  testing?: string;
  resources: Array<{ title: string; url: string }>;
  relatedRules: Array<{ ruleId: string; description: string }>;
}

async function getRule(ruleId: string): Promise<Rule | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/accessibility-rules/${ruleId}`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching rule:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { ruleId: string } }
): Promise<Metadata> {
  const rule = await getRule(params.ruleId);
  
  if (!rule) {
    return {
      title: 'Rule Not Found',
    };
  }
  
  return {
    title: `${rule.title} | Accessibility Rules`,
    description: rule.description,
  };
}

function getSeverityColor(severity: string) {
  const colors = {
    Critical: 'bg-red-100 text-red-800 border-red-200',
    Serious: 'bg-orange-100 text-orange-800 border-orange-200',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Minor: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export default async function RuleDetailPage({
  params,
}: {
  params: { ruleId: string };
}) {
  const rule = await getRule(params.ruleId);
  
  if (!rule) {
    notFound();
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back Link */}
      <Link 
        href="/accessibility-rules"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to all rules
      </Link>
      
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityColor(rule.severity)}`}>
            {rule.severity}
          </span>
          <span className="text-sm text-gray-600">{rule.wcag}</span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {rule.title}
        </h1>
        
        <p className="text-xl text-gray-600">
          {rule.description}
        </p>
      </header>
      
      {/* Content Sections */}
      <article className="prose prose-lg max-w-none">
        {/* Why It Matters */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why It Matters</h2>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {rule.whyItMatters}
          </ReactMarkdown>
        </section>
        
        {/* How to Fix */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Fix</h2>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {rule.howToFix}
          </ReactMarkdown>
        </section>
        
        {/* Common Mistakes */}
        {rule.commonMistakes && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Mistakes</h2>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {rule.commonMistakes}
            </ReactMarkdown>
          </section>
        )}
        
        {/* Testing */}
        {rule.testing && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Testing</h2>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {rule.testing}
            </ReactMarkdown>
          </section>
        )}
      </article>
      
      {/* Resources */}
      {rule.resources && rule.resources.length > 0 && (
        <section className="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resources</h2>
          <ul className="space-y-2">
            {rule.resources.map((resource, index) => (
              <li key={index}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {resource.title} →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      
      {/* Related Rules - CLICKABLE */}
      {rule.relatedRules && rule.relatedRules.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Rules</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {rule.relatedRules.map((related) => (
              <Link
                key={related.ruleId}
                href={`/accessibility-rules/${related.ruleId}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <code className="text-sm text-blue-600 font-mono">
                      {related.ruleId}
                    </code>
                    <p className="text-sm text-gray-600 mt-1">
                      {related.description}
                    </p>
                  </div>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

## Step 4: Install Dependencies

```bash
npm install react-markdown remark-gfm react-syntax-highlighter
npm install --save-dev @types/react-syntax-highlighter
```

## Step 5: Update Tailwind Config (if needed)

**File: `tailwind.config.js`**

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // ... other paths
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // For prose classes
  ],
}
```

Install typography plugin:
```bash
npm install @tailwindcss/typography
```

## Features

### ✅ Rules Listing Page
- All rules displayed in cards
- Grouped by category (ARIA, Forms, Media, etc.)
- Severity badges with color coding
- Click any rule to see details
- Statistics showing total rules and counts by severity

### ✅ Rule Detail Page
- Full rule content with formatted markdown
- Syntax highlighted code examples
- Sections: Why It Matters, How to Fix, Common Mistakes, Testing
- External resources with links
- **Related rules as clickable cards** that navigate to those rules
- Back button to return to listing
- SEO-friendly metadata

### ✅ Related Rules Navigation
Related rules appear as clickable cards at the bottom of each rule detail page. When clicked, they navigate to that rule's detail page, allowing users to explore connected accessibility concepts.

## URL Structure

```
/accessibility-rules                    → List all rules
/accessibility-rules/link-name          → Link name rule detail
/accessibility-rules/aria-allowed-attr  → ARIA allowed attr rule detail
/accessibility-rules/video-caption      → Video caption rule detail
```

## Customization

### Change Styling
Modify Tailwind classes in the components to match your design system.

### Add Search/Filter
Add a search bar and filter controls to the listing page:

```tsx
'use client';

import { useState } from 'react';

function RulesWithSearch({ rules }) {
  const [search, setSearch] = useState('');
  
  const filtered = rules.filter(rule => 
    rule.title.toLowerCase().includes(search.toLowerCase()) ||
    rule.description.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <>
      <input
        type="search"
        placeholder="Search rules..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />
      {/* Render filtered rules */}
    </>
  );
}
```

### Add Breadcrumbs
```tsx
<nav className="text-sm text-gray-600 mb-4">
  <Link href="/">Home</Link>
  {' > '}
  <Link href="/accessibility-rules">Accessibility Rules</Link>
  {' > '}
  <span>{rule.title}</span>
</nav>
```

## SEO Benefits

- Each rule has its own URL
- Proper metadata for sharing
- Structured content with headings
- Internal linking between related rules
- Rich content for search engines
