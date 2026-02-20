'use client';

import { useState } from 'react';
import { convertTrial } from '../../services/stripeService';

interface TrialStatusBannerProps {
  daysRemaining: number;
  hasPaymentMethod: boolean;
  trialExtended: boolean;
  subscriptionId: string;
  customerId: string;
  onExtendTrial: () => void;
  onConvertSuccess: () => void;
}

export function TrialStatusBanner({
  daysRemaining,
  hasPaymentMethod,
  trialExtended,
  subscriptionId,
  customerId,
  onExtendTrial,
  onConvertSuccess,
}: TrialStatusBannerProps) {
  const [converting, setConverting] = useState(false);

  const urgencyColor = daysRemaining <= 3
    ? 'bg-red-50 border-red-200'
    : daysRemaining <= 7
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-blue-50 border-blue-200';

  const textColor = daysRemaining <= 3
    ? 'text-red-800'
    : daysRemaining <= 7
      ? 'text-yellow-800'
      : 'text-blue-800';

  const subtextColor = daysRemaining <= 3
    ? 'text-red-700'
    : daysRemaining <= 7
      ? 'text-yellow-700'
      : 'text-blue-700';

  const handleConvert = async () => {
    try {
      setConverting(true);
      await convertTrial({ subscriptionId });
      onConvertSuccess();
    } catch (error) {
      console.error('Failed to convert trial:', error);
      alert('Failed to convert trial. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className={`mb-6 ${urgencyColor} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className={`h-6 w-6 ${subtextColor} mr-3`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className={`${textColor} font-medium`}>
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining in your trial
              {trialExtended && <span className="text-xs ml-2">(extended)</span>}
            </p>
            <p className={`${subtextColor} text-sm`}>
              {hasPaymentMethod
                ? 'Your card will be charged when the trial ends'
                : 'Add a payment method to extend your trial or subscribe'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          {!hasPaymentMethod && !trialExtended && (
            <button
              onClick={onExtendTrial}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              Extend Trial (+7 days)
            </button>
          )}
          {hasPaymentMethod && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
            >
              {converting ? 'Converting...' : 'Subscribe Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
