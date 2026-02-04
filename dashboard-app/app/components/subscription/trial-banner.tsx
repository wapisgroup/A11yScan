'use client';

import { useSubscription } from '../../hooks/use-subscription';
import Link from 'next/link';

export function TrialBanner() {
  const { subscription, trialDaysRemaining, statusMessage } = useSubscription();

  // Only show for trial subscriptions
  if (!subscription || subscription.status !== 'trial') {
    return null;
  }

  // Determine urgency styling
  const getUrgencyClass = () => {
    if (trialDaysRemaining <= 3) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (trialDaysRemaining <= 7) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getButtonClass = () => {
    if (trialDaysRemaining <= 3) {
      return 'bg-red-600 hover:bg-red-700 text-white';
    } else if (trialDaysRemaining <= 7) {
      return 'bg-orange-600 hover:bg-orange-700 text-white';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  return (
    <div className={`border-l-4 p-4 mb-6 rounded ${getUrgencyClass()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 mr-3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">
              {trialDaysRemaining === 0
                ? 'Your trial has ended'
                : `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} left in your trial`}
            </p>
            <p className="text-sm mt-1">
              {trialDaysRemaining === 0
                ? 'Subscribe now to continue using all features'
                : 'Upgrade now to continue enjoying uninterrupted access'}
            </p>
          </div>
        </div>
        <Link
          href="/workspace/billing"
          className={`px-4 py-2 rounded font-medium transition-colors ${getButtonClass()}`}
        >
          {trialDaysRemaining === 0 ? 'Subscribe Now' : 'View Plans'}
        </Link>
      </div>
    </div>
  );
}
