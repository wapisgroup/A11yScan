import { PiArrowRight } from "react-icons/pi";

type DashboardPast7DaysProps = {
  pagesScanned: number;
  totalIssues: number;
};

export function DashboardPast7Days({ pagesScanned, totalIssues }: DashboardPast7DaysProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Past 7 Days Summary</h2>
      
      {/* Chart visualization */}
      <div className="mb-4">
        <div className="h-32 flex items-end justify-between gap-1.5 bg-gray-50 rounded-lg p-3">
          {[50, 62, 55, 70, 65, 75, 80].map((val, i) => {
            const greenHeight = `${val}%`;
            const orangeHeight = `${val * 0.4}%`;
            return (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-stretch gap-1">
                <div className="bg-teal-500 rounded-t-sm" style={{ height: greenHeight }}></div>
                <div className="bg-orange-500 rounded-t-sm" style={{ height: orangeHeight }}></div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-500 rounded-sm"></div>
            Pages Scanned
          </span>
          <span className="text-sm text-gray-900 font-semibold flex items-center gap-1">
            {pagesScanned} pages
            <PiArrowRight className="text-xs text-gray-400" />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
            New Issues
          </span>
          <span className="text-sm text-gray-900 font-semibold flex items-center gap-1">
            {Math.floor(totalIssues * 0.4)} pages
            <PiArrowRight className="text-xs text-gray-400" />
          </span>
        </div>
      </div>
    </div>
  );
}
