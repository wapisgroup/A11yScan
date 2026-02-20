/**
 * Scheduled Change Banner
 * Shared component in subscription/scheduled-change-banner.tsx.
 */

'use client';

import { useState } from 'react';
import { cancelScheduledChange } from '../../services/stripeService';

interface ScheduledChangeBannerProps {
  currentPlanDisplayName: string;
  currentPackageId: string;
  scheduledPlanDisplayName: string;
  effectiveDate: Date;
  subscriptionId: string;
  currentBillingCycle: string;
  onCancelled?: () => void;
}

export function ScheduledChangeBanner({
  currentPlanDisplayName,
  currentPackageId,
  scheduledPlanDisplayName,
  effectiveDate,
  subscriptionId,
  currentBillingCycle,
  onCancelled,
}: ScheduledChangeBannerProps) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this scheduled plan change? You can schedule a new change afterwards.')) {
      return;
    }

    try {
      setCancelling(true);
      setError(null);

      await cancelScheduledChange({
        subscriptionId,
        currentPackageName: currentPackageId,
        currentBillingCycle,
      });

      // Wait for webhook to process (give it 2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      onCancelled?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel scheduled change');
    } finally {
      setCancelling(false);
    }
  };

  const formattedDate = effectiveDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <svg className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <p className="text-blue-900 font-semibold text-lg mb-1">
              Scheduled Plan Change
            </p>
            <p className="text-blue-800 text-sm mb-2">
              Your plan will change from <span className="font-semibold">{currentPlanDisplayName}</span> to{' '}
              <span className="font-semibold">{scheduledPlanDisplayName}</span> on{' '}
              <span className="font-semibold">{formattedDate}</span>.
            </p>
            
            {/* Information boxes */}
            <div className="mt-4 space-y-2">
              <div className="bg-blue-100 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-900 font-medium mb-1">ℹ️ What happens now:</p>
                <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                  <li>You'll continue to have full access to your current <strong>{currentPlanDisplayName}</strong> plan</li>
                  <li>No charges until {formattedDate}</li>
                  <li>On {formattedDate}, you'll be charged for the <strong>{scheduledPlanDisplayName}</strong> plan</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-900 font-medium mb-1">⚠️ Limitations during transition:</p>
                <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                  <li>You <strong>cannot</strong> upgrade or downgrade to another plan</li>
                  <li>You <strong>can only</strong> cancel this scheduled change (button below)</li>
                  <li>After cancelling, you can schedule a new plan change</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                {error}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {cancelling ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cancelling...
            </span>
          ) : (
            'Cancel Change'
          )}
        </button>
      </div>
    </div>
  );
}
