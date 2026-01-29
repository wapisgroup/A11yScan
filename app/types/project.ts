import { Timestamp } from "firebase-admin/firestore";

export type ProjectTabKey = "overview" | "runs" | "pages" | "pageSets" | "reports" | "settings";

export type Project = {
    id: string;
    name: string;
    domain: string;
    owner: string;
    createdAt: Timestamp | Date | null;
    sitemapUrl?: string | null;
    sitemapTreeUrl?: string | null;
    sitemapGraphUrl?: string | null;
}