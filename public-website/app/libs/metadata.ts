import type { Metadata } from "next";

const WEBSITE_TITLE = "Ablelytics - Website accessibility tool";

export function withTitlePostfix(pages: string[]): Metadata {
  return {
    title: [WEBSITE_TITLE, ...pages].join(" | "),
    description: WEBSITE_TITLE,
  };
}