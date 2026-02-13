'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { extendTrial } from '../../services/stripeService';

interface ExtendTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
  customerId: string;
  onSuccess: (newTrialEnd: number) => void;
}

export function ExtendTrialModal({
  isOpen,
  onClose,
  subscriptionId,
  customerId,
  onSuccess,
}: ExtendTrialModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newTrialEnd, setNewTrialEnd] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create payment method from card element
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'Failed to process card');
        return;
      }

      if (!paymentMethod) {
        setError('Failed to create payment method');
        return;
      }

      // Call extend trial API
      const result = await extendTrial({
        subscriptionId,
        customerId,
        paymentMethodId: paymentMethod.id,
      });

      setSuccess(true);
      setNewTrialEnd(result.newTrialEnd);
      onSuccess(result.newTrialEnd);
    } catch (err) {
      console.error('Error extending trial:', err);
      setError(err instanceof Error ? err.message : 'Failed to extend trial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-4">
            <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Trial Extended!</h3>
            <p className="text-gray-600 mb-4">
              Your trial has been extended by 7 days.
              {newTrialEnd && (
                <span className="block mt-1 font-medium">
                  New trial end: {new Date(newTrialEnd * 1000).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Extend Your Trial</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add a payment method to extend your trial by 7 days. You won&apos;t be charged until the trial ends.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Details
                </label>
                <div className="border border-gray-300 rounded-lg p-3">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#374151',
                          '::placeholder': { color: '#9CA3AF' },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !stripe}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Add Card & Extend Trial'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
