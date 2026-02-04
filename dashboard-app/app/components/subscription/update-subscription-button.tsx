'use client';

import { useState } from 'react';
import { updateSubscription } from '../../services/stripeService';

interface UpdateSubscriptionButtonProps {
  subscriptionId: string;
  currentPriceId?: string;
  newPriceId: string;
  packageName: string;
  billingCycle?: 'monthly' | 'annual';
  buttonText?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function UpdateSubscriptionButton({
  subscriptionId,
  currentPriceId,
  newPriceId,
  packageName,
  billingCycle = 'monthly',
  buttonText = 'Update Subscription',
  className = '',
  children,
  disabled,
  title,
  onSuccess,
  onError,
}: UpdateSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [changeType, setChangeType] = useState<'upgrade' | 'downgrade' | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const result = await updateSubscription({
        subscriptionId,
        currentPriceId,
        newPriceId,
        packageName,
        billingCycle,
      });

      if (result.success) {
        setSuccess(true);
        setChangeType(result.changeType);
        
        // For downgrades, calculate effective date (next billing period)
        if (result.changeType === 'downgrade' && result.subscription?.current_period_end) {
          setEffectiveDate(new Date(result.subscription.current_period_end * 1000));
        }
        
        // Wait for webhook to process before calling onSuccess (give it 2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        onSuccess?.(result);
        
        // Auto-hide success message after 5 seconds for downgrades (more info to read)
        setTimeout(() => {
          setSuccess(false);
        }, result.changeType === 'downgrade' ? 5000 : 3000);
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
      console.error('Subscription update error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    } finally {
      if (!error) {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <button
        onClick={handleUpdate}
        disabled={loading || success || disabled}
        title={title}
        className={`${className} ${
          loading || success || disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Updating...
          </span>
        ) : success ? (
          <span className="flex items-center justify-center">
            <svg className="h-5 w-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Updated!
          </span>
        ) : (
          children || buttonText
        )}
      </button>
      
      {success && changeType === 'upgrade' && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✓ Upgraded to {packageName} successfully!
          </p>
          <p className="text-xs text-green-700 mt-1">
            Your new plan is active immediately. You've been charged a prorated amount.
          </p>
        </div>
      )}

      {success && changeType === 'downgrade' && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            ✓ Downgrade to {packageName} scheduled successfully!
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Your plan will change to {packageName} on {effectiveDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            You'll continue to have access to your current plan until then.
          </p>
          <p className="text-xs text-blue-600 mt-1 font-medium">
            ⓘ During this transition period, you cannot make further plan changes. You can only cancel this scheduled downgrade.
          </p>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
