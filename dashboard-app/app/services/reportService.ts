import {
  createReport as createReportAction,
  getAllReports as getAllReportsAction,
  getReports as getReportsAction,
  getScannedPages as getScannedPagesAction,
} from "@/actions/reports";
import { getPageSets as getProjectPageSets } from "@/actions/pageSets";

export type ReportType = "full" | "pageset" | "individual";

export type ReportStatus = "pending" | "generating" | "completed" | "failed";

export type Report = {
  id: string;
  projectId: string;
  projectName?: string;
  type: ReportType;
  status: ReportStatus;
  title: string;
  pageSetId?: string;
  pageSetName?: string;
  pageIds: string[];
  pageCount?: number;
  pdfUrl?: string;
  runId?: string;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  error?: string;
  stats?: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
};

export type CreateReportInput = {
  projectId: string;
  type: ReportType;
  title: string;
  pageSetId?: string;
  pageIds?: string[];
  createdBy?: string;
};

export async function loadReports(projectId: string): Promise<Report[]> {
  return getReportsAction(projectId);
}

export async function loadAllReports(_organisationId?: string): Promise<Report[]> {
  return getAllReportsAction();
}

export function subscribeProjectReports(
  projectId: string,
  onNext: (reports: Report[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!projectId) {
    onNext([]);
    return () => {};
  }

  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = async () => {
    if (stopped) return;
    try {
      const reports = await loadReports(projectId);
      if (!stopped) onNext(reports);
    } catch (err) {
      if (!stopped && onError) onError(err);
    }
  };

  void emit();
  timer = setInterval(() => {
    void emit();
  }, 10_000);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

export function subscribeReports(
  _organisationId: string,
  onNext: (reports: Report[]) => void,
  onError?: (err: unknown) => void
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = async () => {
    if (stopped) return;
    try {
      const reports = await loadAllReports();
      if (!stopped) onNext(reports);
    } catch (err) {
      if (!stopped && onError) onError(err);
    }
  };

  void emit();
  timer = setInterval(() => {
    void emit();
  }, 10_000);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

export async function createReport(
  input: CreateReportInput
): Promise<{ success: boolean; reportId?: string; message: string }> {
  return createReportAction({
    projectId: input.projectId,
    type: input.type,
    title: input.title,
    pageSetId: input.pageSetId,
    pageIds: input.pageIds,
  });
}

export async function getScannedPages(
  projectId: string
): Promise<{ id: string; url: string; title?: string }[]> {
  return getScannedPagesAction(projectId);
}

export async function getPageSetPages(
  projectId: string,
  pageSetId: string
): Promise<{ id: string; url: string; title?: string }[]> {
  const [sets, scannedPages] = await Promise.all([
    getProjectPageSets(projectId),
    getScannedPagesAction(projectId),
  ]);
  const selectedSet = sets.find((s) => String(s.id) === pageSetId);
  if (!selectedSet) return [];
  const idSet = new Set((selectedSet.pageIds ?? []).map((id) => String(id)));
  return scannedPages.filter((page) => idSet.has(String(page.id)));
}
