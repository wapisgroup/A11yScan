import type { Metadata } from "next";
import { buildPageMetadata } from "./libs/metadata";
import HomeClient from "./home-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Website Accessibility Built for Scale",
  description: "Automatically scan entire websites for WCAG compliance. Deliver professional reports, track progress, and ensure digital accessibility.",
  path: "/",
});

export default function Home() {
  return <HomeClient />;
}
