/**
 * FAQ Data Import Script for Sanity
 * 
 * This script imports FAQ items into your Sanity dataset.
 * 
 * To use:
 * 1. Make sure you're in the public-website directory
 * 2. Run: npx sanity exec scripts/import-faqs.ts --with-user-token
 * 
 * Or from the root:
 * cd public-website && npx sanity exec scripts/import-faqs.ts --with-user-token
 */

import { getCliClient } from 'sanity/cli'

const FAQ_DATA = [
  {
    category: 'General',
    question: 'What is A11yScan and who is it for?',
    answer: 'A11yScan is an automated website accessibility scanner that crawls whole sites using a headless Chrome runtime, runs up-to-date accessibility rules, and produces shareable PDF reports. It is built for product teams, agencies, QA teams and accessibility leads who want repeatable, auditable scans.',
    order: 1,
  },
  {
    category: 'General',
    question: 'Can A11yScan replace a full manual accessibility audit?',
    answer: 'Automated scanners catch many programmatic issues (missing alt text, ARIA problems, keyboard focus, contrast). They reduce manual effort but do not fully replace a human audit for contextual, cognitive or real assistive-technology testing. Use A11yScan to triage and reduce the scope of manual audits.',
    order: 2,
  },
  {
    category: 'General',
    question: 'What accessibility standards does A11yScan test against?',
    answer: 'A11yScan tests against WCAG 2.1 standards at Level A, AA, and AAA. Our scanner uses the industry-standard Axe-core engine with 90+ automated accessibility rules covering color contrast, keyboard navigation, ARIA usage, and more.',
    order: 3,
  },
  {
    category: 'Scanning',
    question: 'How do I start a scan?',
    answer: 'Create a project with the domain you want scanned and click the Run button. Scans run server-side; you can watch live progress in the Runs / Reports area. For private sites you can deploy the worker inside your network or use a secure tunnel.',
    order: 4,
  },
  {
    category: 'Scanning',
    question: 'Does the crawler respect robots.txt and rate limits?',
    answer: 'Yes. The crawler respects robots.txt by default and supports polite throttling, configurable delays and max pages to avoid overloading the target site.',
    order: 5,
  },
  {
    category: 'Scanning',
    question: 'How long does a typical scan take?',
    answer: 'Scan time depends on the number of pages and site complexity. On average, scanning 100 pages takes 15-30 minutes. You can configure crawl depth, page limits, and throttling to optimize scan time for your needs.',
    order: 6,
  },
  {
    category: 'Scanning',
    question: 'Can I scan password-protected or staging sites?',
    answer: 'Yes. For private sites, you can deploy the worker inside your network, use a secure tunnel, or configure authentication headers. Contact support for setup guidance on scanning authenticated areas.',
    order: 7,
  },
  {
    category: 'Scanning',
    question: 'Does A11yScan work with JavaScript frameworks like React or Vue?',
    answer: 'Absolutely. A11yScan uses a real Chrome browser with Puppeteer, which fully executes JavaScript and waits for dynamic content to load. It tests the final rendered DOM, making it perfect for SPAs and modern web frameworks.',
    order: 8,
  },
  {
    category: 'Reports',
    question: 'What is included in the PDF report?',
    answer: 'PDF reports include a summary page with severity counts, a rule-based grouping of errors with occurrence counts, and per-page details. You can add your logo and test metadata. Reports are styled for client presentation.',
    order: 9,
  },
  {
    category: 'Reports',
    question: 'Can I download raw JSON or share reports programmatically?',
    answer: 'Yes — every report has downloadable JSON and PDF artifacts. You can also integrate uploads to cloud storage or call webhooks after a run to automate downstream workflows.',
    order: 10,
  },
  {
    category: 'Reports',
    question: 'Can I customize the branding on reports?',
    answer: 'Yes! You can add your company logo, customize colors, and add metadata to reports. This makes them perfect for sharing with clients or stakeholders as professional, branded documents.',
    order: 11,
  },
  {
    category: 'Privacy & Security',
    question: 'Where are reports stored and how is sensitive data handled?',
    answer: 'Reports are stored in your configured storage (e.g., Firebase Storage) or can be exported locally. Screenshots and HTML artifacts are optional — you can toggle what to save to minimise data retention. Access is controlled via your project IAM and authentication.',
    order: 12,
  },
  {
    category: 'Privacy & Security',
    question: 'Is my website data secure during scans?',
    answer: 'Yes. Scans run in isolated environments, and all data is encrypted in transit and at rest. We never store credentials or sensitive form data. You have full control over what artifacts (screenshots, HTML) are saved.',
    order: 13,
  },
  {
    category: 'Billing & Pricing',
    question: 'Do you offer an agency or enterprise plan?',
    answer: 'Yes. The Agency plan includes private deployments, SSO, white-label reports and priority support. Contact sales to discuss pricing and deployment options.',
    order: 14,
  },
  {
    category: 'Billing & Pricing',
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a 14-day free trial with no credit card required. You can cancel anytime. The trial includes full access to all features so you can test A11yScan on your real projects.',
    order: 15,
  },
  {
    category: 'Billing & Pricing',
    question: 'What happens if I exceed my plan limits?',
    answer: 'If you approach your plan limits, we\'ll notify you via email. You can upgrade your plan at any time, or scans will pause until the next billing cycle. We never charge overage fees without your explicit approval.',
    order: 16,
  },
  {
    category: 'Integrations',
    question: 'Can I connect A11yScan to Jira, Slack or CI pipelines?',
    answer: 'Absolutely — use webhooks, cloud functions or the API to post results, create tickets, or trigger CI jobs. We can provide sample templates for common integrations.',
    order: 17,
  },
  {
    category: 'Integrations',
    question: 'Can I schedule automated scans?',
    answer: 'Yes. You can set up recurring scans daily, weekly, or after deployments. Schedule scans to run automatically and receive notifications when issues are detected or when scans complete.',
    order: 18,
  },
  {
    category: 'Integrations',
    question: 'Does A11yScan have an API?',
    answer: 'Yes. A11yScan provides a RESTful API for triggering scans, retrieving results, and managing projects programmatically. This makes it easy to integrate into your existing CI/CD workflows and development processes.',
    order: 19,
  },
  {
    category: 'Technical',
    question: 'What browsers and devices does A11yScan test?',
    answer: 'A11yScan uses headless Chrome for testing, which covers the majority of web users. While it doesn\'t test across all browsers, the accessibility rules it checks are standards-based and apply universally across browsers.',
    order: 20,
  },
  {
    category: 'Technical',
    question: 'Can I create custom page sets for targeted testing?',
    answer: 'Yes. You can group specific pages into custom page sets to test critical user flows or specific sections of your site separately. This is useful for focused testing of checkout flows, forms, or key landing pages.',
    order: 21,
  },
]

// Category definitions
const CATEGORIES = [
  { title: 'General', slug: 'general', description: 'General information about A11yScan' },
  { title: 'Scanning', slug: 'scanning', description: 'Questions about running scans and crawling websites' },
  { title: 'Reports', slug: 'reports', description: 'Information about accessibility reports and exports' },
  { title: 'Privacy & Security', slug: 'privacy-security', description: 'Data privacy and security information' },
  { title: 'Billing & Pricing', slug: 'billing-pricing', description: 'Pricing plans and billing questions' },
  { title: 'Integrations', slug: 'integrations', description: 'Third-party integrations and automation' },
  { title: 'Technical', slug: 'technical', description: 'Technical details and capabilities' },
]

const importFAQs = async () => {
  const client = getCliClient()
  
  console.log('🚀 Starting FAQ import...\n')

  try {
    // Step 1: Create categories
    console.log('📁 Creating categories...')
    const categoryMap: Record<string, string> = {}
    
    for (const cat of CATEGORIES) {
      const categoryDoc = {
        _type: 'faqCategory',
        title: cat.title,
        slug: { _type: 'slug', current: cat.slug },
        description: cat.description,
      }

      const result = await client.create(categoryDoc)
      categoryMap[cat.title] = result._id
      console.log(`  ✓ Created category: ${cat.title}`)
    }

    console.log(`\n✅ Created ${CATEGORIES.length} categories\n`)

    // Step 2: Create FAQs
    console.log('❓ Creating FAQ items...')
    
    for (const faq of FAQ_DATA) {
      const faqDoc = {
        _type: 'faq',
        question: faq.question,
        answer: faq.answer,
        category: {
          _type: 'reference',
          _ref: categoryMap[faq.category],
        },
        order: faq.order,
        publishedAt: new Date().toISOString(),
      }

      await client.create(faqDoc)
      console.log(`  ✓ Created FAQ #${faq.order}: ${faq.question.substring(0, 50)}...`)
    }

    console.log(`\n✅ Successfully imported ${FAQ_DATA.length} FAQ items!\n`)
    console.log('🎉 Import complete! Check your Sanity Studio to see the FAQs.\n')
    
  } catch (error) {
    console.error('❌ Error during import:', error)
    throw error
  }
}

importFAQs()
