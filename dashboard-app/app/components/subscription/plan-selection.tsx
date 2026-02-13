/**
 * Plan Selection
 * Shared component in subscription/plan-selection.tsx.
 */

'use client';

import { useEffect, useState } from 'react';
import { db, useAuth } from '../../utils/firebase';
import { getAllPackages } from '../../config/subscriptions';
import { PackageConfig } from '../../types/subscription';
import { StartTrialButton } from './start-trial-button';
import { CheckoutModal } from './checkout-modal';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../../services/stripeService';
import { doc, getDoc } from 'firebase/firestore';

export function PlanSelection() {
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const packages = getAllPackages();
    const [organisationId, setOrganisationId] = useState<string>('');
    const [checkoutTarget, setCheckoutTarget] = useState<{
        packageName: string;
        packageDisplayName: string;
        price: number;
    } | null>(null);

    const formatPrice = (pkg: PackageConfig): string => {
        if (pkg.pricing.monthly === 0) return 'Custom';

        const price = billingCycle === 'monthly'
            ? pkg.pricing.monthly
            : Math.round(pkg.pricing.annual / 12);

        return `$${price}`;
    };

    useEffect(() => {
        const getOrganizationId = async () => {
            if (!user) {
                return;
            }

            try {

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setOrganisationId(userDoc.data().organisationId);
                }
            } catch (error) {
                console.error("Error checking subscription:", error);
            }
        };

        getOrganizationId();
    }, [user]);

    const getAnnualSavings = (pkg: PackageConfig): string => {
        if (pkg.pricing.monthly === 0) return '';

        const monthlyTotal = pkg.pricing.monthly * 12;
        const savings = monthlyTotal - pkg.pricing.annual;

        return `Save $${savings}/year`;
    };

    const isPopular = (pkgName: string): boolean => {
        return pkgName === 'starter';
    };

    const featuresList: Record<string, string[]> = {
        basic: [
            '3 Active Projects',
            '50 Scans/month',
            '100 Pages per scan',
            'PDF Reports',
            'Email Notifications',
            '1 Team Member',
            '1 Scheduled Scan',
            '30 days report history',
            'Basic Support (48h)',
        ],
        starter: [
            '10 Active Projects',
            '200 Scans/month',
            '500 Pages per scan',
            'White-label Reports',
            'API Access (500/day)',
            '5 Team Members',
            '10 Scheduled Scans',
            'Team Collaboration',
            'Multi-device Testing',
            'Slack Notifications',
            '90 days report history',
            'Priority Support (24h)',
        ],
        professional: [
            'Unlimited Projects',
            '1,000 Scans/month',
            '2,000 Pages per scan',
            'Advanced Analytics',
            'API Access (5,000/day)',
            '20 Team Members',
            'Unlimited Scheduled Scans',
            'CI/CD Integration',
            'Webhook Notifications',
            'Bulk Operations',
            '365 days report history',
            'Priority Support (12h)',
        ],
        enterprise: [
            'Unlimited Everything',
            'Custom Solutions',
            'Unlimited API Access',
            'Unlimited Team Members',
            'SSO Authentication',
            'On-premise Deployment',
            'Custom Integrations',
            'Dedicated Account Manager',
            'Premium Support (4h)',
            'SLA Guarantees',
        ],
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Choose Your Plan
                </h1>
                <p className="text-xl text-gray-600">
                    Start with a 14-day free trial on our Basic plan. No credit card required.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
                <span className={`mr-3 text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Monthly
                </span>
                <button
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
                <span className={`ml-3 text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Annual
                    <span className="ml-2 text-green-600 font-semibold">(Save 20%)</span>
                </span>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {packages.map((pkg) => {
                    const popular = isPopular(pkg.name);

                    return (
                        <div
                            key={pkg.id}
                            className={`relative bg-white rounded-lg shadow-lg border-2 ${popular ? 'border-blue-600' : 'border-gray-200'
                                } overflow-hidden`}
                        >
                            {popular && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-semibold rounded-bl">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="p-6">
                                {/* Plan Name */}
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {pkg.displayName}
                                </h3>
                                <p className="text-gray-600 text-sm mb-6 h-12">
                                    {pkg.description}
                                </p>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold text-gray-900">
                                            {formatPrice(pkg)}
                                        </span>
                                        {pkg.pricing.monthly !== 0 && (
                                            <span className="ml-2 text-gray-600">/month</span>
                                        )}
                                    </div>
                                    {billingCycle === 'annual' && pkg.pricing.monthly !== 0 && (
                                        <p className="text-sm text-green-600 font-medium mt-1">
                                            {getAnnualSavings(pkg)}
                                        </p>
                                    )}
                                    {pkg.trial.enabled && (
                                        <p className="text-sm text-blue-600 font-medium mt-1">
                                            14-day free trial included
                                        </p>
                                    )}
                                </div>

                                {/* CTA Button */}
                                {pkg.pricing.monthly === 0 ? (
                                    <button className="w-full py-3 px-4 rounded-lg font-semibold transition-colors bg-gray-100 hover:bg-gray-200 text-gray-900">
                                        Contact Sales
                                    </button>
                                ) : !user ? (
                                    <button
                                        onClick={() => window.location.href = '/auth/register'}
                                        className="w-full py-3 px-4 rounded-lg font-semibold transition-colors bg-gray-100 hover:bg-gray-200 text-gray-900"
                                    >
                                        Sign Up to Subscribe
                                    </button>
                                ) : pkg.name === 'basic' && pkg.trial.enabled ? (
                                    <StartTrialButton
                                        userId={user.uid}
                                        organizationId={user.uid}
                                        email={user.email || ''}
                                        buttonText="Start Free Trial"
                                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${popular
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                            }`}
                                    />
                                ) : (
                                    <button
                                        onClick={() => {
                                            const price = billingCycle === 'monthly'
                                                ? pkg.pricing.monthly
                                                : pkg.pricing.annual;
                                            setCheckoutTarget({
                                                packageName: pkg.name,
                                                packageDisplayName: pkg.displayName,
                                                price,
                                            });
                                        }}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${popular
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                            }`}
                                    >
                                        Subscribe
                                    </button>
                                )}

                                {/* Features List */}
                                <ul className="mt-6 space-y-3">
                                    {featuresList[pkg.name].map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <svg
                                                className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FAQ or Additional Info */}
            <div className="mt-16 text-center">
                <p className="text-gray-600">
                    All plans include SSL security, automatic backups, and 99.9% uptime SLA.
                </p>
                <p className="text-gray-600 mt-2">
                    Need help choosing? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact our sales team</a>
                </p>
            </div>

            {/* Inline Checkout Modal */}
            {checkoutTarget && user && organisationId && (
                <Elements stripe={getStripe()}>
                    <CheckoutModal
                        isOpen={!!checkoutTarget}
                        onClose={() => setCheckoutTarget(null)}
                        packageName={checkoutTarget.packageName}
                        packageDisplayName={checkoutTarget.packageDisplayName}
                        billingCycle={billingCycle}
                        price={checkoutTarget.price}
                        userId={user.uid}
                        organizationId={organisationId}
                        email={user.email || ''}
                        onSuccess={() => {
                            setCheckoutTarget(null);
                            window.location.href = '/workspace/billing?success=true';
                        }}
                    />
                </Elements>
            )}
        </div>
    );
}
