import { client, urlFor } from '@/lib/sanity'
import { BlogPost } from '@/lib/types'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LoggedOutHeader } from '../../components/organism/logged-out-header'
import { LoggedOutLayout } from '../../components/organism/logged-out-layout'
import { LoggedOutFooter } from '../../components/organism/logged-out-footer'

export const revalidate = 60

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return client.fetch(
    `
    *[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      readTime,
      "author": author->{
        name,
        slug,
        image,
        bio
      },
      mainImage,
      body,
      categories
    }
  `,
    { slug }
  )
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const posts: { slug: { current: string } }[] = await client.fetch(`
    *[_type == "post" && !(_id in path("drafts.**"))] { slug }
  `)

  return posts.map((post) => ({
    slug: post.slug.current,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
  }
}

// Portable Text components for rich text rendering
const portableTextComponents = {
  types: {
    image: ({ value }: any) => {
      const imageUrl = urlFor(value).width(800).url()
      return (
        <div className="my-8">
          <img
            src={imageUrl}
            alt={value.alt || ''}
            className="rounded-lg w-full"
          />
        </div>
      )
    },
    code: ({ value }: any) => {
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
          <code>{value.code}</code>
        </pre>
      )
    },
  },
  block: {
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold mt-8 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-bold mt-6 mb-3">
        {children}
      </h3>
    ),
    normal: ({ children }: any) => (
      <p className="mb-4 leading-relaxed opacity-90">
        {children}
      </p>
    ),
  },
  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        className="text-blue-600 hover:text-blue-700 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(600).url()
    : null

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <div className="min-h-screen py-12 px-4">
        <article className="max-w-4xl mx-auto">
          {/* Back to blog */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8"
          >
            ← Back to Blog
          </Link>

        {/* Header */}
        <header className="mb-8">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((category) => (
                <span
                  key={category}
                  className="text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl opacity-80 mb-6">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 opacity-70">
            {post.author?.image && (
              <img
                src={urlFor(post.author.image).width(48).height(48).url()}
                alt={post.author.name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <div className="font-semibold">
                {post.author?.name || 'Anonymous'}
              </div>
              <div className="text-sm">
                {formattedDate}
                {post.readTime && ` · ${post.readTime} min read`}
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {imageUrl && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              className="w-full"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 md:p-12 prose prose-lg max-w-none">
          <PortableText value={post.body} components={portableTextComponents} />
        </div>

        {/* Author Bio */}
        {post.author?.bio && (
          <div className="mt-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 border-l-4 border-l-blue-500">
            <h3 className="text-xl font-bold mb-2">
              About the Author
            </h3>
            <div className="flex items-start gap-4">
              {post.author.image && (
                <img
                  src={urlFor(post.author.image).width(64).height(64).url()}
                  alt={post.author.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <div className="font-semibold mb-1">
                  {post.author.name}
                </div>
                <p className="opacity-80">
                  {post.author.bio}
                </p>
              </div>
            </div>
          </div>
        )}
        </article>
      </div>
      <LoggedOutFooter />
    </LoggedOutLayout>
  )
}
