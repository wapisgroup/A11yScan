import type { Metadata } from "next";
import { buildPageMetadata } from "../libs/metadata";
import WhyAccessibilityClient from "./why-accessibility-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Why Accessibility",
  description: "The business, legal, and human case for accessible websites.",
  path: "/why-accessibility",
});

export default function WhyAccessibilityPage() {
  return <WhyAccessibilityClient />;
}
