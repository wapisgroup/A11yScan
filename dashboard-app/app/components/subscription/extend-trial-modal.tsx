'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { extendTrial } from '../../services/stripeService';
import { UIButton } from '@/components/ui/ui-button';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[var(--color-border-light)] max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-light)]">
          <h3 className="as-h4-text primary-text-color">Extend Your Trial</h3>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-lg hover:bg-[var(--color-bg-light)] secondary-text-color transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">

        {success ? (
          <div className="text-center py-4">
            <svg className="mx-auto h-12 w-12 text-[var(--color-success)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="as-h4-text primary-text-color mb-2">Trial Extended!</h3>
            <p className="as-p2-text secondary-text-color mb-4">
              Your trial has been extended by 7 days.
              {newTrialEnd && (
                <span className="block mt-1 font-medium primary-text-color">
                  New trial end: {new Date(newTrialEnd * 1000).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
              )}
            </p>
            <UIButton onClick={onClose}>Done</UIButton>
          </div>
        ) : (
          <>
            <p className="as-p2-text secondary-text-color mb-4">
              Add a payment method to extend your trial by 7 days. You won&apos;t be charged until the trial ends.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block as-p2-text primary-text-color mb-2">Card Details</label>
                <div className="border border-[var(--color-border-medium)] rounded-lg p-3 bg-[var(--color-bg-light)]">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#0F172A',
                          '::placeholder': { color: '#94A3B8' },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {error && (
                <p className="mb-4 as-p3-text text-[var(--color-error)]">{error}</p>
              )}

              <div className="flex gap-3">
                <UIButton type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </UIButton>
                <UIButton type="submit" className="flex-1" disabled={loading || !stripe}>
                  {loading ? 'Processing...' : 'Add Card & Extend Trial'}
                </UIButton>
              </div>
            </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
