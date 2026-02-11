import DevelopersClient from "./developers-client";
import { buildPageMetadata } from "@/app/libs/metadata";

export const metadata = buildPageMetadata({
  title: "Developer Accessibility Testing",
  description:
    "Integrate accessibility scanning into CI/CD with API access, webhooks, and dev-friendly reports.",
  path: "/solutions/developers"
});

export default function DevelopersSolutionPage() {
  return <DevelopersClient />;
}
