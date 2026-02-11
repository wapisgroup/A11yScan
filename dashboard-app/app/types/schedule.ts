import type { Timestamp } from "firebase/firestore";

export type ScheduleCadence = "weekly" | "monthly";
export type ScheduleType = "full_scan" | "page_set";

export type ScheduleDoc = {
  id: string;
  organizationId: string | null;
  projectId: string;
  projectName: string;
  projectDomain?: string | null;
  type: ScheduleType;
  cadence: ScheduleCadence;
  includePageCollection: boolean;
  includeReport: boolean;
  pageSetId?: string | null;
  pageSetName?: string | null;
  startDate: Timestamp | Date | null;
  status: "active" | "paused";
  createdBy: string | null;
  createdAt: Timestamp | Date | null;
};

export type ScheduleCreateInput = Omit<ScheduleDoc, "id" | "status" | "createdAt"> & {
  status?: ScheduleDoc["status"];
  createdAt?: ScheduleDoc["createdAt"];
};

export type ScheduleUpdateInput = Partial<
  Pick<
    ScheduleDoc,
    | "type"
    | "cadence"
    | "includePageCollection"
    | "includeReport"
    | "pageSetId"
    | "pageSetName"
    | "startDate"
    | "status"
  >
>;
