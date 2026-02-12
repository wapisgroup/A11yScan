type DashboardPast7DaysProps = {
  totalPages: number;
  pagesScanned: number;
  pagesUnscanned: number;
  scannedLast7Days: number;
  stalePages: number;
  totalIssues: number;
};

export function DashboardPast7Days({
  totalPages,
  pagesScanned,
  pagesUnscanned,
  scannedLast7Days,
  stalePages,
  totalIssues,
}: DashboardPast7DaysProps) {
  const scanCoverage = totalPages > 0 ? Math.round((pagesScanned / totalPages) * 100) : 0;
  const scanVelocity = totalPages > 0 ? Math.round((scannedLast7Days / totalPages) * 100) : 0;
  const issueDensity = pagesScanned > 0 ? (totalIssues / pagesScanned).toFixed(1) : "0.0";

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Health Snapshot</h2>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Coverage</span>
            <span className="font-semibold text-gray-900">{scanCoverage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500" style={{ width: `${scanCoverage}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Scanned in Last 7 Days</span>
            <span className="font-semibold text-gray-900">{scanVelocity}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${scanVelocity}%` }}></div>
          </div>
        </div>

      </div>

      <div className="space-y-3 pt-4 mt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Scanned pages</span>
          <span className="text-sm text-gray-900 font-semibold">{pagesScanned}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Unscanned pages</span>
          <span className="text-sm text-gray-900 font-semibold">{pagesUnscanned}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Stale pages (30+ days)</span>
          <span className="text-sm text-gray-900 font-semibold">{stalePages}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Issue density</span>
          <span className="text-sm text-gray-900 font-semibold">{issueDensity} per scanned page</span>
        </div>
      </div>
    </div>
  );
}
