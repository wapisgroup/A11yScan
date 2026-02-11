import type { Metadata } from "next";
import { buildPageMetadata } from "../../libs/metadata";
import ComplianceClient from "./compliance-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Compliance Solutions",
  description: "Audit-ready reporting, evidence, and workflows for WCAG and regulatory compliance.",
  path: "/solutions/compliance",
});

export default function ComplianceSolutionPage() {
  return <ComplianceClient />;
}
