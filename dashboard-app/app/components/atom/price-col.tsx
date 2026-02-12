/**
 * Price Col
 * Shared component in atom/price-col.tsx.
 */

import { PackageConfig } from "@/types/subscription"
import { capitalizeFirst } from "@/ui-helpers/default";
import { UpdateSubscriptionButton } from "../subscription/update-subscription-button";
import { SUBSCRIPTION_PACKAGES } from "@/config/subscriptions";

type PriceColProps = {
    packageKey: string;
    config: PackageConfig;
    stripeSubscriptionId: string | null;
    currentPackageId: string | null;
    currentPriceId?: string | null;
    hasScheduledChange?: boolean;
    onSuccess?: (data: any) => void;
}

export const PriceCol = ({ packageKey, config, stripeSubscriptionId, currentPackageId, currentPriceId, hasScheduledChange, onSuccess }: PriceColProps) => {

    const limits: Record<string, any> = {
        activeProjects: { value: config.limits.activeProjects, title: "{%} projects" },
        scansPerMonth: { value: 500, title: "{%} scans/month" },
        pagesPerScan: { value: 2000, title: "{%} pages per scan" },
        scheduledScans: { value: 10, title: "{%} scheduled scans" },
    }

    const features: Record<string, any> = {
        pdfReports: { value: config.features.pdfReports, title: "PDF Reports" },
        whiteLabelReports: { value: config.features.whiteLabelReports, title: "White-label Reports" },
        basicTeamAccess: { value: config.features.basicTeamAccess, title: "Basic Team Access" },
        teamCollaboration: { value: config.features.teamCollaboration, title: "Team Collaboration" },
        apiAccess: { value: config.features.apiAccess, title: "API Access" },
        prioritySupport: { value: config.features.prioritySupport, title: "Priority Support" },
        multiDeviceTesting: { value: config.features.multiDeviceTesting, title: "Multi-device Testing" },
        cicdIntegration: { value: config.features.cicdIntegration, title: "CI/CD Integration" },
        webhookNotifications: { value: config.features.webhookNotifications, title: "Webhook Notifications" },
        scheduledScans: { value: config.features.scheduledScans, title: "Scheduled Scans" },
        emailNotifications: { value: config.features.emailNotifications, title: "Email Notifications" },
        slackNotifications: { value: config.features.slackNotifications, title: "Slack Notifications" },
        customIntegrations: { value: config.features.customIntegrations, title: "Custom Integrations" },
        dedicatedAccountManager: { value: config.features.dedicatedAccountManager, title: "Dedicated Account Manager" },
        ssoAuth: { value: config.features.ssoAuth, title: "SSO Authentication" },
        onPremiseDeployment: { value: config.features.onPremiseDeployment, title: "On-Premise Deployment" },
        advancedAnalytics: { value: config.features.advancedAnalytics, title: "Advanced Analytics" },
        bulkOperations: { value: config.features.bulkOperations, title: "Bulk Operations" },
    }

    const showOnlyNew = !!config.previousTier && !!config.includedInLowerTier;
    const visibleFeatures = Object.entries(features).filter(([key, featureItem]) =>
        featureItem.value && (!showOnlyNew || !(key in config.includedInLowerTier))
    );
    const featuresTitle = config.previousTier ? `${capitalizeFirst(config.previousTier)} + following features` : "Features";

    /**
     * Public env lookup map.
     *
     * IMPORTANT:
     * - In Next.js client bundles, `process` may be undefined at runtime.
     * - Direct references like `process.env.NEXT_PUBLIC_*` are inlined at build time.
     * - Dynamic indexing like `process.env[someKey]` cannot be inlined and will fail.
     *
     * This map uses direct env references so values are safely inlined.
     */
    const PUBLIC_ENV: Record<string, string | undefined> = {
      STRIPE_BASIC_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY,
      STRIPE_BASIC_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL,
      STRIPE_STARTER_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY,
      STRIPE_STARTER_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL,
      STRIPE_PROFESSIONAL_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY,
      STRIPE_PROFESSIONAL_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_ANNUAL,
    };

    const getPublicEnv = (envKey: string | null | undefined): string | undefined => {
      if (!envKey) return undefined;
      return PUBLIC_ENV[envKey];
    };

    const newPriceId = getPublicEnv(config.pricing?.stripeMonthlyPriceId);

    const currentOrder = currentPackageId
      ? SUBSCRIPTION_PACKAGES[currentPackageId]?.displayOrder ?? 0
      : 0;

    const targetOrder = config.displayOrder ?? 0;

    const actionLabel = currentOrder && targetOrder && currentOrder > targetOrder
      ? "Downgrade"
      : "Upgrade";

    const isCurrentPlan = currentPackageId === config.id;
    const isDisabled = isCurrentPlan || hasScheduledChange;

    return (
        <div
            key={packageKey}
            className="bg-gradient-to-br from-cyan-50 to-purple-50 rounded-lg border-2 border-cyan-200 p-6 relative"
        >
            {/* <div className="absolute -top-3 right-4">
                <span className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    MOST POPULAR
                </span>
            </div> */}

            <h3 className="text-2xl font-bold text-gray-900 mb-2">{capitalizeFirst(config.displayName)}</h3>

            <p className="text-4xl font-bold text-cyan-600 mb-4">
                {/* example pricing – adjust to your config */}
                {config.pricing?.monthly ? `$${config.pricing.monthly}` : "—"}
                <span className="text-base font-normal text-gray-600">/month</span>
            </p>

            <ul className="space-y-2 mb-6">
                {Object.entries(limits).map(([key, limitItem]) => (
                    <li key={key} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm text-gray-700">{limitItem.title.replace("{%}", limitItem.value.toString())}</span>
                    </li>
                ))}
            </ul>

            <h4 className="text-md font-semibold text-gray-900 mb-2">{featuresTitle}</h4>
            <ul className="space-y-2">
                {visibleFeatures.map(([key, featureItem]) => (
                    <li key={key} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-sm text-gray-700">{featureItem.title}</span>
                    </li>
                ))}
            </ul>
            
            {stripeSubscriptionId && newPriceId && !isCurrentPlan && (
            <UpdateSubscriptionButton
                subscriptionId={stripeSubscriptionId}
                newPriceId={newPriceId}
                currentPriceId={currentPriceId}
                packageName={config.id}
                disabled={hasScheduledChange}
                className={`mt-10 w-full font-semibold py-2 px-4 rounded-lg transition-colors ${
                  hasScheduledChange
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                }`}
                title={hasScheduledChange ? "You have a pending plan change. Cancel it first to make new changes." : undefined}
                onSuccess={(data) => {
                    // Reload subscription data
                    onSuccess && onSuccess(data);
                }}
            >
                {actionLabel} to {capitalizeFirst(config.displayName)}
            </UpdateSubscriptionButton>) || (
            <button
                disabled={true}
                className="mt-10 w-full bg-gray-300 text-gray-600 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                title="Current Plan"
            >
                Current Plan
            </button>
            )}
        </div>
    )
}