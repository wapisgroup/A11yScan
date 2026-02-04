import { PackageConfig } from '../types/subscription';

// Default subscription package configurations
// These can be overridden in Firestore: system/subscriptionPackages
export const SUBSCRIPTION_PACKAGES: Record<string, PackageConfig> = {
  basic: {
    id: 'basic',
    name: 'basic',
    displayName: 'Basic',
    description: 'Perfect for freelancers and small projects',
    pricing: {
      monthly: 49,
      annual: 470,
      currency: 'USD',
      annualDiscountPercent: 20,
      stripeMonthlyPriceId: 'STRIPE_BASIC_MONTHLY',
      stripeAnnualPriceId: 'STRIPE_BASIC_ANNUAL',
    },
    trial: {
      enabled: true,
      durationDays: 14,
    },
    limits: {
      activeProjects: 3,
      scansPerMonth: 50,
      pagesPerScan: 100,
      reportHistoryDays: 30,
      teamMembers: 1,
      apiCallsPerDay: null,
      scheduledScans: 1,
    },
    features: {
      pdfReports: true,
      whiteLabelReports: false,
      basicTeamAccess: true,
      teamCollaboration: false,
      apiAccess: false,
      prioritySupport: false,
      multiDeviceTesting: false,
      cicdIntegration: false,
      webhookNotifications: false,
      scheduledScans: true,
      emailNotifications: true,
      slackNotifications: false,
      customIntegrations: false,
      dedicatedAccountManager: false,
      ssoAuth: false,
      onPremiseDeployment: false,
      advancedAnalytics: false,
      bulkOperations: false,
    },
    supportLevel: 'basic',
    supportResponseTime: '48 hours',
    isActive: true,
    displayOrder: 1,
  },

  starter: {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    description: 'For growing teams and agencies',
    pricing: {
      monthly: 149,
      annual: 1430,
      currency: 'USD',
      annualDiscountPercent: 20,
      stripeMonthlyPriceId: 'STRIPE_STARTER_MONTHLY',
      stripeAnnualPriceId: 'STRIPE_STARTER_ANNUAL',
    },
    trial: {
      enabled: false,
      durationDays: 0,
    },
    limits: {
      activeProjects: 10,
      scansPerMonth: 200,
      pagesPerScan: 500,
      reportHistoryDays: 90,
      teamMembers: 5,
      apiCallsPerDay: 500,
      scheduledScans: 10,
    },
    features: {
      pdfReports: true,
      whiteLabelReports: true,
      basicTeamAccess: true,
      teamCollaboration: true,
      apiAccess: true,
      prioritySupport: true,
      multiDeviceTesting: true,
      cicdIntegration: false,
      webhookNotifications: false,
      scheduledScans: true,
      emailNotifications: true,
      slackNotifications: true,
      customIntegrations: false,
      dedicatedAccountManager: false,
      ssoAuth: false,
      onPremiseDeployment: false,
      advancedAnalytics: false,
      bulkOperations: false,
    },
    includedInLowerTier: {
      basicTeamAccess: true,
      pdfReports: true,
      whiteLabelReports: true,  
    },
    previousTier: 'basic',
    supportLevel: 'priority',
    supportResponseTime: '24 hours',
    isActive: true,
    displayOrder: 2,
  },

  professional: {
    id: 'professional',
    name: 'professional',
    displayName: 'Professional',
    description: 'For enterprises and large agencies',
    pricing: {
      monthly: 399,
      annual: 3830,
      currency: 'USD',
      annualDiscountPercent: 20,
      stripeMonthlyPriceId: 'STRIPE_PROFESSIONAL_MONTHLY',
      stripeAnnualPriceId: 'STRIPE_PROFESSIONAL_ANNUAL',
    },
    trial: {
      enabled: false,
      durationDays: 0,
    },
    limits: {
      activeProjects: 'unlimited',
      scansPerMonth: 1000,
      pagesPerScan: 2000,
      reportHistoryDays: 365,
      teamMembers: 20,
      apiCallsPerDay: 5000,
      scheduledScans: 'unlimited',
    },
    features: {
      pdfReports: true,
      whiteLabelReports: true,
      basicTeamAccess: true,
      teamCollaboration: true,
      apiAccess: true,
      prioritySupport: true,
      multiDeviceTesting: true,
      cicdIntegration: true,
      webhookNotifications: true,
      scheduledScans: true,
      emailNotifications: true,
      slackNotifications: true,
      customIntegrations: false,
      dedicatedAccountManager: false,
      ssoAuth: false,
      onPremiseDeployment: false,
      advancedAnalytics: true,
      bulkOperations: true,
    },
    includedInLowerTier: {
      basicTeamAccess: true,
      teamCollaboration: true,
      apiAccess: true,
      pdfReports: true,
      whiteLabelReports: true,
      multiDeviceTesting: true,
      prioritySupport: true,
      cicdIntegration: true,
      webhookNotifications: true,
      slackNotifications: true,
      scheduledScans: true,
      advancedAnalytics: true,
      bulkOperations: true,
    },
    previousTier: 'starter',
    supportLevel: 'priority',
    supportResponseTime: '12 hours',
    isActive: true,
    displayOrder: 3,
  },

  enterprise: {
    id: 'enterprise',
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Tailored solutions for large organizations',
    pricing: {
      monthly: 0, // Custom pricing
      annual: 0, // Custom pricing
      currency: 'USD',
      annualDiscountPercent: 0,
      stripeMonthlyPriceId: null,
      stripeAnnualPriceId: null,
    },
    trial: {
      enabled: false,
      durationDays: 0,
    },
    limits: {
      activeProjects: 'unlimited',
      scansPerMonth: 'unlimited',
      pagesPerScan: 'unlimited',
      reportHistoryDays: 'unlimited',
      teamMembers: 'unlimited',
      apiCallsPerDay: null,
      scheduledScans: 'unlimited',
    },
    features: {
      pdfReports: true,
      whiteLabelReports: true,
      basicTeamAccess: true,
      teamCollaboration: true,
      apiAccess: true,
      prioritySupport: true,
      multiDeviceTesting: true,
      cicdIntegration: true,
      webhookNotifications: true,
      scheduledScans: true,
      emailNotifications: true,
      slackNotifications: true,
      customIntegrations: true,
      dedicatedAccountManager: true,
      ssoAuth: true,
      onPremiseDeployment: true,
      advancedAnalytics: true,
      bulkOperations: true,
    },
    includedInLowerTier: {
      basicTeamAccess: true,
      teamCollaboration: true,
      apiAccess: true,
      pdfReports: true,
      whiteLabelReports: true,
      multiDeviceTesting: true,
      prioritySupport: true,
      cicdIntegration: true,
      webhookNotifications: true,
      slackNotifications: true,
      scheduledScans: true,
      customIntegrations: true,
      dedicatedAccountManager: true,
      ssoAuth: true,
      onPremiseDeployment: true,
      advancedAnalytics: true,
      bulkOperations: true,
    },
    previousTier: 'professional',
    supportLevel: 'premium',
    supportResponseTime: '4 hours',
    isActive: true,
    displayOrder: 4,
  },
};

// Trial configuration
export const TRIAL_CONFIG = {
  DURATION_DAYS: 14,
  DEFAULT_PACKAGE: 'basic' as const,
  REMINDER_DAYS: [11, 13, 14], // Send reminders on these days before expiry
  GRACE_PERIOD_DAYS: 30, // After expiry, before data deletion countdown
  DATA_RETENTION_DAYS: 60, // After grace period
};

// Payment retry configuration
export const PAYMENT_RETRY_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_SCHEDULE_DAYS: [3, 7, 10], // Retry on day 3, 7, 10
  GRACE_PERIOD_DAYS: 30, // Read-only access after final retry
  SUSPENSION_DAY: 30, // Full suspension after grace period
  DATA_DELETION_DAYS: 90, // Total days before permanent deletion
};

// Feature keys for easy checking
export const FEATURE_KEYS = {
  PDF_REPORTS: 'pdfReports',
  WHITE_LABEL: 'whiteLabelReports',
  API_ACCESS: 'apiAccess',
  MULTI_DEVICE: 'multiDeviceTesting',
  CICD: 'cicdIntegration',
  WEBHOOKS: 'webhookNotifications',
  SLACK: 'slackNotifications',
  TEAM_COLLABORATION: 'teamCollaboration',
  ADVANCED_ANALYTICS: 'advancedAnalytics',
  BULK_OPERATIONS: 'bulkOperations',
} as const;

/**
 * Get all available packages sorted by display order
 */
export function getAllPackages(): PackageConfig[] {
  return Object.values(SUBSCRIPTION_PACKAGES)
    .filter(pkg => pkg.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
