import { MetadataRoute } from 'next'
import { SITE_URL } from './libs/metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
