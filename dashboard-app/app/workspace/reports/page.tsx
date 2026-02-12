"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteDoc, doc } from "firebase/firestore";
import { PiFilePdf, PiDownload, PiTrash, PiCalendar, PiGlobe, PiWarning, PiCheckCircle, PiPlus } from "react-icons/pi";

import { PageContainer } from "@/components/molecule/page-container";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { Pagination } from "@/components/molecule/pagination";
import { useAuth, db } from "@/utils/firebase";
import { useReportsPageState } from "@/state-services/reports-state";
import { DSButton } from "@/components/atom/ds-button";
import { DSIconButton } from "@/components/atom/ds-icon-button";
import { DSEmptyState } from "@/components/molecule/ds-empty-state";
import { useConfirm } from "@/components/providers/window-provider";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { PageDataLoading } from "@/components/molecule/page-data-loading";

export default function Reports() {
  const { user } = useAuth();
  const router = useRouter();
  const confirm = useConfirm();

  // Use reports page state hook with real-time updates
  const {
    pagedReports,
    allReports,
    projects,
    loading,
    error,
    currentPage,
    totalPages,
    typeFilter,
    statusFilter,
    projectFilter,
    setTypeFilter,
    setStatusFilter,
    setProjectFilter,
    setPage,
  } = useReportsPageState(user?.organisationId, 20);

  const handleDelete = async (reportId: string, reportTitle: string) => {
    const ok = await confirm({
      title: "Delete Report",
      message: `Are you sure you want to delete "${reportTitle}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });

    if (!ok) return;

    try {
      // Find the report to get its projectId
      const report = pagedReports.find(r => r.id === reportId);
      if (!report) return;

      await deleteDoc(doc(db, "projects", report.projectId, "reports", reportId));
      // Real-time subscription will automatically update the list
    } catch (err) {
      console.error("Failed to delete report:", err);
      alert("Failed to delete report");
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }} className="inline-flex items-center gap-1 px-3 py-1 rounded-full as-p3-text">
          <PiCheckCircle /> Completed
        </span>;
      case 'generating':
        return <span style={{ backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)' }} className="inline-flex items-center gap-1 px-3 py-1 rounded-full as-p3-text">
          <div style={{ borderColor: 'var(--color-info)', borderTopColor: 'transparent' }} className="w-3 h-3 border-2 rounded-full animate-spin" />
          Generating
        </span>;
      case 'failed':
        return <span style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }} className="inline-flex items-center gap-1 px-3 py-1 rounded-full as-p3-text">
          <PiWarning /> Failed
        </span>;
      default:
        return <span className="px-3 py-1 bg-[var(--color-bg-light)] primary-text-color rounded-full as-p3-text">{status}</span>;
    }
  };

  // Pagination handled by state hook
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <PageWrapper title="Reports">
            <PageContainer title="Generated Reports">
              <PageDataLoading>Loading reports...</PageDataLoading>
            </PageContainer>
          </PageWrapper>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title="Reports">
          <PageContainer title="Generated Reports" description="View and manage all your generated accessibility reports. Filter by type, status, or project to find specific reports. Click on a report to view details or download the PDF." buttons={<><div className="mt-4 flex items-center gap-3">
                <DSButton
                  leadingIcon={<PiPlus size={20} />}
                  onClick={() => router.push('/workspace/projects')}
                >
                  Generate New Report
                </DSButton>
                <DSButton
                  variant="outline"
                  leadingIcon={<PiGlobe size={20} />}
                  onClick={() => router.push('/workspace/scans')}
                >
                  View Scans
                </DSButton>
              </div></>}>
            {error && <div style={{ color: 'var(--color-error)' }} className="as-p2-text mb-4">{error}</div>}

            
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4">
              {/* Type Filter */}
              <div className="flex items-center gap-small">
                <span className="as-p2-text primary-text-color">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-4 py-2 border border-[var(--color-border-light)] rounded-lg as-p2-text primary-text-color bg-[var(--color-bg)] hover:border-brand input-focus"
                >
                  <option value="all">All Reports ({allReports.length})</option>
                  <option value="project">Project Reports ({allReports.filter(r => r.type === 'project').length})</option>
                  <option value="pageset">PageSet Reports ({allReports.filter(r => r.type === 'pageset').length})</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-small">
                <span className="as-p2-text primary-text-color">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-[var(--color-border-light)] rounded-lg as-p2-text primary-text-color bg-[var(--color-bg)] hover:border-brand input-focus"
                >
                  <option value="all">All ({allReports.length})</option>
                  <option value="completed">Completed ({allReports.filter(r => r.status === 'completed').length})</option>
                  <option value="generating">Generating ({allReports.filter(r => r.status === 'generating').length})</option>
                  <option value="failed">Failed ({allReports.filter(r => r.status === 'failed').length})</option>
                </select>
              </div>

              {/* Project Filter */}
              <div className="flex items-center gap-small">
                <span className="as-p2-text primary-text-color">Project:</span>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-4 py-2 border border-[var(--color-border-light)] rounded-lg as-p2-text primary-text-color bg-[var(--color-bg)] hover:border-brand input-focus"
                >
                  <option value="all">All Projects ({allReports.length})</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({allReports.filter(r => r.projectId === project.id).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="as-p3-text table-heading-text-color border-b border-[var(--color-border-light)] uppercase tracking-wider">
                      <th className="py-3 px-6">Report</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-center">Pages</th>
                      <th className="py-3 px-6 text-center">Unique Issues</th>
                      <th className="py-3 px-6 text-center">Total Issues</th>
                      <th className="py-3 px-6 whitespace-nowrap">Generated</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <DSEmptyState
                            icon={<PiFilePdf />}
                            title="No reports generated yet"
                            description="Generate your first report from a project to get started."
                            action={
                              <DSButton
                                leadingIcon={<PiPlus size={20} />}
                                onClick={() => router.push('/workspace/projects')}
                              >
                                Generate Report
                              </DSButton>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      pagedReports.map((report) => (
                        <tr key={report.id} className="border-t border-[var(--color-border-light)] hover:bg-[var(--color-bg-light)] transition-colors">
                          <td className="py-4 px-6">
                            <div>
                              <div className="as-p2-text primary-text-color mb-1">
                                {report.projectName}
                                {report.type === 'pageset' && report.pageSetName && (
                                  <span className="ml-2 as-p3-text secondary-text-color">
                                    / {report.pageSetName}
                                  </span>
                                )}
                              </div>
                              <div className="as-p3-text secondary-text-color">
                                {report.type === 'pageset' ? 'PageSet Report' : 'Full Project Report'}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="as-p2-text primary-text-color">{report.totalPages}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span style={{ backgroundColor: 'var(--color-gradient-purple-light)', color: 'var(--color-gradient-purple)' }} className="inline-flex items-center justify-center min-w-[50px] px-3 py-1 rounded-full as-p2-text">
                              {report.uniqueIssues}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {report.criticalIssues > 0 && (
                                <span style={{ backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)' }} className="inline-flex items-center gap-1 px-2 py-1 rounded as-p3-text">
                                  {report.criticalIssues}
                                </span>
                              )}
                              {report.seriousIssues > 0 && (
                                <span style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }} className="inline-flex items-center gap-1 px-2 py-1 rounded as-p3-text">
                                  {report.seriousIssues}
                                </span>
                              )}
                              {report.moderateIssues > 0 && (
                                <span style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }} className="inline-flex items-center gap-1 px-2 py-1 rounded as-p3-text">
                                  {report.moderateIssues}
                                </span>
                              )}
                              {report.minorIssues > 0 && (
                                <span style={{ backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)' }} className="inline-flex items-center gap-1 px-2 py-1 rounded as-p3-text">
                                  {report.minorIssues}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <div className="flex items-center gap-1 as-p2-text secondary-text-color">
                              <PiCalendar className="table-heading-text-color" />
                              {formatDate(report.generatedAt)}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {report.status === 'completed' && report.pdfUrl && (
                                <DSIconButton
                                  variant="brand"
                                  icon={<PiDownload size={18} />}
                                  label="Download report"
                                  onClick={() => window.open(report.pdfUrl, '_blank')}
                                />
                              )}
                              <DSIconButton
                                variant="danger"
                                icon={<PiTrash size={18} />}
                                label="Delete report"
                                onClick={() => handleDelete(report.id, `${report.projectName} - ${report.type === 'pageset' ? report.pageSetName : 'Full Report'}`)}
                              />
                            </div>
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
                    page={safePage}
                    totalPages={totalPages}
                    onChange={(next) => setPage(next)}
                  />
                </div>
              )}
            </div>
          </PageContainer>
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
