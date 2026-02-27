/**
 * ProjectsPage — Server Component.
 *
 * Fetches the project list from PostgreSQL via a Server Action,
 * then delegates all interactive UI to ProjectsPageClient.
 * No Firestore reads, no subscriptions.
 */
import { getProjects } from "@/actions/projects";
import { ProjectsPageClient } from "./projects-client";
import { PageWrapper } from "@/components/molecule/page-wrapper";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <PageWrapper title="Projects">
      <ProjectsPageClient initialProjects={projects} />
    </PageWrapper>
  );
}
