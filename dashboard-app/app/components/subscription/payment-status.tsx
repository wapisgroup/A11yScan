'use client';

import { useSubscription } from '../../hooks/use-subscription';
import { useEffect, useState } from 'react';

export function PaymentStatus() {
  const { subscription, statusMessage } = useSubscription();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    // Check URL params for payment status
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setShowSuccess(true);
      // Clear the URL param
      window.history.replaceState({}, '', window.location.pathname);
      // Auto-hide after 10 seconds
      setTimeout(() => setShowSuccess(false), 10000);
    }
    if (params.get('canceled') === 'true') {
      setShowCanceled(true);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setShowCanceled(false), 10000);
    }
  }, []);

  if (!subscription) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong className="font-medium">Payment successful!</strong> Your subscription is now active.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowSuccess(false)}
                className="inline-flex text-green-400 hover:text-green-500"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canceled Message */}
      {showCanceled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Checkout was canceled. You can try again when you're ready.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowCanceled(false)}
                className="inline-flex text-yellow-400 hover:text-yellow-500"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Status */}
      {subscription.status === 'past_due' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Payment Failed</h3>
              <p className="mt-1 text-sm text-red-700">
                Your recent payment failed. Please update your payment method to continue your subscription.
              </p>
            </div>
          </div>
        </div>
      )}

      {subscription.status === 'grace_period' && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Grace Period</h3>
              <p className="mt-1 text-sm text-orange-700">
                Your account is in a grace period. Update your payment method to restore full access.
              </p>
            </div>
          </div>
        </div>
      )}

      {subscription.cancelAtPeriodEnd && subscription.cancelAt && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Subscription Canceling</h3>
              <p className="mt-1 text-sm text-blue-700">
                Your subscription will end on{' '}
                {new Date(subscription.cancelAt.toDate()).toLocaleDateString()}.
                You'll retain access until then.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
