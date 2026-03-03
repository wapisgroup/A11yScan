/**
 * ProjectsPage — Server Component.
 *
 * Fetches the project list from PostgreSQL via a Server Action,
 * then delegates all interactive UI to ProjectsPageClient.
 * No Firestore reads, no subscriptions.
 */
import { getProjectCreateLimitInfo, getProjects } from "@/actions/projects";
import { ProjectsPageClient } from "./projects-client";
import { PageWrapper } from "@/components/molecule/page-wrapper";

export default async function ProjectsPage() {
  const [projects, projectLimit] = await Promise.all([
    getProjects(),
    getProjectCreateLimitInfo(),
  ]);

  return (
    <PageWrapper title="Projects">
      <ProjectsPageClient initialProjects={projects} projectLimit={projectLimit} />
    </PageWrapper>
  );
}
