import type { Timestamp } from "@/utils/firestore-read-tracker";

export type ProjectTabKey =
  | "overview"
  | "runs"
  | "pages"
  | "pageSets"
  | "reports"
  | "settings";

export type ProjectStatsTDO = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

export type ProjectStatsWithCounts = ProjectStatsTDO & {
  pagesTotal: number;
  pagesScanned: number;
  pages404: number;
  updatedAt?: unknown;
};

export type PageStatsTDO = ProjectStatsTDO & {};

export type Project = {
  id: string;
  name: string | null;
  domain: string;
  owner: string | null;
  organisationId?: string | null;
  createdAt?: Timestamp | Date | null;
  lastScanAt?: Timestamp | Date | null;
  sitemapUrl?: string | null;
  sitemapTreeUrl?: string | null;
  sitemapGraphUrl?: string | null;
  config?: Record<string, unknown>;
  projectStats?: Partial<ProjectStatsWithCounts> | null;
};
