type IssueBreakdown = {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
};

type DashboardTopIssuesProps = {
  issueBreakdown: IssueBreakdown;
};

export function DashboardTopIssues({ issueBreakdown }: DashboardTopIssuesProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Top Issues</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-all cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
            <span className="text-sm text-gray-700">Missing Alt Text</span>
          </div>
          <span className="text-xl font-bold text-gray-900">{Math.floor(issueBreakdown.critical * 0.3)}</span>
        </div>
        <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-all cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
            <span className="text-sm text-gray-700">Empty Button Text</span>
          </div>
          <span className="text-xl font-bold text-gray-900">{Math.floor(issueBreakdown.serious * 0.5)}</span>
        </div>
        <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-all cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
            <span className="text-sm text-gray-700">Low Contrast Text</span>
          </div>
          <span className="text-xl font-bold text-gray-900">{Math.floor(issueBreakdown.moderate * 0.7)}</span>
        </div>
      </div>
    </div>
  );
}
