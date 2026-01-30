import { callServerFunction } from "@/services/serverService";
import { db } from "@/utils/firebase";
import {
  doc,
  getDoc,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import type { Project } from "@lib/types/project";

/**
 * Loads a single project document by id.
 *
 * @param id - Firestore document id of the project.
 * @throws if id is missing or the project does not exist.
 */
export async function loadProject(id: string): Promise<Project> {
  if (!id) throw new Error("projectId is required");

  const ref = doc(db, "projects", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error(`Project not found: ${id}`);
  }

  const data = snap.data() as DocumentData;
  return {
    id: snap.id,
    name: (data.name ?? null) as string | null,
    domain: String(data.domain ?? ""),
    owner: (data.owner ?? null) as string | null,
    createdAt: (data.createdAt ?? null) as Timestamp | Date | null,
    sitemapUrl: (data.sitemapUrl ?? null) as string | null,
    sitemapTreeUrl: (data.sitemapTreeUrl ?? null) as string | null,
    sitemapGraphUrl: (data.sitemapGraphUrl ?? null) as string | null,
  } as Project;
}

export type MessageResult = {
  title: string;
  message: string;
};

export const startPageCollection = async (projectId: string): Promise<MessageResult> => {
  if (!projectId) {
    return {
      title: "System exception",
      message: "Unknown project id",
    };
  }

  try {
    const payload = { projectId };

    // Expected to return something like { ok: true, runId: string }.
    // We keep this flexible since emulator/prod responses may differ.
    const res = await callServerFunction("startPageCollection", payload);

    // Prefer a server-provided message if available.
    const serverMessage =
      res && typeof res === "object" && "message" in res
        ? String((res as Record<string, unknown>).message ?? "")
        : "";

    return {
      title: "Information",
      message: serverMessage || "Sitemap generation started",
    };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);

    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: "System exception",
      message: "Failed to start page collection: " + msg,
    };
  }
};

/**
 * Minimal shape of a page document required to run a scan.
 *
 * The caller typically passes a PageTDO/PageDoc from Firestore.
 */
export type ScanPageInput = {
  id: string;
  url?: string | null;
  title?: string | null;
  [key: string]: unknown;
};

/**
 * scanSinglePage
 * -------------
 * Queues a scan for a single page by calling the backend function `scanPage`.
 *
 * Notes:
 * - This function is intentionally side-effect free (no alert/toast).
 * - The UI layer decides how to present the returned MessageResult.
 */
export async function scanSinglePage(
  projectId: string,
  page: ScanPageInput
): Promise<MessageResult> {
  if (!projectId) {
    return {
      title: "System exception",
      message: "Unknown project id",
    };
  }

  if (!page || !page.id) {
    return {
      title: "System exception",
      message: "Unknown page",
    };
  }

  try {
    // The backend expects `pagesIds` (array) even for a single page.
    const res = await callServerFunction("scanPage", {
      projectId,
      pagesIds: [page.id],
    });

    const serverMessage =
      res && typeof res === "object" && "message" in res
        ? String((res as Record<string, unknown>).message ?? "")
        : "";

    return {
      title: "Information",
      message: serverMessage || "Page scan queued",
    };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);

    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: "System exception",
      message: "Failed to scan page: " + msg,
    };
  }
}

/**
 * startFullScan
 * -------------
 * Queues a full scan for a project by calling the backend function `startScan`.
 *
 * Notes:
 * - This function is intentionally side-effect free (no alert/toast).
 * - The UI layer decides how to present the returned MessageResult.
 */
export async function startFullScan(projectId: string): Promise<MessageResult> {
  if (!projectId) {
    return {
      title: "System exception",
      message: "Unknown project id",
    };
  }

  try {
    const payload = { projectId, type: "full_scan" };
    const res = await callServerFunction("startScan", payload);

    const serverMessage =
      res && typeof res === "object" && "message" in res
        ? String((res as Record<string, unknown>).message ?? "")
        : "";

    return {
      title: "Information",
      message: serverMessage || "Full scan started",
    };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);

    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: "System exception",
      message: "Failed to start full scan: " + msg,
    };
  }
}

/**
 * startSitemap
 * ------------
 * Starts sitemap generation for a project by calling the backend function `startSitemap`.
 *
 * Notes:
 * - This function is intentionally side-effect free (no alert/toast).
 * - The UI layer decides how to present the returned MessageResult.
 */
export async function startSitemap(projectId: string): Promise<MessageResult> {
  if (!projectId) {
    return {
      title: "System exception",
      message: "Unknown project id",
    };
  }

  try {
    const payload = { projectId };
    const res = await callServerFunction("startSitemap", payload);

    const serverMessage =
      res && typeof res === "object" && "message" in res
        ? String((res as Record<string, unknown>).message ?? "")
        : "";

    return {
      title: "Information",
      message: serverMessage || "Sitemap generation started",
    };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error(err);

    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: "System exception",
      message: "Failed to start sitemap: " + msg,
    };
  }
}