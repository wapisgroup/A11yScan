"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from '@/utils/firestore-read-tracker';
import { db, auth } from "@/utils/firebase";
import { DSDrawerShell } from "@/components/organism/ds-drawer-shell";
import { SitemapTree, type SitemapNode } from "@/components/organism/sitemap-tree";
import { TableErrorBadge } from "@/components/atom/table-error-badge";
import { RunDoc, runTypesList } from "@/types/run";
import { PiGlobe } from "react-icons/pi";

type PageSummary = {
  id: string;
  url: string | null;
  title: string | null;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

type RunResultDrawerProps = {
  open: boolean;
  run: RunDoc | null;
  projectId: string;
  onClose: () => void;
  onViewPageReport: (pageId: string, projectId: string) => void;
};

export function RunResultDrawer({
  open,
  run,
  projectId,
  onClose,
  onViewPageReport,
}: RunResultDrawerProps) {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [sitemapTree, setSitemapTree] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runType = String(run?.type ?? "");
  const isPageCollection = runType === "page_collection";
  const isScanRun = ["scan_pages", "full_scan"].includes(runType);

  useEffect(() => {
    if (!open || !run || !projectId) return;
    setPages([]);
    setSitemapTree(null);
    setError(null);

    if (isPageCollection) {
      setLoading(true);
      (async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(`/api/projects/${projectId}/sitemap-tree`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.status === 404) {
            setError("No sitemap available yet for this project.");
            return;
          }
          if (!res.ok) throw new Error(`Failed to fetch sitemap (${res.status})`);
          const data = await res.json() as SitemapNode;
          setSitemapTree(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load sitemap");
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    if (isScanRun) {
      setLoading(true);
      const pagesIds: string[] = Array.isArray(run.pagesIds) ? (run.pagesIds as string[]) : [];

      if (pagesIds.length === 0) {
        // Fall back to loading all pages for the project
        getDocs(collection(db, "projects", projectId, "pages"))
          .then((snap) => {
            const result: PageSummary[] = snap.docs.map((d) => {
              const data = d.data();
              const stats = data.lastStats ?? data.violationsCount ?? {};
              return {
                id: d.id,
                url: data.url ?? null,
                title: data.title ?? null,
                critical: Number(stats.critical ?? 0),
                serious: Number(stats.serious ?? 0),
                moderate: Number(stats.moderate ?? 0),
                minor: Number(stats.minor ?? 0),
              };
            });
            setPages(result);
          })
          .catch((err) => setError(err instanceof Error ? err.message : "Failed to load pages"))
          .finally(() => setLoading(false));
      } else {
        // Load only the pages in this run
        Promise.all(
          pagesIds.map((pageId) =>
            getDocs(collection(db, "projects", projectId, "pages"))
              .then((snap) => snap.docs.find((d) => d.id === pageId))
          )
        )
          .then(async () => {
            // Fetch all pages and filter
            const snap = await getDocs(collection(db, "projects", projectId, "pages"));
            const idSet = new Set(pagesIds);
            const result: PageSummary[] = snap.docs
              .filter((d) => idSet.has(d.id))
              .map((d) => {
                const data = d.data();
                const stats = data.lastStats ?? data.violationsCount ?? {};
                return {
                  id: d.id,
                  url: data.url ?? null,
                  title: data.title ?? null,
                  critical: Number(stats.critical ?? 0),
                  serious: Number(stats.serious ?? 0),
                  moderate: Number(stats.moderate ?? 0),
                  minor: Number(stats.minor ?? 0),
                };
              });
            setPages(result);
          })
          .catch((err) => setError(err instanceof Error ? err.message : "Failed to load pages"))
          .finally(() => setLoading(false));
      }
    }
  }, [open, run?.id, projectId]);

  if (!open || !run) return null;

  const typeLabel = runTypesList[runType as keyof typeof runTypesList] ?? runType;

  return (
    <DSDrawerShell
      open={open}
      subtitle={typeLabel}
      title="Run Result"
      widthClassName="w-[60vw] min-w-[720px]"
      onClose={onClose}
    >
      <div className="h-full overflow-y-auto p-6 bg-[var(--color-bg-light)]">
        {loading && (
          <div className="as-p2-text secondary-text-color">Loading...</div>
        )}
        {error && (
          <div className="as-p2-text text-[var(--color-error)]">{error}</div>
        )}

        {!loading && !error && isPageCollection && sitemapTree && (
          <SitemapTree tree={sitemapTree} />
        )}

        {!loading && !error && isPageCollection && !sitemapTree && (
          <div className="as-p2-text secondary-text-color">No sitemap data available.</div>
        )}

        {!loading && !error && isScanRun && (
          <div className="overflow-x-auto">
            <table className="my-table">
              <thead>
                <tr className="as-p3-text table-heading-text-color border-b border-[var(--color-border-light)] uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[260px] text-left">Page URL</th>
                  <th className="py-3 px-4 text-center">Errors</th>
                  <th className="py-3 px-4 text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center as-p2-text secondary-text-color">
                      No pages found for this run.
                    </td>
                  </tr>
                ) : (
                  pages.map((page) => (
                    <tr key={page.id} className="border-t border-[var(--color-border-light)]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <PiGlobe className="text-[#649DAD] flex-shrink-0" />
                          <span className="as-p2-text secondary-text-color truncate max-w-xs" title={page.url ?? ""}>
                            {page.url ?? page.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TableErrorBadge count={page.critical} type="critical" rounded="start" tooltip="Critical" />
                        <TableErrorBadge count={page.serious} type="serious" tooltip="Serious" />
                        <TableErrorBadge count={page.moderate} type="moderate" tooltip="Moderate" />
                        <TableErrorBadge count={page.minor} type="minor" rounded="end" tooltip="Minor" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onViewPageReport(page.id, projectId)}
                          className="px-3 py-1.5 rounded-md as-p3-text border border-[var(--color-border-light)] hover:bg-[var(--color-bg-light)]"
                        >
                          View report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DSDrawerShell>
  );
}
