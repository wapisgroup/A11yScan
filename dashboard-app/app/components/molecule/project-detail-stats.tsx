"use client";

/**
 * Project Detail Stats
 * Shared component in molecule/project-detail-stats.tsx.
 */

import type { ProjectStatsWithCounts } from "@/types/project";
import type { PageDoc } from "@/types/page-types";
import { StatPill } from "../atom/stat-pill";
import React, { useMemo } from "react";

type ProjectDetailStatsProps = {
  stats?: Partial<ProjectStatsWithCounts> | null;
  /**
   * Optional fallback source used when stored project stats do not exist yet.
   * Keep undefined to avoid opening a pages subscription just for header pills.
   */
  pages?: PageDoc[];
};

const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const hasStoredStats = (stats?: Partial<ProjectStatsWithCounts> | null) => {
  if (!stats) return false;
  return (
    stats.pagesTotal !== undefined ||
    stats.pagesScanned !== undefined ||
    stats.pages404 !== undefined ||
    stats.critical !== undefined ||
    stats.serious !== undefined ||
    stats.moderate !== undefined ||
    stats.minor !== undefined
  );
};

export function ProjectDetailStats({ stats, pages = [] }: ProjectDetailStatsProps) {
  const fromStoredStats = useMemo(() => {
    if (!hasStoredStats(stats)) return null;

    return {
      pagesTotal: toSafeNumber(stats?.pagesTotal),
      pagesScanned: toSafeNumber(stats?.pagesScanned),
      pages404: toSafeNumber(stats?.pages404),
      critical: toSafeNumber(stats?.critical),
      serious: toSafeNumber(stats?.serious),
      moderate: toSafeNumber(stats?.moderate),
      minor: toSafeNumber(stats?.minor),
    };
  }, [stats]);

  const fromPages = useMemo(() => {
    let pagesTotal = 0;
    let pagesScanned = 0;
    let pages404 = 0;
    let critical = 0;
    let serious = 0;
    let moderate = 0;
    let minor = 0;

    pages.forEach((page) => {
      // Count pages with 2xx status; treat missing httpStatus as unknown (not an error)
      const rawStatus = page.httpStatus;
      if (rawStatus == null) {
        pagesTotal++;
      } else {
        const httpStatus = typeof rawStatus === "number" ? rawStatus : parseInt(String(rawStatus), 10);
        if (httpStatus >= 200 && httpStatus < 300) {
          pagesTotal++;
        } else {
          pages404++;
        }
      }

      if (page.violationsCount || page.status === "scanned") {
        pagesScanned++;
      }

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
      minor,
    };
  }, [pages]);

  const resolvedStats = fromStoredStats ?? fromPages;

  return (
    <div className="flex gap-small items-center">
      <StatPill label="Pages" value={resolvedStats.pagesTotal} type="info" />
      <StatPill label="Scanned" value={resolvedStats.pagesScanned} type="info" />
      {resolvedStats.pages404 > 0 && <StatPill label="404 Pages" value={resolvedStats.pages404} type="danger" />}
      <StatPill label="Critical" value={resolvedStats.critical} type="critical" />
      <StatPill label="Serious" value={resolvedStats.serious} type="serious" />
      <StatPill label="Moderate" value={resolvedStats.moderate} type="moderate" />
      <StatPill label="Minor" value={resolvedStats.minor} type="minor" />
    </div>
  );
}
