/**
 * Dashboard Recent Pages
 * Shared component in organism/dashboard-recent-pages.tsx.
 */

import Link from "next/link";
import { PiGlobe } from "react-icons/pi";
import { DSSurface } from "@/components/organism/ds-surface";
import { DSSectionHeader } from "@/components/molecule/ds-section-header";

type RecentPage = {
  id: string;
  url: string;
  projectName: string;
  status: string;
  criticalIssues: number;
  lastScanned?: Date;
  projectId: string;
};

type DashboardRecentPagesProps = {
  recentPages: RecentPage[];
  formatTimeAgo: (date: Date | null | undefined) => string;
};

export function DashboardRecentPages({ recentPages, formatTimeAgo }: DashboardRecentPagesProps) {
  return (
    <DSSurface className="p-0 overflow-hidden">
      <div className="flex items-center justify-between p-[var(--spacing-l)] border-b border-[var(--color-border-light)]">
          <DSSectionHeader title="Recently Scanned Pages" />    
      </div>

      {recentPages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <PiGlobe className="text-5xl mx-auto mb-2 text-gray-300" />
          <p>No pages scanned yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="">
              <tr className="border-b border-[var(--color-border-light)] ">
                <th className="text-left p-3 pl-8 as-p3-text table-heading-text-color font-semibold">Page URL</th>
                <th className="text-left p-3 as-p3-text table-heading-text-color font-semibold">Project</th>
                <th className="text-left p-3 as-p3-text table-heading-text-color font-semibold">Status</th>
                <th className="text-right p-3 pr-8 as-p3-text table-heading-text-color font-semibold">Last Scanned</th>
              </tr>
            </thead>
            <tbody>
              {recentPages.slice(0, 8).map((page, index) => {
                // Generate varied response times
               
                return (
                  <tr key={page.id} className="border-b border-[var(--color-border-light)]/60">
                    <td className="p-3 pl-8">
                      <div className="as-p3-text secondary-text-color hover:underline cursor-pointer truncate max-w-xs" title={page.url}>
                        {page.url}
                      </div>
                    </td>
                    <td className="p-3">
                      <Link href={`/workspace/projects/${page.projectId}`} className="as-p3-text secondary-text-color hover:underline">
                        {page.projectName}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-50 text-green-700">
                        Scanned
                      </span>
                    </td>
                    
                    <td className="p-3 pr-8 text-right">
                      <span className="as-p3-text secondary-text-color flex items-center justify-end gap-1">
                        {formatTimeAgo(page.lastScanned)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DSSurface>
  );
}
