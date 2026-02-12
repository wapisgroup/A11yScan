/**
 * Start Trial Button
 * Shared component in subscription/start-trial-button.tsx.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTrialSubscription } from '../../services/subscriptionService';

interface StartTrialButtonProps {
  userId: string;
  organizationId: string;
  buttonText?: string;
  className?: string;
}

export function StartTrialButton({
  userId,
  organizationId,
  buttonText = 'Start Free Trial',
  className = '',
}: StartTrialButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create trial subscription directly in Firestore
      await createTrialSubscription(userId, organizationId);

      // Redirect to workspace
      router.push('/workspace');
    } catch (err) {
      console.error('Trial creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start trial');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleStartTrial}
        disabled={loading}
        className={`${className} ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Starting Trial...
          </span>
        ) : (
          buttonText
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
