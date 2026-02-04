import { TimestampLike } from "@/types/default";

export const normalizeStatus = (s: unknown): string => {
    const v = String(s ?? "").toLowerCase().trim();
    return v || "discovered";
}

export const safeNumber = (n: unknown): number => {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
}

export function toDateSafe(v: unknown): Date {
    if (!v) return new Date();

    // Firestore Timestamp
    const ts = v as TimestampLike;
    if (typeof ts?.toDate === "function") {
        try {
            return ts.toDate();
        } catch {
            return new Date();
        }
    }

    // epoch ms / ISO
    const d = new Date(v as any);
    return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function safeInt(n: unknown): number {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.floor(v));
}

export function formatDate(ts: TimestampLike): string {
    try {
        if (!ts) return "—";
        // Firestore Timestamp-like
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyTs: any = ts as any;
        if (typeof anyTs?.toDate === "function") return (anyTs.toDate() as Date).toLocaleString();
        if (typeof anyTs?.seconds === "number") return new Date(anyTs.seconds * 1000).toLocaleString();
        return new Date(anyTs).toLocaleString();
    } catch {
        return "—";
    }
}

export function formatTimeAgo(date: Date | null | undefined): string {
    if (!date) return '—';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}


export function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}