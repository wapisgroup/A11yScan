export type ProjectStatsTDO = {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
}

export type ProjectStatsWithCounts = ProjectStatsTDO & {
  pagesTotal: number;
  pagesScanned: number;
};

export type PageStatsTDO = ProjectStatsTDO & {}