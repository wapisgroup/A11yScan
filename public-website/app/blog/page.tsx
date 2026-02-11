import { client } from '@/lib/sanity'
import { BlogPost } from '@/lib/types'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import { LoggedOutHeader } from '../components/organism/logged-out-header'
import { LoggedOutLayout } from '../components/organism/logged-out-layout'
import { LoggedOutFooter } from '../components/organism/logged-out-footer'
import { buildPageMetadata } from "../libs/metadata";

export const revalidate = 60

export const metadata = buildPageMetadata({
  title: "Blog",
  description:
    "Insights, tutorials, and updates about web accessibility and compliance.",
  path: "/blog"
});

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    return await client.fetch(`
      *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        readTime,
        "author": author->{
          name,
          slug,
          image
        },
        mainImage,
        categories
      }
    `)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog
            </h1>
            <p className="text-xl opacity-80">
              Insights, tutorials, and updates about web accessibility
            </p>
          </div>

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="opacity-70">
                No blog posts yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const imageUrl = post.mainImage
                  ? urlFor(post.mainImage).width(600).height(400).url()
                  : null

                const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })

                return (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug.current}`}
                    className="group bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all"
                  >
                    {/* Image */}
                    {imageUrl && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={post.mainImage?.alt || post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      {/* Categories */}
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.categories.slice(0, 2).map((category) => (
                            <span
                              key={category}
                              className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="opacity-80 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-sm opacity-60">
                        <div className="flex items-center gap-2">
                          {post.author?.image && (
                            <img
                              src={urlFor(post.author.image).width(32).height(32).url()}
                              alt={post.author.name}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span>{post.author?.name || 'Anonymous'}</span>
                        </div>
                        {post.readTime && (
                          <span>{post.readTime} min read</span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="text-sm opacity-60 mt-2">
                        {formattedDate}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <LoggedOutFooter />
    </LoggedOutLayout>
  )
}
