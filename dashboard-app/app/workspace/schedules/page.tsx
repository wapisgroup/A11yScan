"use client";

import { useState } from "react";
import { PiCalendar, PiPlus, PiPlayCircle, PiPencilSimple } from "react-icons/pi";

import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { PageContainer } from "@/components/molecule/page-container";
import { EmptyState } from "@/components/atom/EmptyState";
import { Button } from "@/components/atom/button";
import ScheduleModal from "@/components/modals/ScheduleModal";
import { useAuth } from "@/utils/firebase";
import { useSubscription } from "@/hooks/use-subscription";
import { useSchedulesPageState } from "@/state-services/schedules-state";
import { createSchedule, updateSchedule } from "@/services/schedulesService";
import type { ScheduleDoc } from "@/types/schedule";

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
          <PageContainer title="Scheduled Scans">
            <div className="flex flex-col gap-medium w-full">
              <div className="flex items-center justify-between border-b border-solid border-white/6 pb-[var(--spacing-m)]">
                <div>
                  <h2 className="as-h3-text primary-text-color">
                    Schedules ({schedules.length})
                  </h2>
                  <p className="as-p2-text secondary-text-color mt-1">
                    Create recurring scans to keep your accessibility status up to date.
                  </p>
                  {subscription && (
                    <p className="as-p3-text secondary-text-color mt-2">
                      Scheduled scans used: {scheduledUsage.used} / {String(scheduledUsage.limit)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-small">
                  <Button
                    variant="brand"
                    icon={<PiPlus size={18} />}
                    title="New schedule"
                    disabled={limitReached}
                    onClick={() => setShowCreateModal(true)}
                  />
                </div>
              </div>

              {error && (
                <div className="as-p2-text text-[var(--color-error)] bg-[var(--color-error)]/10 px-3 py-2 rounded border border-[var(--color-error)]/30">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="py-12 text-center as-p2-text secondary-text-color">Loading schedules...</div>
              ) : schedules.length === 0 ? (
                <EmptyState
                  icon={<PiCalendar />}
                  title="No schedules yet"
                  description="Create your first scheduled scan to automate recurring checks."
                  action={
                    <Button
                      variant="brand"
                      title="Create schedule"
                      disabled={limitReached}
                      onClick={() => setShowCreateModal(true)}
                    />
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="my-table">
                    <thead>
                      <tr className="text-left as-p2-text table-heading-text-color font-bold border-b border-gray-200">
                        <th className="py-4 pr-4">Project</th>
                        <th className="py-4 pr-4">Type</th>
                        <th className="py-4 pr-4">Cadence</th>
                        <th className="py-4 pr-4">Start date</th>
                        <th className="py-4 pr-4">Options</th>
                        <th className="py-4 pr-4">Status</th>
                        <th className="py-4 pr-4 text-right">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 pr-4">
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
                          <td className="py-4 pr-4">
                            <span className="as-p2-text secondary-text-color">
                              {schedule.type === "full_scan" ? "Full scan" : "Page set"}
                              {schedule.pageSetName ? ` · ${schedule.pageSetName}` : ""}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="as-p2-text secondary-text-color capitalize">
                              {schedule.cadence}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="as-p2-text secondary-text-color">
                              {toDateInputValue(schedule.startDate) || "—"}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex flex-wrap gap-2">
                              {schedule.includePageCollection && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                  Crawl first
                                </span>
                              )}
                              {schedule.includeReport && (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                  Generate report
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${schedule.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                              <PiPlayCircle size={14} />
                              {schedule.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-small">
                              <Button
                                variant="secondary"
                                icon={<PiPencilSimple size={16} />}
                                title="Edit"
                                onClick={() => setEditingSchedule(schedule)}
                              />
                              <Button
                                variant="secondary"
                                title={schedule.status === "active" ? "Pause" : "Resume"}
                                onClick={async () => {
                                  await updateSchedule(schedule.id, {
                                    status: schedule.status === "active" ? "paused" : "active",
                                  });
                                }}
                              />
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
