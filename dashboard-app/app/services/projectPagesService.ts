import { startScanPages } from "@/actions/job-triggers";

export type RunSelectedPagesResult = {
  title: string;
  message: string;
};

/**
 * Starts a scan for selected pages via PostgreSQL-backed job triggers.
 */
export async function runSelectedPages(
  projectId: string,
  selectedPages: Set<string> | string[]
): Promise<RunSelectedPagesResult | null> {
  if (!projectId) return null;

  const pageIds = Array.isArray(selectedPages)
    ? selectedPages
    : Array.from(selectedPages);

  if (pageIds.length === 0) {
    return {
      title: "System exception",
      message: "No pages selected",
    };
  }

  try {
    const result = await startScanPages(projectId, pageIds);
    return {
      title: result.title || "Information",
      message: result.message || "Scan for selected pages started",
    };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: "System exception",
      message: "Failed to start pages scan: " + msg,
    };
  }
}
