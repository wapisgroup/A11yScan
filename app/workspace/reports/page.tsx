"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore";
import { PiFilePdf, PiDownload, PiTrash, PiPlus, PiCalendar, PiGlobe, PiWarning, PiCheckCircle } from "react-icons/pi";

import { PageContainer } from "@/components/molecule/page-container";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { Pagination } from "@/components/molecule/pagination";
import { useAuth, db } from "@/utils/firebase";

type Report = {
  id: string;
  projectId: string;
  projectName: string;
  pageSetId?: string;
  pageSetName?: string;
  type: 'project' | 'pageset';
  status: 'generating' | 'completed' | 'failed';
  totalPages: number;
  totalIssues: number;
  uniqueIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  pdfUrl?: string;
  generatedAt?: Date;
  createdAt: Date;
  createdBy: string;
};

export default function Reports() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    if (!user?.organisationId) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const reportsList: Report[] = [];
      
      // Load reports for the organization
      const reportsQuery = query(
        collection(db, "reports"),
        where("organisationId", "==", user.organisationId),
        orderBy("createdAt", "desc")
      );
      
      const reportsSnap = await getDocs(reportsQuery);
      
      // Load projects to get names
      const projectsQuery = query(
        collection(db, "projects"),
        where("organisationId", "==", user.organisationId)
      );
      const projectsSnap = await getDocs(projectsQuery);
      const projectsMap = new Map(projectsSnap.docs.map(doc => [doc.id, doc.data()]));

      for (const reportDoc of reportsSnap.docs) {
        const reportData = reportDoc.data();
        const projectData = projectsMap.get(reportData.projectId);
        
        reportsList.push({
          id: reportDoc.id,
          projectId: reportData.projectId,
          projectName: projectData?.name || 'Unknown Project',
          pageSetId: reportData.pageSetId,
          pageSetName: reportData.pageSetName,
          type: reportData.pageSetId ? 'pageset' : 'project',
          status: reportData.status || 'completed',
          totalPages: reportData.totalPages || 0,
          totalIssues: reportData.totalIssues || 0,
          uniqueIssues: reportData.uniqueIssues || 0,
          criticalIssues: reportData.criticalIssues || 0,
          seriousIssues: reportData.seriousIssues || 0,
          moderateIssues: reportData.moderateIssues || 0,
          minorIssues: reportData.minorIssues || 0,
          pdfUrl: reportData.pdfUrl,
          generatedAt: reportData.generatedAt?.toDate?.(),
          createdAt: reportData.createdAt?.toDate?.() || new Date(),
          createdBy: reportData.createdBy || '',
        });
      }
      
      setReports(reportsList);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setReports(reports.filter(r => r.id !== reportId));
      setDeleteConfirm(null);
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

  // Pagination
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIdx = (safePage - 1) * itemsPerPage;
  const pagedReports = reports.slice(startIdx, startIdx + itemsPerPage);

  if (loading) {
    return (
      <PrivateRoute>
        <WorkspaceLayout>
          <h1 className="as-h2-text primary-text-color mb-6 mt-4 ml-3">Reports</h1>
          <PageContainer title="Generated Reports">
            <div className="flex items-center justify-center h-64">
              <div className="as-p2-text secondary-text-color">Loading reports...</div>
            </div>
          </PageContainer>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <h1 className="as-h2-text primary-text-color mb-6 mt-4 ml-3">Reports</h1>
        <PageContainer title="Generated Reports">
          {error && <div style={{ color: 'var(--color-error)' }} className="as-p2-text mb-4">{error}</div>}

          {/* Info Card */}
          <div className="mb-6 p-[var(--spacing-l)] bg-gradient-to-r from-[var(--color-primary-light)]/10 to-[var(--color-primary-light)]/5 rounded-xl border border-brand">
            <div className="flex items-start gap-medium">
              <div className="p-3 bg-brand rounded-lg">
                <PiFilePdf className="text-3xl text-white" />
              </div>
              <div className="flex-1">
                <h3 className="as-h4-text primary-text-color mb-2">About Reports</h3>
                <p className="as-p2-text secondary-text-color leading-relaxed">
                  Reports are comprehensive PDF documents that summarize all accessibility issues found across your scanned pages. 
                  Issues are grouped and deduplicated - if the same issue appears on multiple pages, it's shown once with a list of affected pages. 
                  Each report includes issue titles, descriptions, code snippets, and severity breakdowns. Reports can be white-labeled with your organization's branding.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => router.push('/workspace/projects')}
              className="inline-flex items-center gap-small px-4 py-2 bg-brand text-white rounded-lg as-p2-text hover:bg-brand-hover transition-all"
            >
              <PiPlus className="text-lg" />
              Generate New Report
            </button>
            <Link
              href="/workspace/scans"
              className="inline-flex items-center gap-small px-4 py-2 bg-[var(--color-bg-light)] secondary-text-color rounded-lg as-p2-text hover:bg-[var(--color-bg-input)] transition-all"
            >
              <PiGlobe className="text-lg" />
              View Scans
            </Link>
          </div>

          <div className="w-full">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left as-p2-text table-heading-text-color border-b border-[var(--color-border-light)]">
                    <th className="py-4 pr-4">Report</th>
                    <th className="py-4 pr-4">Status</th>
                    <th className="py-4 pr-4 text-center">Pages</th>
                    <th className="py-4 pr-4 text-center">Unique Issues</th>
                    <th className="py-4 pr-4 text-center">Total Issues</th>
                    <th className="py-4 pr-4">Generated</th>
                    <th className="py-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <PiFilePdf className="text-6xl table-heading-text-color mx-auto mb-3" />
                        <p className="as-h5-text secondary-text-color">No reports generated yet</p>
                        <p className="as-p2-text table-heading-text-color mt-2">
                          Generate your first report from a project to get started
                        </p>
                        <button
                          onClick={() => router.push('/workspace/projects')}
                          className="mt-4 inline-flex items-center gap-small px-4 py-2 bg-brand text-white rounded-lg as-p2-text hover:bg-brand-hover transition-all"
                        >
                          <PiPlus />
                          Generate Report
                        </button>
                      </td>
                    </tr>
                  ) : (
                    pagedReports.map((report) => (
                      <tr key={report.id} className="border-t border-[var(--color-border-light)] hover:bg-[var(--color-bg-light)] transition-colors">
                        <td className="py-4 pr-4">
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
                        <td className="py-4 pr-4">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="py-4 pr-4 text-center">
                          <span className="as-p2-text primary-text-color">{report.totalPages}</span>
                        </td>
                        <td className="py-4 pr-4 text-center">
                          <span style={{ backgroundColor: 'var(--color-gradient-purple-light)', color: 'var(--color-gradient-purple)' }} className="inline-flex items-center justify-center min-w-[50px] px-3 py-1 rounded-full as-p2-text">
                            {report.uniqueIssues}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-center">
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
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1 as-p2-text secondary-text-color">
                            <PiCalendar className="table-heading-text-color" />
                            {formatDate(report.generatedAt)}
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {report.status === 'completed' && report.pdfUrl && (
                              <a
                                href={report.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-2 bg-brand text-white rounded-lg as-p3-text hover:bg-brand-hover transition-all"
                              >
                                <PiDownload />
                                Download
                              </a>
                            )}
                            {deleteConfirm === report.id ? (
                              <div className="flex items-center gap-small">
                                <button
                                  onClick={() => handleDelete(report.id)}
                                  style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
                                  className="px-3 py-2 rounded-lg as-p3-text hover:opacity-90"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-2 bg-[var(--color-bg-light)] secondary-text-color rounded-lg as-p3-text hover:bg-[var(--color-bg-input)]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(report.id)}
                                style={{ color: 'var(--color-error)' }}
                                className="p-2 hover:bg-[var(--color-error-light)] rounded-lg transition-all"
                                title="Delete report"
                              >
                                <PiTrash className="text-lg" />
                              </button>
                            )}
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
                  onChange={(next) => setCurrentPage(next)}
                />
              </div>
            )}
          </div>
        </PageContainer>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
