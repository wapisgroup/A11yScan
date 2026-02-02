# Sanity CMS Integration Setup

## Overview
This project uses Sanity.io as a headless CMS for blog content and dynamic pages.

## Setup Steps

### 1. Create Sanity Project

Go to https://www.sanity.io and create a free account, then:

```bash
npm install -g @sanity/cli
sanity init
```

When prompted:
- Choose "Create new project"
- Project name: "A11yScan"
- Use default dataset: "production"
- Project template: "Clean project with no predefined schemas"

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Sanity project ID from https://www.sanity.io/manage

### 3. Create Sanity Studio

In a separate directory (or subdirectory), create your Sanity Studio:

```bash
cd sanity-studio
sanity install
```

### 4. Import Schemas

Copy the schema files from `/sanity-schemas/` directory to your Sanity Studio's `schemas/` folder.

### 5. Deploy Sanity Studio

```bash
sanity deploy
```

This will give you a URL like: `https://your-project.sanity.studio`

## Content Types

### Blog Post
- Title, slug, excerpt
- Author reference
- Main image
- Portable Text body
- Categories, publish date
- Read time

### Page (Dynamic)
- Title, slug, description
- Components array (flexible content blocks)

### Components
- **Feature Box**: Title, description, icon, feature list
- **Hero**: Title, subtitle, CTA button, background image
- **CTA**: Title, description, button
- **Two Column Layout**: Left/right column components

## API Usage

### Fetching Blog Posts

```typescript
import { client } from '@/lib/sanity'

const posts = await client.fetch(`
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, publishedAt,
    author->{name, image},
    mainImage
  }
`)
```

### Fetching Single Post

```typescript
const post = await client.fetch(`
  *[_type == "blogPost" && slug.current == $slug][0] {
    title, body, author->, publishedAt, mainImage
  }
`, { slug })
```

### Fetching Dynamic Page

```typescript
const page = await client.fetch(`
  *[_type == "page" && slug.current == $slug][0] {
    title, description, components[]
  }
`, { slug })
```

## Next.js Integration

All pages use **Incremental Static Regeneration (ISR)** with 60-second revalidation:

```typescript
export const revalidate = 60
```

This means:
- Pages are pre-rendered at build time
- Content updates appear within 60 seconds
- Fast page loads (static)
- Fresh content (automatic revalidation)

## Deployment

The site is deployed to Vercel with automatic ISR. When you publish content in Sanity, it will appear on the site within 60 seconds without rebuilding.

## Free Tier Limits

Sanity free tier includes:
- 3 admin users
- 500k API requests/month
- 10GB bandwidth
- 5GB assets storage

This is sufficient for most marketing sites.
