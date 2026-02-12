"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useAuth } from "@/utils/firebase";
import { PageWrapper } from "@/components/molecule/page-wrapper";
import { PageContainer } from "@/components/molecule/page-container";
import { PageDataLoading } from "@/components/molecule/page-data-loading";
import { DSButton } from "@/components/atom/ds-button";
import { useToast } from "@/components/providers/window-provider";
import {
  clearAdminOrganizationLimitsOverride,
  getAdminOrganizationDetail,
  getAdminOrganizations,
  resetAdminOrganizationUsage,
  setAdminOrganizationLimitsOverride,
  type AdminOrganizationDetail,
  type AdminOrganizationListItem,
} from "@/services/platformAdminService";
import { SUBSCRIPTION_PACKAGES } from "@/config/subscriptions";
import { isPlatformAdminUser } from "@/utils/platform-admin";

const LIMIT_KEYS = [
  "activeProjects",
  "scansPerMonth",
  "pagesPerScan",
  "reportHistoryDays",
  "teamMembers",
  "apiCallsPerDay",
  "scheduledScans",
] as const;

type LimitKey = (typeof LIMIT_KEYS)[number];
type LimitForm = Record<LimitKey, string>;

function toDateLabel(ms: number | null | undefined): string {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

function normalizeLimitInput(raw: string): number | "unlimited" | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value === "unlimited" || value === "∞" || value === "infinity") return "unlimited";
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildDefaultLimitForm(detail: AdminOrganizationDetail | null): LimitForm {
  const firstSub = detail?.subscriptions?.[0] || null;
  const packageId = String(firstSub?.packageId || "starter").toLowerCase();
  const pkg = SUBSCRIPTION_PACKAGES[packageId] || SUBSCRIPTION_PACKAGES.starter;
  const override = (detail?.override?.customLimits || {}) as Record<string, any>;

  const form = {} as LimitForm;
  for (const key of LIMIT_KEYS) {
    const val = override[key] ?? pkg.limits[key] ?? "";
    form[key] = String(val);
  }
  return form;
}

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [organizations, setOrganizations] = useState<AdminOrganizationListItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrganizationDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [limitForm, setLimitForm] = useState<LimitForm>(() => ({
    activeProjects: "",
    scansPerMonth: "",
    pagesPerScan: "",
    reportHistoryDays: "",
    teamMembers: "",
    apiCallsPerDay: "",
    scheduledScans: "",
  }));

  const isAdmin = useMemo(() => isPlatformAdminUser(user as Record<string, any>), [user]);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAdminOrganizations(100);
      setOrganizations(list);
      if (!selectedOrgId && list[0]?.id) {
        setSelectedOrgId(list[0].id);
      }
    } catch (error) {
      console.error("Failed loading organizations:", error);
      toast({ title: "Admin", message: "Failed to load organizations.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, toast]);

  const loadDetail = useCallback(async (orgId: string) => {
    try {
      const data = await getAdminOrganizationDetail(orgId);
      setDetail(data);
      setLimitForm(buildDefaultLimitForm(data));
      setNotes(String(data.override?.notes || ""));
    } catch (error) {
      console.error("Failed loading organization detail:", error);
      toast({ title: "Admin", message: "Failed to load organization detail.", tone: "danger" });
    }
  }, [toast]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadOrganizations();
  }, [isAdmin, loadOrganizations]);

  useEffect(() => {
    if (!isAdmin || !selectedOrgId) return;
    loadDetail(selectedOrgId);
  }, [isAdmin, selectedOrgId, loadDetail]);

  const onResetUsage = useCallback(async () => {
    if (!selectedOrgId) return;
    if (!confirm("Reset current period usage for all subscriptions in this organization?")) return;
    setBusy(true);
    try {
      const res = await resetAdminOrganizationUsage(selectedOrgId);
      toast({
        title: "Usage reset complete",
        message: `Updated ${res.updatedSubscriptions} subscription(s).`,
        tone: "success",
      });
      await loadDetail(selectedOrgId);
    } catch (error) {
      console.error("Usage reset failed:", error);
      toast({ title: "Admin", message: "Failed to reset usage.", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }, [loadDetail, selectedOrgId, toast]);

  const onSaveOverride = useCallback(async () => {
    if (!selectedOrgId) return;
    setBusy(true);
    try {
      const limits = LIMIT_KEYS.reduce<Record<string, number | "unlimited" | null>>((acc, key) => {
        acc[key] = normalizeLimitInput(limitForm[key]);
        return acc;
      }, {});
      await setAdminOrganizationLimitsOverride(selectedOrgId, limits, notes);
      toast({ title: "Override saved", message: "Organization limit override has been updated.", tone: "success" });
      await loadDetail(selectedOrgId);
    } catch (error) {
      console.error("Save override failed:", error);
      toast({ title: "Admin", message: "Failed to save override.", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }, [limitForm, loadDetail, notes, selectedOrgId, toast]);

  const onClearOverride = useCallback(async () => {
    if (!selectedOrgId) return;
    if (!confirm("Clear organization-level subscription override?")) return;
    setBusy(true);
    try {
      await clearAdminOrganizationLimitsOverride(selectedOrgId);
      toast({ title: "Override cleared", message: "Organization now uses package defaults.", tone: "success" });
      await loadDetail(selectedOrgId);
    } catch (error) {
      console.error("Clear override failed:", error);
      toast({ title: "Admin", message: "Failed to clear override.", tone: "danger" });
    } finally {
      setBusy(false);
    }
  }, [loadDetail, selectedOrgId, toast]);

  if (!isAdmin) {
    return (
      <PrivateRoute requireSubscription={false}>
        <WorkspaceLayout>
          <PageWrapper title="Platform Admin">
            <PageContainer title="">
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                You do not have platform admin access.
              </div>
            </PageContainer>
          </PageWrapper>
        </WorkspaceLayout>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute requireSubscription={false}>
      <WorkspaceLayout>
        <PageWrapper title="Platform Admin">
          <PageContainer title="Administration">
            {loading ? (
              <PageDataLoading>Loading organizations...</PageDataLoading>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 border border-[#D7E0EE] rounded-lg bg-white">
                  <div className="px-4 py-3 border-b border-[#E6EBF5] font-semibold">Organizations</div>
                  <div className="max-h-[70vh] overflow-auto">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => setSelectedOrgId(org.id)}
                        className={[
                          "w-full text-left px-4 py-3 border-b border-[#F0F3F9] hover:bg-[#F7FAFF]",
                          selectedOrgId === org.id ? "bg-[#EEF5FF]" : "",
                        ].join(" ")}
                      >
                        <div className="font-medium primary-text-color">{org.name}</div>
                        <div className="as-p3-text secondary-text-color">
                          users {org.usersCount} · projects {org.projectsCount}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  {!detail ? (
                    <div className="rounded-lg border border-[#D7E0EE] bg-white p-6 secondary-text-color">
                      Select an organization to view details.
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg border border-[#D7E0EE] bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xl font-semibold primary-text-color">{detail.organization?.name || detail.organization?.id}</div>
                            <div className="as-p3-text secondary-text-color">ID: {detail.organization?.id}</div>
                          </div>
                          <div className="flex gap-2">
                            <DSButton size="sm" variant="outline" onClick={onResetUsage} disabled={busy}>
                              Reset Period Usage
                            </DSButton>
                            <DSButton size="sm" variant="ghost" onClick={() => selectedOrgId && loadDetail(selectedOrgId)} disabled={busy}>
                              Refresh
                            </DSButton>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                          <div className="rounded border border-[#E6EBF5] p-2"><div className="as-p3-text secondary-text-color">Users</div><div className="font-semibold">{detail.health?.usersCount || 0}</div></div>
                          <div className="rounded border border-[#E6EBF5] p-2"><div className="as-p3-text secondary-text-color">Projects</div><div className="font-semibold">{detail.health?.projectsCount || 0}</div></div>
                          <div className="rounded border border-[#E6EBF5] p-2"><div className="as-p3-text secondary-text-color">Payments</div><div className="font-semibold">{detail.health?.paymentsCount || 0}</div></div>
                          <div className="rounded border border-[#E6EBF5] p-2"><div className="as-p3-text secondary-text-color">Failed Payments</div><div className="font-semibold">{detail.health?.paymentFailedCount || 0}</div></div>
                          <div className="rounded border border-[#E6EBF5] p-2"><div className="as-p3-text secondary-text-color">Past Due Users</div><div className="font-semibold">{detail.health?.pastDueUsers || 0}</div></div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#D7E0EE] bg-white p-4">
                        <div className="font-semibold mb-3">Current Usage</div>
                        <pre className="as-p3-text bg-[#F7FAFF] border border-[#E6EBF5] rounded p-3 overflow-auto">{JSON.stringify(detail.currentUsage || {}, null, 2)}</pre>
                      </div>

                      <div className="rounded-lg border border-[#D7E0EE] bg-white p-4">
                        <div className="font-semibold mb-3">Usage History</div>
                        <div className="overflow-x-auto">
                          <table className="my-table">
                            <thead>
                              <tr>
                                <th scope="col">Period Start</th>
                                <th scope="col">Period End</th>
                                <th scope="col">Usage</th>
                                <th scope="col">Source</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(detail.usageHistory || []).slice(0, 50).map((item, idx) => (
                                <tr key={`${item.periodEndMs || idx}`}>
                                  <td>{toDateLabel(item.periodStartMs)}</td>
                                  <td>{toDateLabel(item.periodEndMs)}</td>
                                  <td><code className="as-p3-text">{JSON.stringify(item.usage || {})}</code></td>
                                  <td>{item.source || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#D7E0EE] bg-white p-4">
                        <div className="font-semibold mb-3">Organization Limit Override</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {LIMIT_KEYS.map((key) => (
                            <label key={key} className="flex flex-col gap-1">
                              <span className="as-p3-text secondary-text-color">{key}</span>
                              <input
                                value={limitForm[key]}
                                onChange={(e) => setLimitForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                className="h-10 border border-[#CED8E7] rounded-lg px-3"
                                placeholder="number | unlimited | empty=null"
                              />
                            </label>
                          ))}
                        </div>
                        <label className="flex flex-col gap-1 mt-3">
                          <span className="as-p3-text secondary-text-color">Notes</span>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[90px] border border-[#CED8E7] rounded-lg px-3 py-2"
                          />
                        </label>
                        <div className="flex gap-2 mt-3">
                          <DSButton size="sm" onClick={onSaveOverride} disabled={busy}>Save Override</DSButton>
                          <DSButton size="sm" variant="outline" onClick={onClearOverride} disabled={busy}>Clear Override</DSButton>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#D7E0EE] bg-white p-4">
                        <div className="font-semibold mb-3">Users</div>
                        <div className="overflow-x-auto">
                          <table className="my-table">
                            <thead>
                              <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Email</th>
                                <th scope="col">Role</th>
                                <th scope="col">Updated</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(detail.users || []).map((u) => (
                                <tr key={u.id}>
                                  <td>{[u.firstName, u.lastName].filter(Boolean).join(" ") || "-"}</td>
                                  <td>{u.email || "-"}</td>
                                  <td>{u.role || (u.isPlatformAdmin ? "platform_admin" : "user")}</td>
                                  <td>{toDateLabel(u.updatedAtMs)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#D7E0EE] bg-white p-4">
                        <div className="font-semibold mb-3">Projects</div>
                        <div className="overflow-x-auto">
                          <table className="my-table">
                            <thead>
                              <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Domain</th>
                                <th scope="col">Owner</th>
                                <th scope="col">Created</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(detail.projects || []).map((p) => (
                                <tr key={p.id}>
                                  <td>{p.name || "-"}</td>
                                  <td>{p.domain || "-"}</td>
                                  <td>{p.owner || "-"}</td>
                                  <td>{toDateLabel(p.createdAtMs)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#D7E0EE] bg-white p-4">
                        <div className="font-semibold mb-3">Payments</div>
                        <div className="overflow-x-auto">
                          <table className="my-table">
                            <thead>
                              <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Status</th>
                                <th scope="col">Amount</th>
                                <th scope="col">Package</th>
                                <th scope="col">Retry</th>
                                <th scope="col">User</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(detail.payments || []).slice(0, 200).map((p) => (
                                <tr key={p.id}>
                                  <td>{toDateLabel(p.createdAtMs)}</td>
                                  <td className="capitalize">{p.status || "-"}</td>
                                  <td>{p.amount != null ? `${p.amount} ${String(p.currency || "").toUpperCase()}` : "-"}</td>
                                  <td>{p.packageName || "-"}</td>
                                  <td>{p.retryCount || 0}</td>
                                  <td>{p.userId || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </PageContainer>
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}

