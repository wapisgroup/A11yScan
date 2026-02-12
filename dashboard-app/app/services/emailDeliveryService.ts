import { callServerFunction } from "@/services/serverService";

export type EmailDeliverySummary = {
  total: number;
  queued: number;
  retry: number;
  processing: number;
  sent: number;
  failed: number;
  trialWillEnd: number;
};

export type EmailDeliveryItem = {
  id: string;
  type: string;
  status: string;
  attempts: number;
  error: string | null;
  provider: string | null;
  queuedAtMs: number | null;
  updatedAtMs: number | null;
};

export type EmailDeliveryStatsResponse = {
  ok: boolean;
  summary: EmailDeliverySummary;
  recent: EmailDeliveryItem[];
};

export async function getEmailDeliveryStats(params?: {
  organizationId?: string | null;
  recentLimit?: number;
}): Promise<EmailDeliveryStatsResponse> {
  return callServerFunction<EmailDeliveryStatsResponse>("getEmailDeliveryStats", {
    organizationId: params?.organizationId ?? null,
    recentLimit: params?.recentLimit ?? 12,
  });
}

export async function retryFailedEmails(params?: {
  organizationId?: string | null;
  ids?: string[];
}): Promise<{ ok: boolean; retried: number }> {
  return callServerFunction<{ ok: boolean; retried: number }>("retryFailedEmails", {
    organizationId: params?.organizationId ?? null,
    ids: params?.ids ?? [],
  });
}

export async function processEmailQueueNow(params?: {
  organizationId?: string | null;
  batchSize?: number;
}): Promise<{ ok: boolean; processed: number; sent: number; failed: number; fetched: number }> {
  return callServerFunction<{ ok: boolean; processed: number; sent: number; failed: number; fetched: number }>(
    "processEmailQueueNow",
    {
      organizationId: params?.organizationId ?? null,
      batchSize: params?.batchSize ?? 20,
    }
  );
}

