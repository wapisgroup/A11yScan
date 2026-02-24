import { MetadataRoute } from 'next'
import path from 'path'
import { AccessibilityRulesService } from '@wapisgroup/accessibility-rules'
import { client } from '@/lib/sanity'
import { SITE_URL } from './libs/metadata'

const rulesDirectory = path.join(
  process.cwd(),
  'node_modules/@wapisgroup/accessibility-rules/rules'
)
const rulesService = new AccessibilityRulesService(rulesDirectory)

// Static routes for the website
const staticRoutes = [
  '',
  '/features/',
  '/pricing/',
  '/why-accessibility/',
  '/solutions/',
  '/integrations/',
  '/blog/',
  '/guides/',
  '/faqs/',
  '/contact/',
  '/accessibility-rules/',
  '/login/',
  '/signup/',
  '/privacy/',
  '/terms/',
  '/cookies/',
]

// Static guides
const guideRoutes = [
  '/guides/getting-started/',
  '/guides/scan-configuration/',
  '/guides/interpreting-results/',
  '/guides/reporting-and-evidence/',
  '/guides/ai-fix-suggestions/',
  '/guides/team-collaboration/',
  '/guides/wcag-compliance-workflows/',
  '/guides/enterprise-integrations/',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch blog posts from Sanity
  const blogPosts = await client.fetch<Array<{ slug: { current: string }, publishedAt: string }>>(
    `*[_type == "post" && !(_id in path("drafts.**"))] {
      "slug": slug.current,
      publishedAt
    }`
  )

  // Fetch individual accessibility rule pages
  let rulePages: MetadataRoute.Sitemap = []
  try {
    const rules = await rulesService.getAllRules()
    rulePages = rules.map(rule => ({
      url: `${SITE_URL}/accessibility-rules/${rule.ruleId}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {
    // If rules can't be loaded, skip — don't break the whole sitemap
  }

  // Map static routes
  const staticPages: MetadataRoute.Sitemap = staticRoutes.map(route => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }))

  // Map guide pages
  const guidePages: MetadataRoute.Sitemap = guideRoutes.map(route => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Map blog posts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map(post => ({
    url: `${SITE_URL}/blog/${post.slug}/`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...guidePages, ...rulePages, ...blogPages]
}
