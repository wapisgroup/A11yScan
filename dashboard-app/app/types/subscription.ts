// Subscription Types & Interfaces
import { Timestamp } from 'firebase/firestore';

export type PackageId = 'basic' | 'starter' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type PaymentStatus = 'succeeded' | 'failed' | 'pending' | 'refunded';
export type SupportLevel = 'basic' | 'priority' | 'premium';

export interface PackageConfig {
  id: PackageId;
  name: string;
  displayName: string;
  description: string;
  pricing: {
    monthly: number;
    annual: number;
    currency: 'USD' | 'EUR' | 'GBP';
    annualDiscountPercent: number;
    stripeMonthlyPriceId: string | null;
    stripeAnnualPriceId: string | null;
  };
  trial: {
    enabled: boolean;
    durationDays: number;
  };
  limits: {
    activeProjects: number | 'unlimited';
    scansPerMonth: number | 'unlimited';
    pagesPerScan: number | 'unlimited';
    reportHistoryDays: number | 'unlimited';
    teamMembers: number | 'unlimited';
    apiCallsPerDay: number | null;
    scheduledScans: number | 'unlimited';
  };
  features: {
    pdfReports: boolean;
    whiteLabelReports: boolean;
    basicTeamAccess: boolean;
    teamCollaboration: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    multiDeviceTesting: boolean;
    cicdIntegration: boolean;
    webhookNotifications: boolean;
    scheduledScans: boolean;
    emailNotifications: boolean;
    slackNotifications: boolean;
    customIntegrations: boolean;
    dedicatedAccountManager: boolean;
    ssoAuth: boolean;
    onPremiseDeployment: boolean;
    advancedAnalytics: boolean;
    bulkOperations: boolean;
  };
  includedInLowerTier: {
    [key: string]: boolean;
  };
  previousTier: string;
  supportLevel: SupportLevel;
  supportResponseTime: string;
  isActive: boolean;
  displayOrder: number;
}

export interface Subscription {
  id: string;
  userId: string;
  organizationId: string | null;
  packageId: PackageId;
  status: SubscriptionStatus;

  // Stripe references
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;

  // Billing
  billingCycle: BillingCycle;
  currentPeriodStart: Date | Timestamp;
  currentPeriodEnd: Date | Timestamp;
  cancelAtPeriodEnd: boolean;

  // Trial
  trialStart: Date | Timestamp | null;
  trialEnd: Date | Timestamp | null;

  // Usage tracking
  currentUsage: {
    activeProjects: number;
    scansThisMonth: number;
    apiCallsToday: number;
    scheduledScans: number;
    usagePeriodStart?: Timestamp;
  };

  // Limits from package
  limits: {
    activeProjects: number | 'unlimited';
    scansPerMonth: number | 'unlimited';
    pagesPerScan: number | 'unlimited';
    apiCallsPerDay: number | 'unlimited' | null;
    scheduledScans: number | 'unlimited';
  };

  // Payment
  paymentMethod: {
    type: 'card';
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;

  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  canceledAt: Date | Timestamp | null;
  cancelReason: string | null;
}

export interface PaymentHistory {
  id: string;
  subscriptionId: string;
  userId: string;

  amount: number;
  currency: string;
  status: PaymentStatus;

  stripeInvoiceId: string | null;
  stripeChargeId: string | null;

  billingReason: 'subscription_create' | 'subscription_cycle' | 'subscription_update';

  failureCode: string | null;
  failureMessage: string | null;

  receiptUrl: string | null;
  invoiceUrl: string | null;

  createdAt: Date;
}

export interface OrganizationSubscriptionOverride {
  organizationId: string;
  basePackage: PackageId;
  customPricing?: {
    monthly?: number;
    annual?: number;
  };
  limitOverrides?: {
    activeProjects?: number | 'unlimited';
    scansPerMonth?: number | 'unlimited';
    pagesPerScan?: number | 'unlimited';
    reportHistoryDays?: number | 'unlimited';
    teamMembers?: number | 'unlimited';
    apiCallsPerDay?: number | null;
    scheduledScans?: number | 'unlimited';
  };
  featureOverrides?: {
    [key: string]: boolean;
  };
  previousTier: string, 
  notes?: string;
  approvedBy?: string;
  approvedAt: Date | null;
  expiresAt: Date | null;
}

export interface UsageLimits {
  activeProjects: {
    limit: number | 'unlimited';
    current: number;
    remaining: number | 'unlimited';
    percentage: number;
  };
  scansPerMonth: {
    limit: number | 'unlimited';
    current: number;
    remaining: number | 'unlimited';
    percentage: number;
  };
  teamMembers: {
    limit: number | 'unlimited';
    current: number;
    remaining: number | 'unlimited';
    percentage: number;
  };
  apiCallsPerDay: {
    limit: number | null;
    current: number;
    remaining: number | null;
    percentage: number;
  };
}
