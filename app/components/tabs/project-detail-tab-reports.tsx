"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PiFileText, 
  PiPlus, 
  PiDownloadSimple, 
  PiSpinner, 
  PiCheckCircle,
  PiWarningCircle,
  PiCalendar
} from "react-icons/pi";
import { loadReports, type Report } from "@/services/reportService";
import { formatTimeAgo } from "@lib/ui-helpers/default";
import { Button } from "@/components/atom/button";
import { CreateReportModal } from "@/components/modals/CreateReportModal";
import { useAuth } from "@/utils/firebase";
import { PageContainer } from "../molecule/page-container";
import { EmptyState } from "../atom/EmptyState";
import { LoadingState } from "../atom/LoadingState";

type ReportsTabProps = {
  projectId: string;
};

export function ReportsTab({ projectId }: ReportsTabProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadReportsData();
  }, [projectId]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const data = await loadReports(projectId);
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-full as-p3-text">
            <PiCheckCircle size={14} />
            Completed
          </span>
        );
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-light brand-color rounded-full as-p3-text">
            <PiSpinner size={14} className="animate-spin" />
            Generating
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-full as-p3-text">
            <PiWarningCircle size={14} />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 secondary-text-color rounded-full as-p3-text">
            <PiSpinner size={14} />
            Pending
          </span>
        );
    }
  };

  const getTypeLabel = (type: Report['type']) => {
    switch (type) {
      case 'full':
        return 'Full Report';
      case 'pageset':
        return 'Page Set Report';
      case 'individual':
        return 'Individual Page';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <PageContainer inner>
        <div className="p-[var(--spacing-m)]">
          <LoadingState message="Loading reports..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer inner>
      <div className="flex flex-col gap-medium w-full p-[var(--spacing-m)]">
        {/* Header with Actions - matches Pages/Runs tabs */}
        <div className="flex items-center justify-between border-b border-solid border-white/6 pb-[var(--spacing-m)]">
          <div className="flex gap-small items-center">
            <h2 className="as-h3-text primary-text-color">
              Reports ({reports.length})
            </h2>
          </div>
          <div className="flex gap-small items-center">
            <Button
              variant="brand"
              icon={<PiPlus size={20} />}
              onClick={() => setShowCreateModal(true)}
              title="Generate Report"
            />
          </div>
        </div>

        {/* Reports List or Empty State */}
        {reports.length === 0 ? (
          <EmptyState
            icon={<PiFileText />}
            title="No reports yet"
            description="Generate comprehensive accessibility reports to track issues and share findings with your team."
            action={
              <Button
                variant="brand"
                onClick={() => setShowCreateModal(true)}
                title="Generate Your First Report"
              />
            }
          />
        ) : (
          <div className="flex flex-col gap-small">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-start justify-between p-[var(--spacing-m)] bg-white border border-[var(--color-border-light)] rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 flex flex-col gap-small">
                  <div className="flex items-center gap-small">
                    <h4 className="as-h4-text primary-text-color">{report.title}</h4>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <div className="flex items-center gap-medium as-p2-text secondary-text-color">
                    <span className="inline-flex items-center gap-1">
                      <PiFileText size={16} />
                      {getTypeLabel(report.type)}
                    </span>
                    {report.pageSetName && (
                      <span>• {report.pageSetName}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <PiCalendar size={16} />
                      {formatTimeAgo(report.createdAt)}
                    </span>
                    <span>
                      • {report.pageCount || report.pageIds.length} page{(report.pageCount || report.pageIds.length) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {report.error && (
                    <div className="as-p2-text text-[var(--color-error)] bg-[var(--color-error)]/10 px-3 py-2 rounded border border-[var(--color-error)]/30">
                      Error: {report.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-small ml-[var(--spacing-m)]">
                  {report.status === 'completed' && report.pdfUrl && (
                    <Button
                      variant="brand"
                      icon={<PiDownloadSimple size={18} />}
                      title="Download PDF"
                      onClick={() => window.open(report.pdfUrl, '_blank')}
                    />
                  )}
                  {report.status === 'failed' && (
                    <Button
                      title="Retry"
                      variant="secondary"
                      onClick={() => {
                        // TODO: Implement retry logic
                        console.log("Retry report generation");
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Report Modal */}
        {showCreateModal && user && (
          <CreateReportModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            projectId={projectId}
            userId={user.uid}
            onSuccess={loadReportsData}
          />
        )}
      </div>
    </PageContainer>
  );
}
