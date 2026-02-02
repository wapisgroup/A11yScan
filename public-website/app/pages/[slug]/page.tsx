import { client } from '@/lib/sanity'
import { Page } from '@/lib/types'
import { ComponentRenderer } from '@/app/components/ComponentRenderer'
import { notFound } from 'next/navigation'

export const revalidate = 60

async function getPage(slug: string): Promise<Page | null> {
  return client.fetch(
    `
    *[_type == "page" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description,
      components[]
    }
  `,
    { slug }
  )
}

// Generate static paths for all dynamic pages
export async function generateStaticParams() {
  const pages: { slug: { current: string } }[] = await client.fetch(`
    *[_type == "page"] { slug }
  `)

  return pages.map((page) => ({
    slug: page.slug.current,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: page.title,
    description: page.description || '',
  }
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {page.description}
            </p>
          )}
        </div>

        {/* Dynamic Components */}
        {page.components && <ComponentRenderer components={page.components} />}
      </div>
    </div>
  )
}
