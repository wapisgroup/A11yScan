import type { Metadata } from "next";
import { buildPageMetadata } from "../libs/metadata";
import FeaturesClient from "./features-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Features",
  description: "Explore Ablelytics features for multi-engine scanning, reporting, monitoring, and developer automation.",
  path: "/features",
});

export default function FeaturesPage() {
  return <FeaturesClient />;
}
