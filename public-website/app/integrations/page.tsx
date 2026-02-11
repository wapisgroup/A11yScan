import type { Metadata } from "next";
import { buildPageMetadata } from "../libs/metadata";
import IntegrationsClient from "./integrations-client";

export const metadata: Metadata = buildPageMetadata({
  title: "Integrations",
  description: "Connect Ablelytics with your workflow, alerts, and automation tools.",
  path: "/integrations",
});

export default function IntegrationsPage() {
  return <IntegrationsClient />;
}
