import type { TopIssueRule } from "@/services/dashboardService";

type DashboardTopIssuesProps = {
  topIssueRules: TopIssueRule[];
};

function impactClass(impact: TopIssueRule["impact"]): string {
  if (impact === "critical") return "bg-red-500";
  if (impact === "serious") return "bg-orange-500";
  if (impact === "moderate") return "bg-amber-500";
  if (impact === "minor") return "bg-blue-500";
  return "bg-gray-400";
}

export function DashboardTopIssues({ topIssueRules }: DashboardTopIssuesProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Top Issues</h2>
      {topIssueRules.length === 0 ? (
        <div className="text-sm text-gray-500">No issue-level rule data yet.</div>
      ) : (
        <div className="space-y-3">
          {topIssueRules.slice(0, 5).map((rule) => (
            <div key={rule.id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-all">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2 h-2 rounded-sm ${impactClass(rule.impact)}`}></div>
                <span className="text-sm text-gray-700 truncate" title={rule.label}>
                  {rule.label}
                </span>
              </div>
              <span className="text-xl font-bold text-gray-900">{rule.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
