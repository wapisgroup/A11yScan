'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { inlineCheckout } from '../../services/stripeService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
  packageDisplayName: string;
  billingCycle: 'monthly' | 'annual';
  price: number;
  userId: string;
  organizationId: string;
  email: string;
  existingSubscriptionId?: string;
  onSuccess: (data: { subscriptionId: string; status: string }) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  packageName,
  packageDisplayName,
  billingCycle,
  price,
  userId,
  organizationId,
  email,
  existingSubscriptionId,
  onSuccess,
}: CheckoutModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Business info fields
  const [showBusinessFields, setShowBusinessFields] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState('eu_vat');

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
        billing_details: {
          email,
          ...(businessName ? { name: businessName } : {}),
          ...(addressLine1 || country ? {
            address: {
              line1: addressLine1 || undefined,
              line2: addressLine2 || undefined,
              city: city || undefined,
              state: state || undefined,
              postal_code: postalCode || undefined,
              country: country || undefined,
            },
          } : {}),
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Failed to process card');
        return;
      }

      if (!paymentMethod) {
        setError('Failed to create payment method');
        return;
      }

      // Call inline checkout API
      const result = await inlineCheckout({
        userId,
        organizationId,
        email,
        packageName,
        billingCycle,
        paymentMethodId: paymentMethod.id,
        ...(businessName ? { businessName } : {}),
        ...(addressLine1 ? { addressLine1 } : {}),
        ...(addressLine2 ? { addressLine2 } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(postalCode ? { postalCode } : {}),
        ...(country ? { country } : {}),
        ...(taxId ? { taxId, taxIdType } : {}),
        ...(existingSubscriptionId ? { existingSubscriptionId } : {}),
      });

      // Handle 3D Secure / SCA
      if (result.requiresAction && result.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret);
        if (confirmError) {
          setError(confirmError.message || 'Payment confirmation failed');
          return;
        }
      }

      setSuccess(true);
      onSuccess({ subscriptionId: result.subscriptionId, status: result.status });
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const TAX_ID_TYPES = [
    { value: 'eu_vat', label: 'EU VAT' },
    { value: 'gb_vat', label: 'GB VAT' },
    { value: 'us_ein', label: 'US EIN' },
    { value: 'au_abn', label: 'AU ABN' },
    { value: 'ca_bn', label: 'CA BN' },
    { value: 'ch_vat', label: 'CH VAT' },
    { value: 'in_gst', label: 'IN GST' },
    { value: 'jp_cn', label: 'JP CN' },
    { value: 'nz_gst', label: 'NZ GST' },
    { value: 'sg_gst', label: 'SG GST' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Subscription Active!</h3>
            <p className="text-gray-600 mb-4">
              You are now subscribed to the <strong>{packageDisplayName}</strong> plan.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Subscribe to {packageDisplayName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              ${price}/{billingCycle === 'monthly' ? 'month' : 'year'}
              {existingSubscriptionId && ' — your trial will end and billing starts now'}
            </p>

            <form onSubmit={handleSubmit}>
              {/* Card Details */}
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

              {/* Business / VAT toggle */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowBusinessFields(!showBusinessFields)}
                  className="text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center"
                >
                  <svg
                    className={`h-4 w-4 mr-1 transition-transform ${showBusinessFields ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Purchasing as a business? Add VAT / billing details
                </button>
              </div>

              {showBusinessFields && (
                <div className="mb-4 space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Acme Inc."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="123 Main St"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Suite 100"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State / Region</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. DE, NL, US"
                        maxLength={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase"
                      />
                    </div>
                  </div>

                  {/* Tax ID */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID Type</label>
                      <select
                        value={taxIdType}
                        onChange={(e) => setTaxIdType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {TAX_ID_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID Number</label>
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        placeholder="e.g. DE123456789"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Subscribe — $${price}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
