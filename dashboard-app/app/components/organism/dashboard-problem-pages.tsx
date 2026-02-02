import Link from "next/link";
import { PiWarning } from "react-icons/pi";
import { Button } from "../atom/button";

type ProblemPage = {
  id: string;
  url: string;
  projectName: string;
  projectId: string;
  criticalCount: number;
  type: 'critical' | 'failed' | 'stale';
};

type DashboardProblemPagesProps = {
  problemPages: ProblemPage[];
};

export function DashboardProblemPages({ problemPages }: DashboardProblemPagesProps) {
  if (problemPages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-[var(--spacing-m)] border border-orange-200">
      <div className="flex items-center justify-between mb-[var(--spacing-m)]">
        <h2 className="as-h3-text primary-text-color flex items-center gap-small">
          <PiWarning className="text-2xl text-orange-600" />
          Problems That Need Attention
        </h2>
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full as-p2-text">
          {problemPages.length} issues
        </span>
      </div>

      <div className="flex flex-col gap-small">
        {problemPages.map((page) => (
          <div key={page.id} className="border border-[var(--color-border-light)] rounded-lg p-[var(--spacing-m)] hover:border-orange-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-small mb-1">
                  {page.type === 'critical' && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded as-p3-text">
                      {page.criticalCount} Critical Issues
                    </span>
                  )}
                  {page.type === 'failed' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded as-p3-text">
                      Scan Failed
                    </span>
                  )}
                  {page.type === 'stale' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded as-p3-text">
                      Not Scanned (30+ days)
                    </span>
                  )}
                </div>
                <div className="as-p2-text primary-text-color truncate max-w-xl" title={page.url}>
                  {page.url}
                </div>
                <div className="as-p3-text secondary-text-color mt-1">
                  Project: <Link href={`/workspace/projects/${page.projectId}`} className="brand-color hover:underline">{page.projectName}</Link>
                </div>
              </div>
              <Link href={`/workspace/projects/${page.projectId}`}>
                <Button 
                  variant="brand"
                  title="Fix Now"
                />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
