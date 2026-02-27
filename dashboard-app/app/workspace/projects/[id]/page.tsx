/**
 * ProjectDetailPage — Server Component.
 *
 * Fetches the project from PostgreSQL via a Server Action,
 * then delegates all interactive UI to ProjectDetailClient.
 */
import { notFound } from "next/navigation";
import { getProject } from "@/actions/projects";
import { ProjectDetailClient } from "./project-detail-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
