"use client";

import { useState, useEffect, useCallback } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth } from "@/utils/firebase";
import { PageContainer } from "@/components/molecule/page-container";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { PageDataLoading } from "@/components/molecule/page-data-loading";
import { DSEmptyState } from "@/components/molecule/ds-empty-state";
import { Pagination } from "@/components/molecule/pagination";
import { PiCode, PiArrowsClockwise } from "react-icons/pi";
import { loadApiLogs, ApiLogEntry } from "@/services/apiLogsService";
import { QueryDocumentSnapshot, DocumentData } from '@/utils/firestore-read-tracker';

const PAGE_SIZE = 25;

export default function ApiLogsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ApiLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCache, setPageCache] = useState<Map<number, { entries: ApiLogEntry[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>>(new Map());

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchPage = useCallback(async (page: number, filter: string) => {
    if (!user?.uid) return;
    setLoading(true);

    try {
      // For page 1, no afterDoc needed
      let afterDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      if (page > 1) {
        const prevPage = pageCache.get(page - 1);
        afterDoc = prevPage?.lastDoc || null;
      }

      const result = await loadApiLogs(user.uid, {
        pageSize: PAGE_SIZE,
        afterDoc,
        statusFilter: filter as any,
      });

      setEntries(result.entries);
      setTotalCount(result.totalCount);
      setPageCache((prev) => {
        const next = new Map(prev);
        next.set(page, { entries: result.entries, lastDoc: result.lastDoc });
        return next;
      });
    } catch (err) {
      console.error("Failed to load API logs:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, pageCache]);

  useEffect(() => {
    setCurrentPage(1);
    setPageCache(new Map());
    fetchPage(1, statusFilter);
  }, [user?.uid, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const cached = pageCache.get(page);
    if (cached) {
      setEntries(cached.entries);
    } else {
      fetchPage(page, statusFilter);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return (
        <span
          style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}
          className="inline-flex items-center px-2 py-1 rounded-full as-p3-text"
        >
          {status}
        </span>
      );
    }
    if (status >= 400 && status < 500) {
      return (
        <span
          style={{ backgroundColor: "var(--color-warning-light)", color: "var(--color-warning)" }}
          className="inline-flex items-center px-2 py-1 rounded-full as-p3-text"
        >
          {status}
        </span>
      );
    }
    if (status >= 500) {
      return (
        <span
          style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
          className="inline-flex items-center px-2 py-1 rounded-full as-p3-text"
        >
          {status}
        </span>
      );
    }
    return <span className="px-2 py-1 bg-gray-100 rounded-full as-p3-text">{status}</span>;
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: "text-blue-700 bg-blue-50",
      POST: "text-green-700 bg-green-50",
      PATCH: "text-yellow-700 bg-yellow-50",
      DELETE: "text-red-700 bg-red-50",
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded as-p3-text font-mono font-semibold ${colors[method] || "text-gray-700 bg-gray-50"}`}>
        {method}
      </span>
    );
  };

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title="API Logs">
          <PageContainer title="API Request Logs" description="View all API calls made with your token. Monitor usage, debug errors, and track response times.">
            {(loading && entries.length === 0) ? <PageDataLoading>Loading API logs...</PageDataLoading> : <>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-small">
                <span className="as-p2-text primary-text-color">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-[var(--color-border-light)] rounded-lg as-p2-text primary-text-color bg-[var(--color-bg)] hover:border-brand input-focus"
                >
                  <option value="all">All</option>
                  <option value="success">Success (2xx)</option>
                  <option value="error">Errors (4xx/5xx)</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setPageCache(new Map());
                  fetchPage(1, statusFilter);
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] rounded-lg transition-colors"
              >
                <PiArrowsClockwise /> Refresh
              </button>

              <span className="as-p3-text secondary-text-color ml-auto">
                {totalCount} total requests
              </span>
            </div>

            <div className="w-full">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="as-p3-text table-heading-text-color border-b border-[var(--color-border-light)] uppercase tracking-wider">
                      <th className="py-3 px-6 text-left">Method</th>
                      <th className="py-3 px-6 text-left">Path</th>
                      <th className="py-3 px-6 text-center">Status</th>
                      <th className="py-3 px-6 text-right">Duration</th>
                      <th className="py-3 px-6 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <DSEmptyState
                            icon={<PiCode />}
                            title="No API calls yet"
                            description="Make your first API call to see logs here. Check the API documentation for details."
                          />
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id} className="border-t border-[var(--color-border-light)] hover:bg-[var(--color-bg-light)] transition-colors">
                          <td className="py-3 px-6">{getMethodBadge(entry.method)}</td>
                          <td className="py-3 px-6">
                            <span className="as-p2-text primary-text-color font-mono text-sm truncate block max-w-[400px]">
                              {entry.path}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">{getStatusBadge(entry.status)}</td>
                          <td className="py-3 px-6 text-right">
                            <span className="as-p2-text secondary-text-color">{entry.durationMs}ms</span>
                          </td>
                          <td className="py-3 px-6 text-right whitespace-nowrap">
                            <span className="as-p2-text secondary-text-color">{formatDate(entry.createdAt)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </div>
            </>}
          </PageContainer>
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
