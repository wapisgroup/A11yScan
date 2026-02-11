import { client } from '@/lib/sanity'
import { notFound } from 'next/navigation'
import { LoggedOutHeader } from '../components/organism/logged-out-header'
import { LoggedOutLayout } from '../components/organism/logged-out-layout'
import { LoggedOutFooter } from '../components/organism/logged-out-footer'
import { ComponentRenderer } from '../components/ComponentRenderer'
import { PageComponent } from '@/lib/types'
import { buildPageMetadata } from "../libs/metadata";

export const revalidate = 60

interface PageData {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  components: PageComponent[]
}

async function getPage(slug: string): Promise<PageData | null> {
  return client.fetch(
    `
    *[_type == "page" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
      _id,
      title,
      slug,
      description,
      components[] {
        _type,
        _key,
        title,
        subtitle,
        description,
        icon,
        features,
        ctaText,
        ctaLink,
        buttonText,
        buttonLink,
        variant,
        backgroundImage,
        badge,
        badgeVariant,
        alignment,
        noPadding,
        cta->{
          _id,
          _type,
          title,
          heading,
          description,
          primaryButtonText,
          primaryButtonLink,
          secondaryButtonText,
          secondaryButtonLink,
          footerText,
          variant
        },
        steps[] {
          _key,
          title,
          description
        },
        text,
        icon,
        numberOfColumns,
        columns[] {
          _key,
          components[] {
            _type,
            _key,
            title,
            description,
            icon,
            features,
            ctaText,
            ctaLink,
            buttonText,
            buttonLink,
            variant,
            text,
            badge,
            badgeVariant
          }
        },
        gap,
        backgroundColor,
        category->{
          _id,
          title,
          slug
        },
        limit,
        tiers[] {
          name,
          price,
          pricePeriod,
          description,
          badge,
          highlighted,
          features[] {
            text,
            included,
            emphasized
          },
          buttonText,
          buttonLink,
          buttonVariant
        },
        title,
        description,
        requireCompany,
        submitButtonText,
        successMessage,
        helperText,
        items[] {
          _key,
          title,
          description,
          icon,
          email,
          phone,
          customText
        },
        testimonials[] {
          _key,
          quote,
          name,
          title,
          company,
          avatar
        },
        logos[] {
          _key,
          name,
          url,
          alt,
          width,
          height
        },
        stats[] {
          _key,
          value,
          label,
          description,
          icon
        },
        size,
        headers,
        rows[] {
          _key,
          cells
        },
        table->{
          _id,
          _type,
          title,
          displayTitle,
          description,
          headers,
          rows[] {
            _key,
            cells
          }
        },
        ratio,
        leftColumn[]{
          ...,
          _type == 'ctaReference' => {
            cta->{_id, _type, title, heading, description, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, footerText, variant}
          },
          _type == 'tableReference' => {
            table->{_id, _type, title, displayTitle, description, headers, rows[]{_key, cells}}
          }
        },
        rightColumn[]{
          ...,
          _type == 'ctaReference' => {
            cta->{_id, _type, title, heading, description, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, footerText, variant}
          },
          _type == 'tableReference' => {
            table->{_id, _type, title, displayTitle, description, headers, rows[]{_key, cells}}
          }
        },
        htmlContent,
        components[] {
          _type,
          _key,
          title,
          subtitle,
          description,
          icon,
          features,
          withoutBackground,
          iconFirst,
          iconSize,
          ctaText,
          ctaLink,
          buttonText,
          buttonLink,
          variant,
          text,
          badge,
          badgeVariant,
          alignment,
          noPadding,
          cta->{
            _id,
            _type,
            title,
            heading,
            description,
            primaryButtonText,
            primaryButtonLink,
            secondaryButtonText,
            secondaryButtonLink,
            footerText,
            variant
          },
          steps[] {
            _key,
            title,
            description
          },
          category->{
            _id,
            title,
            slug
          },
          limit,
          requireCompany,
          submitButtonText,
          successMessage,
          helperText,
          items[] {
            _key,
            title,
            description,
            icon,
            email,
            phone,
            customText
          },
          testimonials[] {
            _key,
            quote,
            name,
            title,
            company,
            avatar
          },
          logos[] {
            _key,
            name,
            url,
            alt,
            width,
            height
          },
          stats[] {
            _key,
            value,
            label,
            description,
            icon
          },
          size,
          headers,
          rows[] {
            _key,
            cells
          },
          table->{
            _id,
            _type,
            title,
            displayTitle,
            description,
            headers,
            rows[] {
              _key,
              cells
            }
          },
          ratio,
          leftColumn[]{
            ...,
            _type == 'ctaReference' => {
              cta->{_id, _type, title, heading, description, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, footerText, variant}
            },
            _type == 'tableReference' => {
              table->{_id, _type, title, displayTitle, description, headers, rows[]{_key, cells}}
            }
          },
          rightColumn[]{
            ...,
            _type == 'ctaReference' => {
              cta->{_id, _type, title, heading, description, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, footerText, variant}
            },
            _type == 'tableReference' => {
              table->{_id, _type, title, displayTitle, description, headers, rows[]{_key, cells}}
            }
          },
          htmlContent,
          tiers[] {
            name,
            price,
            pricePeriod,
            description,
            badge,
            highlighted,
            features[] {
              text,
              included,
              emphasized
            },
            buttonText,
            buttonLink,
            buttonVariant
          },
          numberOfColumns,
          columns[] {
            _key,
            components[] {
              _type,
              _key,
              title,
              description,
              icon,
              features,
              withoutBackground,
              iconFirst,
              iconSize,
              ctaText,
              ctaLink,
              buttonText,
              buttonLink,
              variant,
              text,
              badge,
              badgeVariant,
              requireCompany,
              submitButtonText,
              successMessage,
              helperText,
              items[] {
                _key,
                title,
                description,
                icon,
                email,
                phone,
                customText
              }
            }
          }
        }
      }
    }
  `,
    { slug }
  )
}

// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
//   const { slug } = await params
//   const page = await getPage(slug)

//   if (!page) {
//     return buildPageMetadata({
//       title: "Page Not Found",
//       description: "The requested page could not be found.",
//       path: `/${slug}`
//     })
//   }

//   return buildPageMetadata({
//     title: page.title,
//     description: page.description,
//     path: `/${slug}`
//   })
// }

export async function generateStaticParams() {
  const pages: { slug: { current: string } }[] = await client.fetch(`
    *[_type == "page" && !(_id in path("drafts.**"))] { slug }
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
    description: page.description || page.title,
  }
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <LoggedOutLayout>
      <LoggedOutHeader />
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          {page.description && (
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {page.title}
              </h1>
              <p className="text-xl opacity-80 max-w-3xl mx-auto">
                {page.description}
              </p>
            </div>
          )}

          {/* Render Components */}
          <ComponentRenderer components={page.components} />
        </div>
      </div>
      <LoggedOutFooter />
    </LoggedOutLayout>
  )
}
