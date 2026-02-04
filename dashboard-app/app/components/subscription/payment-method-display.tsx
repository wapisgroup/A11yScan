'use client';

import { useSubscription } from '../../hooks/use-subscription';
import { createCustomerPortalSession } from '../../services/stripeService';
import { useState } from 'react';

export function PaymentMethodDisplay() {
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!subscription || !subscription.stripeCustomerId) {
    return null;
  }

  const handleManagePayment = async () => {
    try {
      setLoading(true);
      const { url } = await createCustomerPortalSession(
        subscription.stripeCustomerId!
      );
      window.location.href = url;
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open payment management. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Payment Method
          </h3>
          <p className="text-sm text-gray-600">
            {subscription.paymentMethod?.brand 
              ? `${subscription.paymentMethod.brand.toUpperCase()} •••• ${subscription.paymentMethod.last4}`
              : 'No payment method on file'
            }
          </p>
          {subscription.paymentMethod?.expiryMonth && subscription.paymentMethod?.expiryYear && (
            <p className="text-xs text-gray-500 mt-1">
              Expires {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear}
            </p>
          )}
        </div>
        <button
          onClick={handleManagePayment}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Manage'}
        </button>
      </div>
    </div>
  );
}
