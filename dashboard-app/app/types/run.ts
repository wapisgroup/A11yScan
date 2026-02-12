/**
  * RunDoc
  * ------
 * TDO representing a scan / run document.
 */
export type RunDoc = {
  id: string;
  type?: RunType | null;
  status?: string | null;
  startedAt?: unknown;
  pagesTotal?: number | null;
  pagesScanned?: number | null;
  pagesIds?: string[] | null;
  pipelineId?: string | null;
  groupedRuns?: RunDoc[] | null;
};

/**
 * RunType
 * -------
 * Supported run types.
 */
export type RunType = "scan_pages" | "pages_to_sitemap" | "page_collection" | "full_scan" | "generate_report";

/**
 * runTypesList
 * ------------
 * Human-readable labels for each RunType.
 */
export const runTypesList: Record<RunType, string> = {
  scan_pages: "Scan",
  pages_to_sitemap: "Pages to sitemap",
  page_collection: "Page collection",
  full_scan: "Full scan",
  generate_report: "Generate Report",
};
