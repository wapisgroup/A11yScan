import { db, auth } from "@/utils/firebase";
import {
  doc,
  getDoc,
  type DocumentData,
  type Timestamp,
} from '@/utils/firestore-read-tracker';
import type { Project } from "@/types/project";

const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

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
  const stats = (data.projectStats ?? data.stats ?? {}) as Record<string, unknown>;
  const hasProjectStats =
    stats.pagesTotal !== undefined ||
    stats.pagesScanned !== undefined ||
    stats.pages404 !== undefined ||
    stats.critical !== undefined ||
    stats.serious !== undefined ||
    stats.moderate !== undefined ||
    stats.minor !== undefined;

  return {
    id: snap.id,
    name: (data.name ?? null) as string | null,
    domain: String(data.domain ?? ""),
    owner: (data.owner ?? null) as string | null,
    createdAt: (data.createdAt ?? null) as Timestamp | Date | null,
    sitemapUrl: (data.sitemapUrl ?? null) as string | null,
    sitemapTreeUrl: (data.sitemapTreeUrl ?? null) as string | null,
    sitemapGraphUrl: (data.sitemapGraphUrl ?? null) as string | null,
    projectStats: hasProjectStats
      ? {
        pagesTotal: toSafeNumber(stats.pagesTotal),
        pagesScanned: toSafeNumber(stats.pagesScanned),
        pages404: toSafeNumber(stats.pages404),
        critical: toSafeNumber(stats.critical),
        serious: toSafeNumber(stats.serious),
        moderate: toSafeNumber(stats.moderate),
        minor: toSafeNumber(stats.minor),
        updatedAt: stats.updatedAt ?? null,
      }
      : null,
  } as Project;
}

export type MessageResult = {
  title: string;
  message: string;
  noPages?: boolean;
};

export const startPageCollection = async (projectId: string): Promise<MessageResult> => {
  if (!projectId) {
    return {
      title: "System exception",
      message: "Unknown project id",
    };
  }

  try {
    // Get authentication token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const token = await currentUser.getIdToken();

    // Call the new API route
    const response = await fetch('/api/page-collection/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start page collection');
    }

    const result = await response.json();

    return {
      title: "Information",
      message: result.message || "Page collection started successfully",
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const token = await currentUser.getIdToken();

    const response = await fetch('/api/pages/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId,
        pagesIds: [page.id],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to scan page');
    }

    return {
      title: "Information",
      message: "Page scan queued",
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
export async function startFullScan(
  projectId: string,
  options?: { includePageCollection?: boolean }
): Promise<MessageResult> {
  if (!projectId) {
    return {
      title: "System exception",
      message: "Unknown project id",
    };
  }

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const token = await currentUser.getIdToken();

    const response = await fetch('/api/scans/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId,
        type: "full_scan",
        includePageCollection: Boolean(options?.includePageCollection),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // API signals "no pages yet" — caller shows the NoPagesScanModal
      if (error.noPages) {
        return { title: "No pages", message: error.message || "No pages found.", noPages: true };
      }
      throw new Error(error.message || 'Failed to start scan');
    }

    const res = await response.json();

    const serverMessage = res.message || "";
    const noPages =
      Boolean(
        res &&
          typeof res === "object" &&
          ("noPages" in res
            ? (res as Record<string, unknown>).noPages
            : false)
      );

    return {
      title: "Information",
      message: serverMessage || (noPages ? "No pages found for this project" : "Full scan started"),
      noPages,
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const token = await currentUser.getIdToken();

    const response = await fetch('/api/sitemap/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start sitemap generation');
    }

    return {
      title: "Information",
      message: "Sitemap generation started",
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
