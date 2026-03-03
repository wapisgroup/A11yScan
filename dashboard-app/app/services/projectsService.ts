/**
 * projectsService
 * --------------
 * Client-facing service for project CRUD and scan trigger operations.
 * Uses PostgreSQL-backed API routes (Auth.js session cookie auth).
 */

export function validateUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const urlToTest =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
}

export function generateNameFromUrl(url: string): string {
  if (!url) return "";
  try {
    const urlToTest =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    const hostname = new URL(urlToTest).hostname.replace(/^www\./, "");
    return hostname
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "";
  }
}

export type Project = {
  id: string;
  name: string | null;
  domain: string;
  owner: string | null;
  organisationId?: string | null;
  createdAt?: Date | null;
  lastScanAt?: Date | null;
};

export type ProjectConfig = {
  maxPages?: number;
  crawlDelayMs?: number;
  robotsRespect?: boolean;
  storeArtifacts?: boolean;
  complianceProfiles?: string[];
};

export type CreateProjectInput = {
  name?: string;
  domain: string;
  config?: ProjectConfig;
};

export type UpdateProjectInput = {
  id: string;
  name: string | null;
  domain: string;
};

type Unsubscribe = () => void;

function mapProject(data: {
  id: string;
  name: string | null;
  domain: string;
  owner: string | null;
  organisationId?: string | null;
  createdAt?: string | Date | null;
  lastScanAt?: string | Date | null;
}): Project {
  return {
    id: data.id,
    name: data.name,
    domain: data.domain,
    owner: data.owner,
    organisationId: data.organisationId ?? null,
    createdAt: data.createdAt ? new Date(data.createdAt) : null,
    lastScanAt: data.lastScanAt ? new Date(data.lastScanAt) : null,
  };
}

export async function loadProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401) return [];
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.error as string) || `Failed to load projects (${response.status})`);
  }

  const rows = (await response.json()) as Array<{
    id: string;
    name: string | null;
    domain: string;
    owner: string | null;
    organisationId?: string | null;
    createdAt?: string | Date | null;
    lastScanAt?: string | Date | null;
  }>;

  return rows.map(mapProject);
}

export async function isUrlUnique(url: string, excludeProjectId?: string): Promise<boolean> {
  const normalizedUrl = url.toLowerCase().trim();
  const projects = await loadProjects();

  return !projects.some((project) => {
    if (excludeProjectId && project.id === excludeProjectId) return false;
    return String(project.domain ?? "").toLowerCase().trim() === normalizedUrl;
  });
}

export function subscribeProjects(
  onNext: (projects: Project[]) => void,
  onError?: (err: unknown) => void,
  _organisationId?: string | null
): Unsubscribe {
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = async () => {
    if (stopped) return;
    try {
      const projects = await loadProjects();
      if (!stopped) onNext(projects);
    } catch (error) {
      if (!stopped && onError) onError(error);
    }
  };

  void emit();
  timer = setInterval(() => {
    void emit();
  }, 10_000);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

export async function createProject({ name, domain, config }: CreateProjectInput): Promise<Project> {
  if (!validateUrl(domain)) {
    throw new Error("Invalid URL address. Please provide a valid URL.");
  }

  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, domain, config }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.status === 401) {
      throw new Error("Not authenticated");
    }

    if (err.error === "LIMIT_REACHED") {
      const limit = Number(err.limit ?? 0);
      throw new Error(
        `You've reached your plan's limit of ${limit} active project${limit === 1 ? "" : "s"}. Upgrade your plan to create more projects.`
      );
    }

    throw new Error((err.error as string) || `Failed to create project (${response.status})`);
  }

  const data = (await response.json()) as {
    id: string;
    name: string | null;
    domain: string;
    owner: string;
    organisationId: string | null;
  };

  return {
    id: data.id,
    name: data.name,
    domain: data.domain,
    owner: data.owner,
    organisationId: data.organisationId ?? null,
    createdAt: null,
  };
}

export async function updateProject(project: UpdateProjectInput): Promise<void> {
  if (!project?.id) throw new Error("project.id required");
  if (!project.name?.trim()) {
    throw new Error("Project name cannot be empty.");
  }

  const response = await fetch(`/api/projects/${project.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: project.name.trim() }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.error as string) || `Failed to update project (${response.status})`);
  }
}

export async function deleteProject(id: string): Promise<void> {
  if (!id) throw new Error("id required");

  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((err.error as string) || `Failed to delete project (${response.status})`);
  }
}

export async function startProjectScan(project: Pick<Project, "id" | "domain">): Promise<string> {
  if (!project?.id) throw new Error("project.id required");

  const response = await fetch("/api/page-collection/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectId: project.id }),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error((error.message as string) || `Failed to start page collection (${response.status})`);
  }

  const result = (await response.json()) as { runId?: string | null };
  return result.runId ?? "unknown";
}
