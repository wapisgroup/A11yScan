"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PiFileText, PiGlobe, PiCalendar } from "react-icons/pi";
import { FiFileText } from "react-icons/fi";

import { PageContainer } from "@/components/molecule/page-container";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { Pagination } from "@/components/molecule/pagination";
import { useAuth } from "@/utils/firebase";
import { StatPill } from "@/components/atom/stat-pill";
import { useScansPageState } from "@/state-services/scan-state";
import { formatTimeAgo } from "@/ui-helpers/default";

export default function Scans() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdFilter = searchParams.get('projectId');
  
  // Use scans page state hook
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
  } = useScansPageState(user?.organisationId, projectIdFilter, 20);

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <h1 className="as-h2-text primary-text-color mb-6 mt-4 ml-3">Scans</h1>
          <PageContainer title="Page Scans">
            <div className="flex items-center justify-center h-64">
              <div className="as-p2-text secondary-text-color">Loading scans...</div>
            </div>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <h1 className="as-h2-text primary-text-color mb-6 mt-4 ml-3">Scans</h1>
        <PageContainer title="Page Scans">
          {error && <div className="text-red-600 mb-4">{error}</div>}

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4">
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

          <div className="w-full">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left as-p2-text table-heading-text-color font-bold border-b border-gray-200">
                    <th className="py-4 pr-4">Page URL</th>
                    <th className="py-4 pr-4">Project</th>
                    <th className="py-4 pr-4 text-center">Critical</th>
                    <th className="py-4 pr-4 text-center">Serious</th>
                    <th className="py-4 pr-4 text-center">Moderate</th>
                    <th className="py-4 pr-4 text-center">Minor</th>
                    <th className="py-4 pr-4 text-center">Total</th>
                    <th className="py-4 pr-4">Last Scanned</th>
                    <th className="py-4 pr-4 text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedScans.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center">
                        <PiFileText className="text-6xl table-heading-text-color mx-auto mb-3" />
                        <p className="as-h4-text secondary-text-color">No scans found</p>
                        <p className="as-p2-text table-heading-text-color mt-2">
                          {severityFilter !== 'all' 
                            ? 'Try changing the severity filter'
                            : 'Run a scan on your projects to generate scans'
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    pagedScans.map((scan) => (
                      <tr key={scan.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <PiGlobe className="text-[#649DAD] flex-shrink-0" />
                            <div className="max-w-sm truncate" title={scan.url}>
                              <span className="as-p2-text secondary-text-color">{scan.url}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <Link
                            href={`/workspace/projects/${scan.projectId}`}
                            className="as-p2-text secondary-text-color hover:underline"
                          >
                            {scan.projectName}
                          </Link>
                        </td>
                        <td className="py-4 pr-4 text-center">
                          {scan.criticalIssues > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[30px] px-2 py-1 bg-red-100 text-red-700 rounded-full as-p3-text">
                              {scan.criticalIssues}
                            </span>
                          ) : (
                            <span className="table-heading-text-color">—</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-center">
                          {scan.seriousIssues > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[30px] px-2 py-1 bg-orange-100 text-orange-700 rounded-full as-p3-text">
                              {scan.seriousIssues}
                            </span>
                          ) : (
                            <span className="table-heading-text-color">—</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-center">
                          {scan.moderateIssues > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[30px] px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full as-p3-text">
                              {scan.moderateIssues}
                            </span>
                          ) : (
                            <span className="table-heading-text-color">—</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-center">
                          {scan.minorIssues > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[30px] px-2 py-1 bg-blue-100 text-blue-700 rounded-full as-p3-text">
                              {scan.minorIssues}
                            </span>
                          ) : (
                            <span className="table-heading-text-color">—</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[30px] px-2 py-1 bg-gray-100 primary-text-color rounded-full as-p3-text">
                            {scan.totalIssues}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <PiCalendar className="text-gray-400" />
                            {formatTimeAgo(scan.lastScanned)}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <Link
                              href={`/workspace/projects/${scan.projectId}`}
                              className="p-2 rounded hover:bg-slate-50"
                              aria-label="View scans"
                              title="View scans"
                            >
                              <FiFileText />
                            </Link>
                        </td>
                      </tr>
                    ))
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
        </PageContainer>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}