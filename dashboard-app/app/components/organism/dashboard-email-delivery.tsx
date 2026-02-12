"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DSSurface } from "@/components/organism/ds-surface";
import { DSSectionHeader } from "@/components/molecule/ds-section-header";
import { DSButton } from "@/components/atom/ds-button";
import { PageDataLoading } from "@/components/molecule/page-data-loading";
import { useToast } from "@/components/providers/window-provider";
import {
  getEmailDeliveryStats,
  processEmailQueueNow,
  retryFailedEmails,
  type EmailDeliveryItem,
  type EmailDeliverySummary,
} from "@/services/emailDeliveryService";
import { PiArrowClockwise, PiEnvelopeSimple, PiPaperPlaneTilt, PiWarningCircle } from "react-icons/pi";

type DashboardEmailDeliveryProps = {
  organizationId?: string;
};

const EMPTY_SUMMARY: EmailDeliverySummary = {
  total: 0,
  queued: 0,
  retry: 0,
  processing: 0,
  sent: 0,
  failed: 0,
  trialWillEnd: 0,
};

function formatDate(ms: number | null): string {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

export function DashboardEmailDelivery({ organizationId }: DashboardEmailDeliveryProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<EmailDeliverySummary>(EMPTY_SUMMARY);
  const [recent, setRecent] = useState<EmailDeliveryItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await getEmailDeliveryStats({ organizationId, recentLimit: 12 });
      setSummary(res.summary || EMPTY_SUMMARY);
      setRecent(Array.isArray(res.recent) ? res.recent : []);
    } catch (error) {
      console.error("Failed loading email delivery stats:", error);
      toast({
        title: "Email delivery",
        message: "Failed to load email delivery stats.",
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  const failedCount = useMemo(() => Number(summary.failed || 0), [summary.failed]);

  const runQueueNow = useCallback(async () => {
    setBusy(true);
    try {
      const res = await processEmailQueueNow({ organizationId, batchSize: 20 });
      toast({
        title: "Email queue processed",
        message: `Processed ${res.processed}, sent ${res.sent}, failed ${res.failed}.`,
        tone: "info",
      });
      await load();
    } catch (error) {
      console.error("Failed to process email queue:", error);
      toast({
        title: "Email queue",
        message: "Processing failed.",
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }, [organizationId, load, toast]);

  const retryFailed = useCallback(async () => {
    if (failedCount === 0) return;
    setBusy(true);
    try {
      const res = await retryFailedEmails({ organizationId });
      toast({
        title: "Retry queued",
        message: `Moved ${res.retried} failed email(s) back to retry queue.`,
        tone: "success",
      });
      await load();
    } catch (error) {
      console.error("Failed retrying failed emails:", error);
      toast({
        title: "Retry failed",
        message: "Could not queue failed emails for retry.",
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  }, [failedCount, load, organizationId, toast]);

  return (
    <DSSurface>
      <DSSectionHeader
        title="Email Delivery"
        subtitle="Queue health for subscription and trial lifecycle messages."
      />

      {loading ? (
        <PageDataLoading>Loading email delivery...</PageDataLoading>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[#D7E0EE] bg-white p-3">
              <div className="text-xs secondary-text-color">Queued</div>
              <div className="mt-1 text-lg font-semibold primary-text-color">{summary.queued + summary.retry}</div>
            </div>
            <div className="rounded-lg border border-[#D7E0EE] bg-white p-3">
              <div className="text-xs secondary-text-color">Processing</div>
              <div className="mt-1 text-lg font-semibold primary-text-color">{summary.processing}</div>
            </div>
            <div className="rounded-lg border border-[#D7E0EE] bg-white p-3">
              <div className="text-xs secondary-text-color">Sent</div>
              <div className="mt-1 text-lg font-semibold text-emerald-700">{summary.sent}</div>
            </div>
            <div className="rounded-lg border border-[#D7E0EE] bg-white p-3">
              <div className="text-xs secondary-text-color">Failed</div>
              <div className="mt-1 text-lg font-semibold text-rose-700">{summary.failed}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <DSButton
              size="sm"
              onClick={runQueueNow}
              disabled={busy}
              leadingIcon={<PiPaperPlaneTilt />}
            >
              Process Queue Now
            </DSButton>
            <DSButton
              size="sm"
              variant="outline"
              onClick={retryFailed}
              disabled={busy || failedCount === 0}
              leadingIcon={<PiArrowClockwise />}
            >
              Retry Failed ({failedCount})
            </DSButton>
            <DSButton
              size="sm"
              variant="ghost"
              onClick={load}
              disabled={busy}
            >
              Refresh
            </DSButton>
          </div>

          <div className="overflow-x-auto">
            <table className="my-table">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Status</th>
                  <th scope="col">Attempts</th>
                  <th scope="col">Updated</th>
                  <th scope="col">Error</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex items-center justify-center h-24 secondary-text-color">
                        <PiEnvelopeSimple className="mr-2" /> No delivery events yet.
                      </div>
                    </td>
                  </tr>
                ) : (
                  recent.map((item) => (
                    <tr key={item.id}>
                      <td>{item.type}</td>
                      <td className="capitalize">{item.status}</td>
                      <td>{item.attempts}</td>
                      <td>{formatDate(item.updatedAtMs || item.queuedAtMs)}</td>
                      <td>
                        {item.error ? (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <PiWarningCircle />
                            {item.error}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DSSurface>
  );
}
