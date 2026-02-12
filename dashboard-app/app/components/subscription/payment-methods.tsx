/**
 * Payment Methods
 * Shared component in subscription/payment-methods.tsx.
 */

'use client';

import { useState, useEffect } from 'react';

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface PaymentMethodsProps {
  customerId: string;
}

export function PaymentMethods({ customerId }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    loadPaymentMethods();
  }, [customerId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stripe/payment-methods?customerId=${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods);
      setDefaultPaymentMethodId(data.defaultPaymentMethodId);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const setAsDefault = async (paymentMethodId: string) => {
    try {
      setActionLoading(paymentMethodId);
      const response = await fetch('/api/stripe/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, paymentMethodId }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      setDefaultPaymentMethodId(paymentMethodId);
    } catch (err) {
      console.error('Error setting default:', err);
      alert(err instanceof Error ? err.message : 'Failed to set default payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setActionLoading(paymentMethodId);
      const response = await fetch(`/api/stripe/payment-methods?paymentMethodId=${paymentMethodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove payment method');
      }

      // Reload payment methods
      await loadPaymentMethods();
    } catch (err) {
      console.error('Error removing payment method:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Methods</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {paymentMethods.length === 0 ? (
        <p className="text-gray-600 text-sm">No payment methods on file.</p>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getCardIcon(pm.card.brand)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 capitalize">{pm.card.brand}</span>
                    <span className="text-gray-600">•••• {pm.card.last4}</span>
                    {pm.id === defaultPaymentMethodId && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Expires {pm.card.exp_month}/{pm.card.exp_year}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {pm.id !== defaultPaymentMethodId && (
                  <button
                    onClick={() => setAsDefault(pm.id)}
                    disabled={actionLoading === pm.id}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                  >
                    {actionLoading === pm.id ? 'Setting...' : 'Set as Default'}
                  </button>
                )}
                <button
                  onClick={() => removePaymentMethod(pm.id)}
                  disabled={actionLoading === pm.id}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                >
                  {actionLoading === pm.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <button
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          onClick={() => {
            alert('Card addition feature would redirect to Stripe Customer Portal or use Stripe Elements.');
          }}
        >
          + Add New Payment Method
        </button>
      </div>
    </div>
  );
}
