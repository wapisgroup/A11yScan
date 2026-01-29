import { TimestampLike } from "./default";

export type PageSetTDO = {
  id?: string;
  projectId?: string;
  pageCount?: number;
  name: string;
  regex: string;
  filterText: string;
  pageIds: string[];
  owner: string | null;
  created: TimestampLike;
};