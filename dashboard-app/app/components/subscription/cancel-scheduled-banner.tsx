'use client';

import { useState } from 'react';
import { reactivateSubscription } from '../../services/stripeService';

interface CancelScheduledBannerProps {
  subscriptionId: string;
  cancelDate: Date;
  currentPlan: string;
  onReactivated?: () => void;
}

export function CancelScheduledBanner({
  subscriptionId,
  cancelDate,
  currentPlan,
  onReactivated,
}: CancelScheduledBannerProps) {
  const [reactivating, setReactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReactivate = async () => {
    if (!confirm('Are you sure you want to continue your subscription? You\'ll keep your current plan and billing will continue as normal.')) {
      return;
    }

    try {
      setReactivating(true);
      setError(null);

      await reactivateSubscription(subscriptionId);

      // Wait for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      onReactivated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
    } finally {
      setReactivating(false);
    }
  };

  const formattedDate = cancelDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <svg className="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-red-900 font-semibold text-lg mb-1">
              Subscription Cancellation Scheduled
            </p>
            <p className="text-red-800 text-sm mb-2">
              Your <span className="font-semibold">{currentPlan}</span> subscription will be cancelled on{' '}
              <span className="font-semibold">{formattedDate}</span>.
            </p>
            
            {/* Information boxes */}
            <div className="mt-4 space-y-2">
              <div className="bg-red-100 border border-red-200 rounded-md p-3">
                <p className="text-xs text-red-900 font-medium mb-1">ℹ️ What happens now:</p>
                <ul className="text-xs text-red-800 space-y-1 ml-4 list-disc">
                  <li>You'll continue to have full access to your <strong>{currentPlan}</strong> plan</li>
                  <li>No charges after {formattedDate}</li>
                  <li>On {formattedDate}, your subscription will end and you'll lose access</li>
                  <li>You can reactivate anytime before {formattedDate}</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-900 font-medium mb-1">💡 Consider staying:</p>
                <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                  <li>All your projects and data will remain accessible if you reactivate</li>
                  <li>You can downgrade to a lower plan instead of cancelling</li>
                  <li>Contact support if you're having issues - we're here to help!</li>
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
          onClick={handleReactivate}
          disabled={reactivating}
          className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {reactivating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Reactivating...
            </span>
          ) : (
            'Keep My Subscription'
          )}
        </button>
      </div>
    </div>
  );
}
