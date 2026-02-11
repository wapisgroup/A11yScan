import type { Metadata } from "next";

export const SITE_NAME = "Ablelytics";
export const SITE_URL = "https://www.ablelytics.com";
export const DEFAULT_DESCRIPTION = "Automated accessibility scanning with evidence-ready reporting across WCAG and beyond.";
export const DEFAULT_OG_IMAGE = "/ablelytics-meta-small.png";

type PageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  image?: string;
  type?: "website" | "article";
};

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = new URL(path, SITE_URL).toString();

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      type,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} social preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}

export function withTitlePostfix(pages: string[]): Metadata {
  return {
    title: [SITE_NAME, ...pages].join(" | "),
    description: DEFAULT_DESCRIPTION,
  };
}