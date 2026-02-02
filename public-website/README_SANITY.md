# Sanity CMS Integration - Quick Start Guide

## ✅ What's Been Set Up

1. **Sanity Client** - Connected and ready (`lib/sanity.ts`)
2. **TypeScript Types** - All content types defined (`lib/types.ts`)
3. **Reusable Components** - FeatureBox, Hero, CTA, ComponentRenderer
4. **Blog System** - List page (`/blog`) and detail page (`/blog/[slug]`)
5. **Dynamic Pages** - Flexible page builder (`/pages/[slug]`)
6. **Sanity Schemas** - Ready to import into Sanity Studio

## 🚀 Next Steps to Go Live

### Step 1: Create Sanity Project (5 minutes)

1. Go to https://www.sanity.io and sign up (free)
2. Click "Create new project"
3. Name: "A11yScan" (or your choice)
4. Dataset: "production"
5. Copy your **Project ID**

### Step 2: Configure Environment

1. Create `.env.local` in `/public-website`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your project ID:
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

### Step 3: Set Up Sanity Studio (10 minutes)

Create a new directory for your Sanity Studio:

```bash
cd /Users/macbookpro/git/accessibility-checker
npm install -g @sanity/cli
sanity init
```

When prompted:
- Select "Yes" to an existing project
- Choose your project from the list
- Use default dataset: "production"
- Project output path: `a11yscan-studio`

### Step 4: Add Schemas to Studio

1. Navigate to your studio:
```bash
cd a11yscan-studio
```

2. Copy schema files from `/public-website/sanity-schemas/` to `/a11yscan-studio/schemaTypes/`

3. Update `sanity.config.ts` to import schemas:
```typescript
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import blogPost from './schemaTypes/blogPost'
import author from './schemaTypes/author'
import {featureBox, hero, cta, twoColumnLayout, page} from './schemaTypes/pageComponents'

export default defineConfig({
  name: 'default',
  title: 'A11yScan',
  projectId: 'your_project_id',
  dataset: 'production',
  plugins: [deskTool(), visionTool()],
  schema: {
    types: [
      author,
      blogPost,
      featureBox,
      hero,
      cta,
      twoColumnLayout,
      page,
    ],
  },
})
```

4. Start the studio:
```bash
npm run dev
```

### Step 5: Deploy Sanity Studio (2 minutes)

```bash
sanity deploy
```

You'll get a URL like: `https://your-project.sanity.studio`

### Step 6: Create Sample Content

1. Open your Sanity Studio (local or deployed URL)
2. Create an **Author** first:
   - Name: Your name
   - Slug: your-name
   - Upload image (optional)
   - Add bio

3. Create a **Blog Post**:
   - Title: "Getting Started with Web Accessibility"
   - Generate slug
   - Select author
   - Add excerpt
   - Write body content
   - Set publish date
   - Add categories: ["Accessibility", "Tutorial"]
   - Read time: 5

4. Publish the post (click Publish button)

### Step 7: Test Your Site

```bash
cd public-website
npm run dev
```

Visit:
- `http://localhost:3001/blog` - Should show your blog post!
- `http://localhost:3001/blog/getting-started-with-web-accessibility` - Post detail

## 📦 Component System Usage

### Creating a Dynamic Page in Sanity

1. Go to Sanity Studio
2. Create new "Page" document
3. Add components:
   - **Hero**: Big banner with title, subtitle, CTA
   - **Feature Box**: Title, description, icon, feature list
   - **CTA**: Call-to-action section
   - **Two Column Layout**: Organize components in 2 columns

Example page structure:
```
Page: "About Us"
└── Components:
    ├── Hero (title: "About A11yScan", subtitle: "Making the web accessible")
    ├── Two Column Layout
    │   ├── Left: Feature Box ("Our Mission")
    │   └── Right: Feature Box ("Our Values")
    └── CTA ("Start Your Free Trial")
```

4. Save and publish
5. Visit: `http://localhost:3001/pages/about-us`

## 🎨 Customizing Components

### Adding New Component Types

1. **Define Type** in `/lib/types.ts`:
```typescript
export interface TestimonialComponent {
  _type: 'testimonial'
  _key: string
  quote: string
  author: string
  company?: string
  image?: SanityImage
}
```

2. **Create Schema** in `/sanity-schemas/`:
```typescript
export const testimonial = {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'object',
  fields: [
    { name: 'quote', type: 'text' },
    { name: 'author', type: 'string' },
    { name: 'company', type: 'string' },
    { name: 'image', type: 'image' },
  ],
}
```

3. **Create Component** in `/app/components/Testimonial.tsx`:
```typescript
export function Testimonial({ data }: { data: TestimonialComponent }) {
  return (
    <div className="bg-white p-6 rounded-lg">
      <p className="text-gray-700 mb-4">"{data.quote}"</p>
      <div className="font-semibold">{data.author}</div>
      {data.company && <div className="text-sm text-gray-500">{data.company}</div>}
    </div>
  )
}
```

4. **Add to Renderer** in `ComponentRenderer.tsx`:
```typescript
case 'testimonial':
  return <Testimonial key={component._key} data={component} />
```

## 🔄 How ISR Works

Your site uses **Incremental Static Regeneration**:

1. **Build Time**: All pages pre-rendered
2. **Request**: User visits page → Gets static version (instant!)
3. **Background**: After 60 seconds, Next.js checks for updates
4. **Update**: If content changed in Sanity, page regenerates
5. **Next Request**: User gets updated page

**Benefits:**
- ⚡ Lightning-fast loads (static)
- 🔄 Fresh content (automatic updates)
- 💰 No need to rebuild entire site

## 🌐 Deployment

### Vercel (Recommended)

```bash
vercel
```

That's it! Vercel automatically:
- Detects Next.js
- Enables ISR
- Sets up edge caching
- Provides HTTPS

### Environment Variables in Vercel

Add these in Vercel dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

## 📚 Resources

- [Sanity Docs](https://www.sanity.io/docs)
- [Next.js ISR Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/revalidating)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
- [Portable Text](https://portabletext.org/)

## 🆘 Troubleshooting

### "Invalid project ID"
- Check `.env.local` has correct `NEXT_PUBLIC_SANITY_PROJECT_ID`
- Restart dev server after changing `.env.local`

### "No blog posts showing"
- Verify content is published in Sanity Studio (not just saved as draft)
- Check browser console for errors
- Test Sanity query in Vision tool (in Studio)

### "Component not rendering"
- Check component `_type` matches case statement in ComponentRenderer
- Verify schema is added to Sanity Studio
- Check browser console for warnings

## 🎉 What You've Built

✅ Blog with rich text editor
✅ Dynamic page builder
✅ Flexible component system
✅ ISR for fast, fresh content
✅ Type-safe with TypeScript
✅ Free Sanity CMS
✅ Ready for production

Need help? Check SANITY_SETUP.md for detailed API reference.
