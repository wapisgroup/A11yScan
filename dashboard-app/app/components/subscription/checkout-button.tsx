'use client';

import { useState } from 'react';
import { redirectToCheckout, updateSubscription } from '../../services/stripeService';
import { set } from 'sanity';

interface CheckoutButtonProps {
    type: 'subscribe' | 'update';
    packageName: string;
    billingCycle: 'monthly' | 'annual';
    userId?: string;
    organizationId?: string;
    email?: string;
    customerName?: string;
    organizationStripeCustomerId?: string;
    buttonText?: string;
    className?: string;
    subcriptionId?: string;
    productId?: string;
    children?: React.ReactNode;
}

export function CheckoutButton({
    type = 'subscribe',
    packageName,
    billingCycle,
    userId,
    organizationId,
    email,
    customerName,
    organizationStripeCustomerId,
    buttonText = 'Subscribe',
    subcriptionId,
    productId,
    className = '',
    children,
}: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!userId || !organizationId || !email) {
                setError('Missing required user or organization information');
                throw new Error('Missing required user or organization information');
            }

            if (type === 'subscribe') {
                await redirectToCheckout({
                    userId,
                    organizationId,
                    packageName,
                    billingCycle,
                    email,
                    customerName,
                    organizationStripeCustomerId,
                });
            } else if (type === 'update') {
                if (!subcriptionId || !productId) {
                    setError('Missing required subscription or product information');
                    throw new Error('Missing required subscription or product information');
                }
                await updateSubscription({subscriptionId: subcriptionId, newPriceId: productId})
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError(err instanceof Error ? err.message : 'Failed to start checkout');
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleCheckout}
                disabled={loading}
                className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''
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
                        Processing...
                    </span>
                ) : (
                    children || buttonText
                )}
            </button>
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
