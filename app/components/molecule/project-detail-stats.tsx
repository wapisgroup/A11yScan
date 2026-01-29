"use client";

import { ProjectStatsTDO } from "@lib/types/project";
import { StatPill } from "../atom/stat-pill";
import React, { useEffect, useState, useMemo } from "react";
import { subscribeProjectPages } from "@/services/projectPagesService";

type ProjectDetailStatsProps = {
  stats?: ProjectStatsTDO;
  projectId: string;
};

type PageDoc = {
  id: string;
  httpStatus?: number | string | null;
  status?: string | null;
  violationsCount?: {
    critical?: number;
    serious?: number;
    moderate?: number;
    minor?: number;
  } | null;
  [key: string]: unknown;
};

export function ProjectDetailStats({ projectId }: ProjectDetailStatsProps) {
  const [pages, setPages] = useState<PageDoc[]>([]);

  // Subscribe to pages for real-time updates
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeProjectPages(
      projectId,
      (pagesData) => setPages(pagesData as PageDoc[]),
      (error) => console.error("Error loading pages for stats:", error)
    );

    return unsubscribe;
  }, [projectId]);

  // Calculate stats from pages
  const stats = useMemo(() => {
    let pagesTotal = 0;
    let pagesScanned = 0;
    let pages404 = 0;
    let critical = 0;
    let serious = 0;
    let moderate = 0;
    let minor = 0;

    pages.forEach((page) => {
      // Count pages with 2xx status
      const httpStatus = typeof page.httpStatus === 'number' 
        ? page.httpStatus 
        : parseInt(String(page.httpStatus ?? '0'));
      
      if (httpStatus >= 200 && httpStatus < 300) {
        pagesTotal++;
      } else if (!httpStatus || httpStatus < 200 || httpStatus >= 300) {
        // Count non-2xx pages (404s, 500s, etc.)
        pages404++;
      }

      // Count scanned pages - a page is scanned if it has violations data
      if (page.violationsCount || page.status === "scanned") {
        pagesScanned++;
      }

      // Sum violations
      if (page.violationsCount) {
        critical += page.violationsCount.critical ?? 0;
        serious += page.violationsCount.serious ?? 0;
        moderate += page.violationsCount.moderate ?? 0;
        minor += page.violationsCount.minor ?? 0;
      }
    });

    return {
      pagesTotal,
      pagesScanned,
      pages404,
      critical,
      serious,
      moderate,
      minor
    };
  }, [pages]);

  return (
    <div className="flex gap-small items-center">
      <StatPill label="Pages" value={stats.pagesTotal} type="info" />
      <StatPill label="Scanned" value={stats.pagesScanned} type="info" />
      {stats.pages404 > 0 && <StatPill label="404 Pages" value={stats.pages404} type="danger" />}
      <StatPill label="Critical" value={stats.critical} type="critical" />
      <StatPill label="Serious" value={stats.serious} type="serious" />
      <StatPill label="Moderate" value={stats.moderate} type="moderate" />
      <StatPill label="Minor" value={stats.minor} type="minor" />
    </div>
  );
}