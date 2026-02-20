"use client";

import { useState } from "react";
import { PiCalendar, PiPlus, PiPlayCircle, PiPencilSimple } from "react-icons/pi";

import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { PageContainer } from "@/components/molecule/page-container";
import { EmptyState } from "@/components/atom/EmptyState";
import { DSButton } from "@/components/atom/ds-button";
import { DSIconButton } from "@/components/atom/ds-icon-button";
import ScheduleModal from "@/components/modals/ScheduleModal";
import { useAuth } from "@/utils/firebase";
import { useSubscription } from "@/hooks/use-subscription";
import { useSchedulesPageState } from "@/state-services/schedules-state";
import { createSchedule, updateSchedule } from "@/services/schedulesService";
import type { ScheduleDoc } from "@/types/schedule";
import { PageDataLoading } from "@/components/molecule/page-data-loading";

const toDateInputValue = (value?: ScheduleDoc["startDate"]) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof (value as any)?.toDate === "function") {
    return (value as any).toDate().toISOString().slice(0, 10);
  }
  return "";
};

export default function SchedulesPage() {
  const { user } = useAuth();
  const { subscription, usageLimits, canPerformAction } = useSubscription();
  const { schedules, loading, error } = useSchedulesPageState(user?.organisationId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleDoc | null>(null);

  const limitReached = !canPerformAction("scheduledScans");
  const scheduledUsage = usageLimits.scheduledScans;

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title="Schedules">
          <PageContainer
            title="Scheduled Scans"
            description="Create recurring scans to keep your accessibility status up to date."
            buttons={
              <DSButton
                leadingIcon={<PiPlus size={18} />}
                disabled={limitReached}
                onClick={() => setShowCreateModal(true)}
              >
                New schedule
              </DSButton>
            }
          >
            <div className="flex flex-col gap-medium w-full">
              <div className="border-solid border-[var(--color-border-light)] pb-[var(--spacing-m)] text-right">
                <div>
                  {subscription && (
                    <p className="as-p3-text secondary-text-color mt-2">
                      Scheduled scans used: {scheduledUsage.used} / {String(scheduledUsage.limit)}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="as-p2-text text-[var(--color-error)] bg-[var(--color-error)]/10 px-3 py-2 rounded border border-[var(--color-error)]/30">
                  {error}
                </div>
              )}

              {loading ? (
                <PageDataLoading>Loading schedules...</PageDataLoading>
              ) : schedules.length === 0 ? (
                <EmptyState
                  icon={<PiCalendar />}
                  title="No schedules yet"
                  description="Create your first scheduled scan to automate recurring checks."
                  action={
                    <DSButton
                      disabled={limitReached}
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create schedule
                    </DSButton>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="my-table">
                    <thead>
                      <tr className="as-p3-text table-heading-text-color border-b border-[var(--color-border-light)] uppercase tracking-wider">
                        <th className="py-3 px-6">Project</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6">Cadence</th>
                        <th className="py-3 px-6">Start date</th>
                        <th className="py-3 px-6">Options</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="border-t border-[var(--color-border-light)] hover:bg-[var(--color-bg-light)] transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="as-p2-text primary-text-color">
                                {schedule.projectName}
                              </span>
                              {schedule.projectDomain && (
                                <span className="as-p3-text secondary-text-color">
                                  {schedule.projectDomain}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="as-p2-text secondary-text-color">
                              {schedule.type === "full_scan" ? "Full scan" : "Page set"}
                              {schedule.pageSetName ? ` · ${schedule.pageSetName}` : ""}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="as-p2-text secondary-text-color capitalize">
                              {schedule.cadence}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="as-p2-text secondary-text-color">
                              {toDateInputValue(schedule.startDate) || "—"}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-2">
                              {schedule.includePageCollection && (
                                <span className="inline-flex items-center rounded-full bg-[var(--color-bg-light)] px-2 py-1 text-xs secondary-text-color">
                                  Crawl first
                                </span>
                              )}
                              {schedule.includeReport && (
                                <span className="inline-flex items-center rounded-full bg-[var(--color-bg-light)] px-2 py-1 text-xs secondary-text-color">
                                  Generate report
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${schedule.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-[var(--color-bg-light)] secondary-text-color"}`}>
                              <PiPlayCircle size={14} />
                              {schedule.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-small">
                              <DSIconButton
                                icon={<PiPencilSimple size={16} />}
                                label="Edit schedule"
                                onClick={() => setEditingSchedule(schedule)}
                              />
                              <DSButton
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  await updateSchedule(schedule.id, {
                                    status: schedule.status === "active" ? "paused" : "active",
                                  });
                                }}
                              >
                                {schedule.status === "active" ? "Pause" : "Resume"}
                              </DSButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </PageContainer>
        </PageWrapper>

        {showCreateModal && (
          <ScheduleModal
            open={showCreateModal}
            limitReached={limitReached}
            onClose={() => setShowCreateModal(false)}
            onSubmit={async (payload) => {
              if (!user) return;
              await createSchedule({
                organizationId: user.organisationId ?? null,
                projectId: payload.projectId,
                projectName: payload.projectName,
                projectDomain: payload.projectDomain ?? null,
                type: payload.type,
                cadence: payload.cadence,
                includePageCollection: payload.includePageCollection,
                includeReport: payload.includeReport,
                pageSetId: payload.pageSetId ?? null,
                pageSetName: payload.pageSetName ?? null,
                startDate: payload.startDate ? new Date(payload.startDate) : null,
                createdBy: user.uid,
              });
              setShowCreateModal(false);
            }}
          />
        )}

        {editingSchedule && (
          <ScheduleModal
            open={!!editingSchedule}
            mode="edit"
            limitReached={false}
            initial={{
              projectId: editingSchedule.projectId,
              type: editingSchedule.type,
              cadence: editingSchedule.cadence,
              includePageCollection: editingSchedule.includePageCollection,
              includeReport: editingSchedule.includeReport,
              pageSetId: editingSchedule.pageSetId ?? undefined,
              pageSetName: editingSchedule.pageSetName ?? undefined,
              startDate: toDateInputValue(editingSchedule.startDate),
            }}
            onClose={() => setEditingSchedule(null)}
            onSubmit={async (payload) => {
              await updateSchedule(editingSchedule.id, {
                type: payload.type,
                cadence: payload.cadence,
                includePageCollection: payload.includePageCollection,
                includeReport: payload.includeReport,
                pageSetId: payload.pageSetId ?? null,
                pageSetName: payload.pageSetName ?? null,
                startDate: payload.startDate ? new Date(payload.startDate) : null,
              });
              setEditingSchedule(null);
            }}
          />
        )}
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
