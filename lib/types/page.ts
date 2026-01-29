import { PageStatsTDO, ProjectStatsTDO } from "./project";

export type PageLike = {
  status?: string | null;
  violationsCount?: Partial<ProjectStatsTDO> | null;
};

export type PageDoc = {
  id: string;
  url: string;
  title?: string | null;
  status?: string | null;
  httpStatus?: number | string | null;
  lastRunId?: string | null;
  lastScan?: unknown;
  lastStats?: PageStatsTDO | null;
  violationsCount?: number | null;
};