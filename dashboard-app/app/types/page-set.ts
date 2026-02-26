import { TimestampLike } from "./default";

export type PageSetRuleMatcher = "contains" | "regex" | "wildcard" | "page";
export type PageSetRuleMode = "include" | "exclude";

export type PageSetRule = {
  id: string;
  mode: PageSetRuleMode;
  matcher: PageSetRuleMatcher;
  value: string;
  label?: string | null;
};

export type PageSetTDO = {
  id?: string;
  projectId?: string;
  pageCount?: number;
  name: string;
  regex: string;
  filterText: string;
  rules?: PageSetRule[];
  pageIds: string[];
  owner: string | null;
  created: TimestampLike;
  updated?: TimestampLike;
};
