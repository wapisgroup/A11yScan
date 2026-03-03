"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PiFileText, PiGlobe, PiCalendar, PiNotepadLight,
  PiArrowClockwise, PiSpinner
} from "react-icons/pi";
import { PageContainer } from "@/components/molecule/page-container";
import { Pagination } from "@/components/molecule/pagination";
import { useAuth } from "@/utils/firebase";
import { StatPill } from "@/components/atom/stat-pill";
import { useScansPageState } from "@/state-services/scan-state";
import { formatTimeAgo } from "@/ui-helpers/default";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { PageDataLoading } from "@/components/molecule/page-data-loading";
import { TableErrorBadge } from "@/components/atom/table-error-badge";
import { EmptyState } from "@/components/atom/EmptyState";
import { DSIconButton } from "@/components/atom/ds-icon-button";
import PageReportDrawer from "@/components/modals/page-report-drawer";
import { scanSinglePage } from "@/services/projectDetailService";
import type { PageReport } from "@/services/scanService";

// Disable static generation for this route (uses useSearchParams)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function Scans() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get('projectId');

  const [selectedScan, setSelectedScan] = useState<PageReport | null>(null);
  const [drawerTab, setDrawerTab] = useState<"report" | "preview">("report");
  const [rescanningIds, setRescanningIds] = useState<Set<string>>(new Set());
  const rescanTimersRef = useRef<Map<string, number>>(new Map());
  const scansRef = useRef<PageReport[]>([]);

  const {
    pagedItems: pagedScans,
    allItems: scans,
    loading,
    error,
    pagination,
    setPage,
    projects,
    severityFilter,
    setSeverityFilter,
    projectFilter,
    setProjectFilter,
    refresh,
  } = useScansPageState(user?.organisationId ?? undefined, projectIdFilter, 20);
  const showInitialLoading = loading && scans.length === 0;

  const clearRescan = useCallback((pageId: string) => {
    const timer = rescanTimersRef.current.get(pageId);
    if (timer) window.clearInterval(timer);
    rescanTimersRef.current.delete(pageId);
    setRescanningIds((prev) => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
  }, []);

  useEffect(() => {
    scansRef.current = scans;
  }, [scans]);

  useEffect(() => {
    return () => {
      rescanTimersRef.current.forEach((id) => window.clearInterval(id));
      rescanTimersRef.current.clear();
    };
  }, []);

  const handleRescan = useCallback(async (scan: PageReport) => {
    const pageId = scan.id;
    if (rescanningIds.has(pageId)) return;

    setRescanningIds((prev) => new Set([...prev, pageId]));

    const initialScanId = scan.scanId || "";
    const triggerTime = Date.now();

    try {
      await scanSinglePage(scan.projectId, { id: pageId, url: scan.url });
      const timer = window.setInterval(() => {
        void (async () => {
          await refresh();
          const latest = scansRef.current.find((s) => s.id === pageId);
          if (!latest) return;
          const changedScan =
            Boolean(latest.scanId) && latest.scanId !== initialScanId;
          const refreshedAfterTrigger =
            latest.lastScanned instanceof Date &&
            latest.lastScanned.getTime() >= triggerTime;

          if (changedScan || refreshedAfterTrigger) {
            clearRescan(pageId);
          }
        })();
      }, 1000);

      rescanTimersRef.current.set(pageId, timer);

      // Safety timeout
      window.setTimeout(() => clearRescan(pageId), 120000);
    } catch {
      clearRescan(pageId);
    }
  }, [rescanningIds, clearRescan, refresh]);

  return (
    <>
      <PageWrapper title="Scans">
        <PageContainer title="Page Scans" excludePadding description="View and manage all your page scans. Filter by project or severity to find specific results.">
            {showInitialLoading ? (
              <PageDataLoading>Loading scans...</PageDataLoading>
            ) : <>
            {error && <div className="text-red-600 mb-4">{error}</div>}

            {/* Filters */}
            <div className="w-full mb-6 pb-4 border-b border-[var(--color-border-light)] flex flex-col gap-4 px-8">
              {/* Project Filter */}
              <div className="flex items-center gap-small">
                <span className="as-p2-text primary-text-color">Filter by project:</span>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg as-p2-text primary-text-color bg-white hover:border-gray-400 input-focus"
                >
                  <option value="all">All Projects ({scans.length} scans)</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({scans.filter(r => r.projectId === project.id).length} scans)
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-small">
                <span className="as-p2-text primary-text-color">Filter by severity:</span>
                <div className="flex gap-2">
                  <div
                    onClick={() => setSeverityFilter('all')}
                    className={`cursor-pointer transition-all ${severityFilter === 'all' ? '' : 'opacity-50 hover:opacity-75'}`}
                  >
                    <StatPill label="All" value={scans.length} type="info" />
                  </div>
                  <div
                    onClick={() => setSeverityFilter('critical')}
                    className={`cursor-pointer transition-all ${severityFilter === 'critical' ? '' : 'opacity-50 hover:opacity-75'}`}
                  >
                    <StatPill label="Critical" value={scans.filter(r => r.criticalIssues > 0).length} type="critical" />
                  </div>
                  <div
                    onClick={() => setSeverityFilter('serious')}
                    className={`cursor-pointer transition-all ${severityFilter === 'serious' ? '' : 'opacity-50 hover:opacity-75'}`}
                  >
                    <StatPill label="Serious" value={scans.filter(r => r.seriousIssues > 0).length} type="serious" />
                  </div>
                  <div
                    onClick={() => setSeverityFilter('moderate')}
                    className={`cursor-pointer transition-all ${severityFilter === 'moderate' ? '' : 'opacity-50 hover:opacity-75'}`}
                  >
                    <StatPill label="Moderate" value={scans.filter(r => r.moderateIssues > 0).length} type="moderate" />
                  </div>
                  <div
                    onClick={() => setSeverityFilter('minor')}
                    className={`cursor-pointer transition-all ${severityFilter === 'minor' ? '' : 'opacity-50 hover:opacity-75'}`}
                  >
                    <StatPill label="Minor" value={scans.filter(r => r.minorIssues > 0).length} type="minor" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full px-3 mb-6">
              <div className="overflow-x-auto">
                <table className="my-table">
                  <thead>
                    <tr className="as-p3-text table-heading-text-color border-b border-[var(--color-border-light)] uppercase tracking-wider">
                      <th className="py-3 px-6 min-w-[360px]">Page URL</th>
                      <th className="py-3 px-6 text-center">Errors</th>
                      <th className="py-3 px-6 whitespace-nowrap min-w-[160px]">Last Scanned</th>
                      <th className="py-3 px-6 text-right">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedScans.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12">
                          <EmptyState
                            icon={<PiNotepadLight />}
                            title={severityFilter !== 'all' ? 'No scans found' : 'No scans yet'}
                            description={severityFilter !== 'all' ? 'Try changing the severity filter' : 'All scans across your projects will appear here.'}
                          />
                        </td>
                      </tr>
                    ) : (
                      pagedScans.map((scan) => {
                        const isRescanning = rescanningIds.has(scan.id);
                        return (
                          <tr key={scan.id} className="border-t border-[var(--color-border-light)]">
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <PiGlobe className="text-[#649DAD] flex-shrink-0" />
                                  <div className="max-w-sm truncate" title={scan.url}>
                                    <span className="as-p2-text secondary-text-color">{scan.url}</span>
                                  </div>
                                </div>
                                <div className="as-p3-text secondary-text-color">
                                  Project:&nbsp; 
                                  <Link
                                    href={`/workspace/projects/${scan.projectId}`}
                                    className="as-p3-text secondary-text-color hover:underline"
                                  >
                                    {scan.projectName}
                                  </Link>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <TableErrorBadge count={scan.criticalIssues} type="critical" rounded="start" tooltip="Critical errors" />
                              <TableErrorBadge count={scan.seriousIssues} type="serious" tooltip="Serious errors" />
                              <TableErrorBadge count={scan.moderateIssues} type="moderate" tooltip="Moderate errors" />
                              <TableErrorBadge count={scan.minorIssues} type="minor" rounded="end" tooltip="Minor errors" />
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-sm secondary-text-color">
                                <PiCalendar className="table-heading-text-color" />
                                {formatTimeAgo(scan.lastScanned)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-2">
                                {isRescanning ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full as-p3-text bg-brand-light brand-color">
                                    <PiSpinner size={13} className="animate-spin" />
                                    Scanning…
                                  </span>
                                ) : (
                                  <DSIconButton
                                    icon={<PiArrowClockwise size={18} />}
                                    label="Rescan"
                                    onClick={() => void handleRescan(scan)}
                                  />
                                )}
                                <DSIconButton
                                  icon={<PiFileText size={18} />}
                                  label="View report"
                                  onClick={() => {
                                    setSelectedScan(scan);
                                    setDrawerTab("report");
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    page={pagination.safePage}
                    totalPages={pagination.totalPages}
                    onChange={(next) => setPage(next)}
                  />
                </div>
              )}
            </div>
            </>}
        </PageContainer>
      </PageWrapper>

      <PageReportDrawer
        open={selectedScan !== null}
        projectId={selectedScan?.projectId ?? ""}
        pageId={selectedScan?.id ?? null}
        activeTab={drawerTab}
        scanIdFromUrl={null}
        onClose={() => setSelectedScan(null)}
        onTabChange={setDrawerTab}
        onScanChange={() => { }}
      />
    </>
  );
}
