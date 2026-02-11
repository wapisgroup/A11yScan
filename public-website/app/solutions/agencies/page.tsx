import AgenciesClient from "./agencies-client";
import { buildPageMetadata } from "@/app/libs/metadata";

export const metadata = buildPageMetadata({
    title: "Agency Accessibility Audits",
    description:
        "White-label accessibility reports, bulk scanning, and automated monitoring for agencies and consultants.",
    path: "/solutions/agencies"
});

export default function AgenciesSolutionPage() {
    return <AgenciesClient />;
}
