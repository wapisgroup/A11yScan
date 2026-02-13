"use client";

import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { useSubscription } from '../../hooks/use-subscription';
import { useAuth, db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UpdateSubscriptionButton } from '../../components/subscription/update-subscription-button';
import { PaymentMethods } from '../../components/subscription/payment-methods';
import { ScheduledChangeBanner } from '../../components/subscription/scheduled-change-banner';
import { CancelScheduledBanner } from '../../components/subscription/cancel-scheduled-banner';
import { TrialStatusBanner } from '../../components/subscription/trial-status-banner';
import { ExtendTrialModal } from '../../components/subscription/extend-trial-modal';
import { CheckoutModal } from '../../components/subscription/checkout-modal';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../../services/stripeService';
import { useState, useEffect } from 'react';
import { getUserSubscription, getUsageLimits, getTrialDaysRemaining, getStatusMessage } from '../../services/subscriptionService';
import { getAllPackages, SUBSCRIPTION_PACKAGES } from '../../config/subscriptions';
import { getInvoices, cancelSubscription } from '../../services/stripeService';
import { PriceCol } from "@/components/atom/price-col";
import { PageWrapper } from "@/components/molecule/page-wrapper";

function BillingPageContent() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [usageLimits, setUsageLimits] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'payment-methods'>('overview');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<{
    packageName: string;
    packageDisplayName: string;
    price: number;
    existingSubscriptionId?: string;
  } | null>(null);
  const trialStatuses = new Set(['trial', 'trialing']);

  const handleCancelSubscription = async () => {
    if (!subscription?.stripeSubscriptionId) return;

    const isTrialSubscription = trialStatuses.has(String(subscription?.status || '').toLowerCase());
    const effectiveEnd = getTrialEndDisplayValue(subscription) || subscription.currentPeriodEnd || subscription.cancelAt;
    const confirmMessage = isTrialSubscription
      ? `Are you sure you want to cancel your trial?\n\n` +
        `• Your trial access will stop on ${formatDate(effectiveEnd)}\n` +
        `• You will not be charged\n` +
        `• You can start a paid plan any time from Billing\n` +
        `• All your data will be preserved`
      : `Are you sure you want to cancel your subscription?\n\n` +
        `• You'll keep access until ${formatDate(subscription.currentPeriodEnd)}\n` +
        `• No refunds will be issued for the current period\n` +
        `• You can reactivate anytime before the cancellation date\n` +
        `• All your data will be preserved\n\n` +
        `Consider downgrading to a lower plan instead of cancelling completely.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setCancellingSubscription(true);
      await cancelSubscription(subscription.stripeSubscriptionId);
      
      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload to show cancel banner
      window.location.reload();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const loadSubscription = async () => {
      try {
        // First, get user profile to find their organization ID
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          console.error('User profile not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUserProfile(userData);

        const organizationId = userData.organisationId;
        if (!organizationId) {
          console.error('User has no organization ID');
          setLoading(false);
          return;
        }

        // Fetch subscription
        const sub = await getUserSubscription(user.uid);
        setSubscription(sub);

        // Fetch organization data to get stripeCustomerId
        const orgDoc = await getDoc(doc(db, 'organisations', organizationId));
        if (orgDoc.exists()) {
          setOrganization(orgDoc.data());
        }

        if (sub) {
          const packageLimits = getAllPackages().find(p => p.id === sub.packageId)?.limits;
          const limits = await getUsageLimits(sub, packageLimits);
          console.log('Usage Limits:', limits);
          setUsageLimits(limits);
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user]);

  useEffect(() => {
    if (!organization?.stripeCustomerId) return;

    const loadInvoices = async () => {
      try {
        setLoadingInvoices(true);
        const invoiceList = await getInvoices(organization.stripeCustomerId);
        setInvoices(invoiceList);
      } catch (error) {
        console.error('Error loading invoices:', error);
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadInvoices();
  }, [organization?.stripeCustomerId]);

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.round((used / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getTrialEndDisplayValue = (sub: any) => {
    if (!sub) return null;
    return sub.trialEndsAt || sub.trialEnd || sub.trialEndDate || sub.currentPeriodEnd || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">No active subscription found. Please select a plan.</p>
        </div>
      </div>
    );
  }

  const packageConfig = getAllPackages().find(p => p.id === subscription.packageId);
  const isTrial = trialStatuses.has(String(subscription.status || '').toLowerCase());
  const trialDaysRemaining = isTrial ? getTrialDaysRemaining(subscription) : 0;
  const statusMessage = getStatusMessage(subscription);

  return (
      <>
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${activeTab === 'overview'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`${activeTab === 'invoices'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Invoices & History
          </button>
          <button
            onClick={() => setActiveTab('payment-methods')}
            className={`${activeTab === 'payment-methods'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Payment Methods
          </button>
        </nav>
      </div>
      

      {/* Trial Status Banner - shown for all trialing users */}
      {activeTab === 'overview' && isTrial && subscription.stripeSubscriptionId && (
        <>
          <TrialStatusBanner
            daysRemaining={trialDaysRemaining}
            hasPaymentMethod={!!subscription.hasPaymentMethod}
            trialExtended={!!subscription.trialExtended}
            subscriptionId={subscription.stripeSubscriptionId}
            customerId={organization?.stripeCustomerId || subscription.stripeCustomerId || ''}
            onExtendTrial={() => setShowExtendModal(true)}
            onConvertSuccess={() => window.location.reload()}
          />
          {showExtendModal && (organization?.stripeCustomerId || subscription.stripeCustomerId) && (
            <Elements stripe={getStripe()}>
              <ExtendTrialModal
                isOpen={showExtendModal}
                onClose={() => setShowExtendModal(false)}
                subscriptionId={subscription.stripeSubscriptionId}
                customerId={organization?.stripeCustomerId || subscription.stripeCustomerId}
                onSuccess={() => {
                  setShowExtendModal(false);
                  window.location.reload();
                }}
              />
            </Elements>
          )}
        </>
      )}

      {/* Payment Failed Banner */}
      {subscription.status === 'past_due' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-800 font-medium">Payment Failed</p>
              <p className="text-red-700 text-sm">Please update your payment method to continue service</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Scheduled Banner - Show if subscription is set to cancel at period end */}
      {activeTab === 'overview' && subscription.cancelAtPeriodEnd && subscription.cancelAt && (
        <CancelScheduledBanner
          subscriptionId={subscription.stripeSubscriptionId}
          cancelDate={subscription.cancelAt?.toDate?.() || new Date()}
          currentPlan={packageConfig?.displayName || 'Unknown'}
          onReactivated={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Scheduled Change Banner - Show if there's a scheduled downgrade (NOT if cancelling) */}
      {activeTab === 'overview' && subscription.scheduledChange && !subscription.cancelAtPeriodEnd && (() => {
        const scheduledPackageConfig = getAllPackages().find(p => p.id === subscription.scheduledChange.packageId);
        return (
          <ScheduledChangeBanner
            currentPlanDisplayName={packageConfig?.displayName || 'Unknown'}
            currentPackageId={subscription.packageId}
            scheduledPlanDisplayName={scheduledPackageConfig?.displayName || subscription.scheduledChange.packageName}
            effectiveDate={subscription.scheduledChange.effectiveDate?.toDate?.() || new Date()}
            subscriptionId={subscription.stripeSubscriptionId}
            currentBillingCycle={subscription.billingCycle || 'monthly'}
            onCancelled={() => {
              // Reload subscription data
              window.location.reload();
            }}
          />
        );
      })()}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Current Plan Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{packageConfig?.displayName || 'Unknown Plan'}</h2>
                <p className="text-sm text-gray-600 mt-1">{statusMessage}</p>
              </div>
              <div className="text-right">
                {!isTrial && packageConfig?.pricing?.monthly && (
                  <p className="text-3xl font-bold text-gray-900">
                    ${packageConfig.pricing.monthly}
                    <span className="text-base font-normal text-gray-600">/mo</span>
                  </p>
                )}
                {isTrial && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Free Trial
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Billing Cycle</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {subscription.billingCycle || 'N/A'}
                </p>
              </div>
              {isTrial && getTrialEndDisplayValue(subscription) && (
                <div>
                  <p className="text-sm text-gray-600">Trial Ends</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(getTrialEndDisplayValue(subscription))}</p>
                </div>
              )}
              {!isTrial && subscription.currentPeriodStart && (
                <div>
                  <p className="text-sm text-gray-600">Current Period Start</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(subscription.currentPeriodStart)}</p>
                </div>
              )}
              {!isTrial && subscription.currentPeriodEnd && (
                <div>
                  <p className="text-sm text-gray-600">Current Period End</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(subscription.currentPeriodEnd)}</p>
                </div>
              )}
            </div>

            {/* Cancel Subscription/Trial - allow for both paid and trial Stripe subscriptions */}
            {subscription.stripeSubscriptionId && !subscription.cancelAtPeriodEnd && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancellingSubscription}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingSubscription ? 'Cancelling...' : isTrial ? 'Cancel Trial' : 'Cancel Subscription'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  You'll keep access until {formatDate(isTrial ? getTrialEndDisplayValue(subscription) : subscription.currentPeriodEnd)}
                </p>
              </div>
            )}
          </div>

          {/* Usage Statistics */}
          {usageLimits && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage This Period</h2>

              <div className="space-y-4">
                {/* Active Projects */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Active Projects</span>
                    <span className="text-sm text-gray-600">
                      {usageLimits.activeProjects.used} / {usageLimits.activeProjects.limit === -1 ? '∞' : usageLimits.activeProjects.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usageLimits.activeProjects.used, usageLimits.activeProjects.limit))}`}
                      style={{ width: `${Math.min(getUsagePercentage(usageLimits.activeProjects.used, usageLimits.activeProjects.limit), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Scans This Month */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Scans This Month</span>
                    <span className="text-sm text-gray-600">
                      {usageLimits.scansThisMonth.used} / {usageLimits.scansThisMonth.limit === -1 ? '∞' : usageLimits.scansThisMonth.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usageLimits.scansThisMonth.used, usageLimits.scansThisMonth.limit))}`}
                      style={{ width: `${Math.min(getUsagePercentage(usageLimits.scansThisMonth.used, usageLimits.scansThisMonth.limit), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Scheduled Scans */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Scheduled Scans</span>
                    <span className="text-sm text-gray-600">
                      {usageLimits.scheduledScans.used} / {usageLimits.scheduledScans.limit === -1 ? '∞' : usageLimits.scheduledScans.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usageLimits.scheduledScans.used, usageLimits.scheduledScans.limit))}`}
                      style={{ width: `${Math.min(getUsagePercentage(usageLimits.scheduledScans.used, usageLimits.scheduledScans.limit), 100)}%` }}
                    />
                  </div>
                </div>

                {/* API Calls Today */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">API Calls Today</span>
                    <span className="text-sm text-gray-600">
                      {usageLimits.apiCallsToday.used} / {usageLimits.apiCallsToday.limit === -1 ? '∞' : usageLimits.apiCallsToday.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usageLimits.apiCallsToday.used, usageLimits.apiCallsToday.limit))}`}
                      style={{ width: `${Math.min(getUsagePercentage(usageLimits.apiCallsToday.used, usageLimits.apiCallsToday.limit), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Options - Only show if on trial or Basic */}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upgrade Your Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {
                Object.entries(SUBSCRIPTION_PACKAGES).map(([key, config]) => (
                  <PriceCol
                    packageKey={key}
                    key={key}
                    config={config}
                    stripeSubscriptionId={subscription?.stripeSubscriptionId || null}
                    currentPackageId={subscription?.packageId || null}
                    currentPriceId={subscription?.stripePriceId || null}
                    hasScheduledChange={!!subscription?.scheduledChange}
                    hasPaymentMethod={!!subscription?.hasPaymentMethod}
                    isTrialing={isTrial}
                    userId={user?.uid}
                    organizationId={userProfile?.organisationId}
                    email={user?.email || userProfile?.email || ''}
                    organizationStripeCustomerId={organization?.stripeCustomerId || subscription?.stripeCustomerId}
                    onSuccess={(data) => {
                      console.log('Subscription updated successfully:', data);
                      window.location.reload();
                    }}
                    onCheckout={(pkgName, pkgDisplayName, price, existingSubId) => {
                      setCheckoutTarget({ packageName: pkgName, packageDisplayName: pkgDisplayName, price, existingSubscriptionId: existingSubId });
                    }} />
                ))
              }
            </div>
          </div>

          {/* Inline Checkout Modal */}
          {checkoutTarget && user?.uid && userProfile?.organisationId && (
            <Elements stripe={getStripe()}>
              <CheckoutModal
                isOpen={!!checkoutTarget}
                onClose={() => setCheckoutTarget(null)}
                packageName={checkoutTarget.packageName}
                packageDisplayName={checkoutTarget.packageDisplayName}
                billingCycle="monthly"
                price={checkoutTarget.price}
                userId={user.uid}
                organizationId={userProfile.organisationId}
                email={user.email || ''}
                existingSubscriptionId={checkoutTarget.existingSubscriptionId}
                onSuccess={() => {
                  setCheckoutTarget(null);
                  window.location.reload();
                }}
              />
            </Elements>
          )}
        </>
      )}

      {/* Invoices & History Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Invoice History</h2>

          {loadingInvoices ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
              <p className="mt-1 text-sm text-gray-500">Your invoice history will appear here once you have a subscription.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="my-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Invoice</th>
                    <th scope="col">Description</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        {new Date(invoice.created * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}s
                      </td>
                      <td className="font-medium">
                        {invoice.number || invoice.id.slice(-8)}
                      </td>
                      <td >
                        <div>{invoice.description || 'Subscription payment'}</div>
                        {invoice.periodStart && invoice.periodEnd && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(invoice.periodStart * 1000).toLocaleDateString()} - {new Date(invoice.periodEnd * 1000).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td>
                        {(invoice.amount / 100).toFixed(2)} {invoice.currency?.toUpperCase() || 'USD'}
                      </td>
                      <td>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'open'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="font-medium">
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <svg className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </a>
                        )}
                        {invoice.hostedInvoiceUrl && (
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-900"
                          >
                            <svg className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment-methods' && organization?.stripeCustomerId && (
        <PaymentMethods customerId={organization.stripeCustomerId} />
      )}

      {activeTab === 'payment-methods' && !organization?.stripeCustomerId && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h2>
          <p className="text-gray-600">No payment methods available. Please subscribe to a plan first.</p>
        </div>
      )}
      </>
  );
}

export default function BillingPage() {
  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageWrapper title="Billing & Subscription">
        <BillingPageContent />
        </PageWrapper>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
