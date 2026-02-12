import type { PageSetRule, PageSetTDO } from "@/types/page-set";

export type ResolvablePage = {
  id: string;
  url?: string | null;
  title?: string | null;
  status?: string | null;
  lastScan?: unknown;
  violationsCount?: unknown;
  [key: string]: unknown;
};

function toWildcardRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*+/g, "___WILDCARD___")
    .replace(/___WILDCARD___/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function matchesRule(page: ResolvablePage, rule: PageSetRule): boolean {
  const url = String(page.url || "");
  const value = String(rule.value || "");
  if (!value) return false;

  if (rule.matcher === "page") return page.id === value;
  if (rule.matcher === "contains") return url.toLowerCase().includes(value.toLowerCase());
  if (rule.matcher === "wildcard") {
    try {
      return toWildcardRegex(value).test(url);
    } catch {
      return false;
    }
  }
  if (rule.matcher === "regex") {
    try {
      return new RegExp(value, "i").test(url);
    } catch {
      return false;
    }
  }
  return false;
}

export function normalizePageSetRules(setDoc: Partial<PageSetTDO>): PageSetRule[] {
  if (Array.isArray(setDoc.rules) && setDoc.rules.length > 0) {
    return setDoc.rules
      .filter((r) => r && r.id && r.mode && r.matcher)
      .map((r) => ({
        id: String(r.id),
        mode: r.mode,
        matcher: r.matcher,
        value: String(r.value || ""),
        label: r.label ?? null
      }));
  }

  const legacy: PageSetRule[] = [];
  const regex = String(setDoc.regex || "").trim();
  const filterText = String(setDoc.filterText || "").trim();
  if (regex) {
    legacy.push({
      id: "legacy-regex",
      mode: "include",
      matcher: "regex",
      value: regex,
      label: null
    });
  }
  if (filterText) {
    legacy.push({
      id: "legacy-filter",
      mode: "include",
      matcher: "contains",
      value: filterText,
      label: null
    });
  }
  return legacy;
}

export function resolvePageSetPages(pages: ResolvablePage[], setDoc: Partial<PageSetTDO>): ResolvablePage[] {
  const rules = normalizePageSetRules(setDoc);
  const includeRules = rules.filter((r) => r.mode === "include");
  const excludeRules = rules.filter((r) => r.mode === "exclude");

  // As requested: default empty rules => no pages selected.
  if (includeRules.length === 0) return [];

  return pages.filter((page) => {
    const included = includeRules.some((rule) => matchesRule(page, rule));
    if (!included) return false;
    const excluded = excludeRules.some((rule) => matchesRule(page, rule));
    return !excluded;
  });
}

export function toPageIds(pages: ResolvablePage[]): string[] {
  return pages.map((p) => String(p.id)).filter(Boolean);
}

export function isLikelyScanned(page: ResolvablePage): boolean {
  const status = String(page.status || "").toLowerCase();
  return Boolean(status === "scanned" || page.lastScan || page.violationsCount);
}

