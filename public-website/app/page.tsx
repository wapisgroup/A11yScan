import type { Metadata } from "next";
import { buildPageMetadata } from "./libs/metadata";
import HomeClient from "./home-client";
import { client } from "@/lib/sanity";
import { BlogPost } from "@/lib/types";

export const metadata: Metadata = buildPageMetadata({
  title: "Website Accessibility Built for Scale",
  description: "Automatically scan entire websites for WCAG compliance. Deliver professional reports, track progress, and ensure digital accessibility.",
  path: "/",
});

export const revalidate = 60;

async function getLatestBlogPosts(): Promise<BlogPost[]> {
  try {
    return await client.fetch(`
      *[_type == "post" && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...3] {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        readTime,
        "author": author->{ name, slug, image },
        mainImage,
        categories
      }
    `);
  } catch {
    return [];
  }
}

export default async function Home() {
  const blogPosts = await getLatestBlogPosts();
  return <HomeClient blogPosts={blogPosts} />;
}
