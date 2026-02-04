'use client';

import { useSubscription } from '../../hooks/use-subscription';

export function UsageDisplay() {
  const { usageLimits, packageConfig } = useSubscription();

  if (!packageConfig) {
    return null;
  }

  const formatLimit = (limit: number | 'unlimited' | null): string => {
    if (limit === 'unlimited' || limit === null) return '∞';
    return limit.toString();
  };

  const getPercentage = (used: number, limit: number | 'unlimited' | null): number => {
    if (limit === 'unlimited' || limit === null) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-600';
    if (percentage >= 75) return 'bg-orange-600';
    return 'bg-blue-600';
  };

  const usageCards = [
    {
      label: 'Active Projects',
      used: usageLimits.activeProjects.used,
      limit: usageLimits.activeProjects.limit,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Scans This Month',
      used: usageLimits.scansThisMonth.used,
      limit: usageLimits.scansThisMonth.limit,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'API Calls Today',
      used: usageLimits.apiCallsToday.used,
      limit: usageLimits.apiCallsToday.limit,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Scheduled Scans',
      used: usageLimits.scheduledScans.used,
      limit: usageLimits.scheduledScans.limit,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {usageCards.map((card, index) => {
        const percentage = getPercentage(card.used, card.limit);
        const barColor = getProgressBarColor(percentage);
        const limitText = formatLimit(card.limit);

        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-600">{card.icon}</div>
              <span className="text-sm font-medium text-gray-900">
                {card.used} / {limitText}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{card.label}</h3>
            {card.limit !== 'unlimited' && card.limit !== null && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
            {(card.limit === 'unlimited' || card.limit === null) && (
              <div className="text-xs text-gray-500 italic">Unlimited</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
