import { RunDoc } from "@/state-services/project-detail-states_old";
import { normalizeStatus } from "./default";



export const statusFromRun = (run: RunDoc | null): string => {
  if (!run) return "discovered";
  const s = normalizeStatus(run.status);
  if (["queued", "running", "pending", "blocked", "processing"].includes(s)) return "queued";
  if (["done", "finished", "completed", "success"].includes(s)) return "scanned";
  if (["failed", "error"].includes(s)) return "failed";
  return s || "discovered";
}
