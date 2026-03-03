import { RunDoc } from "@/state-services/project-detail-states_old";
import { normalizeStatus } from "./default";



export const statusFromRun = (run: RunDoc | null): string => {
  if (!run) return "discovered";
  const s = normalizeStatus(run.status);
  if (["running", "processing", "in_progress"].includes(s)) return "running";
  if (["queued", "pending", "blocked", "waiting"].includes(s)) return "queued";
  if (["done", "finished", "completed", "success"].includes(s)) return "scanned";
  if (["failed", "error"].includes(s)) return "failed";
  return s || "discovered";
}
