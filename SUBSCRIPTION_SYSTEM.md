# Subscription System Design

## Overview
Ablelytics offers a tiered subscription model with a 14-day free trial on the Basic plan. All plans include core accessibility scanning features with varying limits and capabilities.

---

## Pricing & Package Structure

### Basic - $49/month ($470/year)
*Perfect for freelancers and small projects*
- **Projects**: 3 active projects
- **Scans**: 50 scans/month
- **Pages per scan**: Up to 100 pages
- **Report History**: 30 days
- **Team Members**: 1 user
- **Features**:
  - ✅ PDF Reports
  - ✅ Desktop Testing Only
  - ✅ Email Notifications
  - ✅ Scheduled Scans (1 per project)
  - ✅ Basic Support (email, 48h response)
  - ❌ White-label Reports
  - ❌ API Access
  - ❌ CI/CD Integration
  - ❌ Webhook Notifications
  - ❌ Slack Integration
  - ❌ Multi-device Testing

### Starter - $149/month ($1,430/year)
*For growing teams and agencies*
- **Projects**: 10 active projects
- **Scans**: 200 scans/month
- **Pages per scan**: Up to 500 pages
- **Report History**: 90 days
- **Team Members**: 5 users
- **Features**:
  - ✅ Everything in Basic
  - ✅ White-label Reports (custom branding)
  - ✅ Multi-Device Testing (desktop, tablet, mobile)
  - ✅ Email & Slack Notifications
  - ✅ Scheduled Scans (10)
  - ✅ Team Collaboration (comments, assignments)
  - ✅ API Access (500 calls/day)
  - ✅ Priority Support (email, 24h response)
  - ❌ CI/CD Integration
  - ❌ Webhook Notifications
  - ❌ Dedicated Account Manager

### Professional - $399/month ($3,830/year)
*For enterprises and large agencies*
- **Projects**: Unlimited active projects
- **Scans**: 1,000 scans/month
- **Pages per scan**: Up to 2,000 pages
- **Report History**: 1 year
- **Team Members**: 20 users
- **Features**:
  - ✅ Everything in Starter
  - ✅ CI/CD Integration (GitHub Actions, GitLab CI, Jenkins, etc.)
  - ✅ Webhook Notifications
  - ✅ API Access (5,000 calls/day)
  - ✅ Scheduled Scans (10)
  - ✅ Advanced Team Collaboration (workflows, approvals)
  - ✅ Priority Support (email + chat, 12h response)
  - ✅ Custom Scan Configurations
  - ✅ Bulk Operations
  - ✅ Advanced Analytics Dashboard
  - ❌ Dedicated Account Manager
  - ❌ Custom Integrations

### Enterprise - Custom Pricing
*Tailored solutions for large organizations*
- **Projects**: Unlimited
- **Scans**: Custom volume
- **Pages per scan**: Unlimited
- **Report History**: Unlimited
- **Team Members**: Unlimited
- **Features**:
  - ✅ Everything in Professional
  - ✅ Dedicated Account Manager
  - ✅ Custom Integrations
  - ✅ On-premise Deployment Option
  - ✅ SLA Guarantees (99.9% uptime)
  - ✅ Premium Support (phone, email, chat, 4h response)
  - ✅ Custom Training & Onboarding
  - ✅ SSO/SAML Authentication
  - ✅ Custom Contract Terms
  - ✅ Volume Discounts

**Annual Discount**: Save 20% when paying annually (reflected in pricing above)

---

## Subscription Flows

### 1. Registration & Trial Flow

#### A. New User Registration
```
1. User signs up with email/password or OAuth
2. Email verification required
3. User presented with two options:
   
   Option A: Start 14-Day Free Trial (Basic Plan)
   ┌──────────────────────────────────────┐
   │ ✓ No credit card required            │
   │ ✓ Full Basic plan features           │
   │ ✓ Automatically starts upon selection│
   │ ✓ Trial ends after 14 days           │
   └──────────────────────────────────────┘
   
   Option B: Subscribe Now (Any Plan)
   ┌──────────────────────────────────────┐
   │ → Choose plan (Basic/Starter/Pro)    │
   │ → Enter payment details              │
   │ → Immediate activation               │
   │ → No trial period                    │
   └──────────────────────────────────────┘
```

#### B. Trial User Experience
```
Day 1-10: Full access to Basic plan features
  └─ Dashboard banner: "14 days left in your trial"
  
Day 11-13: Upgrade prompts increase
  └─ Dashboard banner: "3 days left - upgrade to continue"
  └─ Email reminder sent
  
Day 14: Final day
  └─ Dashboard banner: "Trial ends today - upgrade now"
  └─ Email reminder sent
  
Day 15: Trial expired
  └─ Account locked (read-only mode)
  └─ Can view existing data but cannot run new scans
  └─ Prominent upgrade prompt on every page
  └─ Email sent: "Your trial has expired"
```

#### C. Trial to Paid Conversion
```
User clicks "Upgrade" → Plan Selection Page
  ├─ Current plan highlighted (Basic)
  ├─ Option to select higher plans
  ├─ Monthly/Annual toggle
  └─ Shows pricing with annual discount
  
User selects plan → Payment Details Page
  ├─ Stripe/Payment Gateway integration
  ├─ Card details (saved securely)
  ├─ Billing address
  └─ VAT/Tax information (if applicable)
  
Payment Successful
  ├─ Immediate account activation
  ├─ Email receipt sent
  ├─ Welcome to paid plan email
  └─ Redirect to dashboard
  
Payment Failed
  ├─ Error message displayed
  ├─ Option to retry
  ├─ Option to use different payment method
  └─ Account remains in trial/expired state
```

### 2. Direct Subscription Flow (No Trial)

```
User selects "Subscribe Now" during registration
  ↓
Plan Selection
  ├─ Basic ($49/mo or $470/yr)
  ├─ Starter ($149/mo or $1,430/yr)
  ├─ Professional ($399/mo or $3,830/yr)
  └─ Enterprise (Contact Sales)
  ↓
Payment Details Entry
  ├─ Credit/Debit Card
  ├─ Billing Information
  └─ Tax/VAT details
  ↓
Payment Processing
  ├─ Success → Immediate activation
  └─ Failure → Error page with retry option
  ↓
Account Activated
  └─ Email confirmation sent
  └─ Redirect to onboarding/dashboard
```

### 3. Payment Failure Handling

#### Initial Payment Failure (First Subscription)
```
Payment Declined
  ├─ Display user-friendly error message
  ├─ Suggest common issues:
  │   ├─ Insufficient funds
  │   ├─ Card expired
  │   ├─ Incorrect details
  │   └─ International transaction blocked
  ├─ Provide "Try Again" button
  ├─ Option to use different payment method
  └─ Account remains in pending state (trial continues if applicable)
```

#### Recurring Payment Failure
```
Day 1: Payment attempt fails
  ├─ Automatic retry in 3 days
  ├─ Email sent to user: "Payment failed, we'll retry"
  └─ Dashboard notice displayed
  
Day 4: Second payment attempt fails
  ├─ Automatic retry in 3 days
  ├─ Email sent: "Please update your payment method"
  └─ Dashboard warning displayed
  
Day 7: Third payment attempt fails
  ├─ Email sent: "Subscription will be suspended in 3 days"
  ├─ Dashboard critical notice
  └─ No more automatic retries
  
Day 10: Account suspended
  ├─ Account enters grace period (read-only mode)
  ├─ Cannot create new scans
  ├─ Can view historical data
  ├─ Email sent: "Subscription suspended"
  └─ Prominent "Update Payment Method" prompt
  
Day 30: Account deactivated
  ├─ Account fully locked
  ├─ Data retained for 60 days
  ├─ Email sent: "Account deactivated, data will be deleted in 60 days"
  └─ Can reactivate by paying outstanding amount
  
Day 90: Data deletion
  ├─ All user data permanently deleted
  ├─ Account can still be reactivated (as new account)
  └─ Final email notification sent
```

### 4. Plan Upgrade/Downgrade Flow

#### Upgrade (Mid-cycle)
```
User selects higher plan
  ├─ Calculate prorated amount
  ├─ Show breakdown:
  │   ├─ Credit from current plan (remaining days)
  │   ├─ Charge for new plan (remaining days)
  │   └─ Net amount to charge today
  ├─ User confirms upgrade
  ├─ Payment processed immediately
  ├─ Features activated immediately
  ├─ Next billing date remains the same
  └─ Email confirmation sent
```

#### Downgrade (Mid-cycle)
```
User selects lower plan
  ├─ Warning: "Downgrade will take effect at next billing cycle"
  ├─ Show what will change:
  │   ├─ Reduced limits
  │   ├─ Lost features
  │   └─ Projects/data that exceed new limits
  ├─ User confirms downgrade
  ├─ Scheduled for next billing date
  ├─ Current plan continues until billing date
  ├─ Email confirmation sent
  └─ Reminder email sent 3 days before change
  
On billing date:
  ├─ Plan downgraded
  ├─ Features adjusted
  ├─ If limits exceeded:
  │   ├─ User must delete excess projects
  │   └─ Scans paused until compliance
  └─ Email notification sent
```

### 5. Cancellation Flow

```
User initiates cancellation
  ├─ Survey: "Why are you canceling?" (optional)
  ├─ Options:
  │   ├─ Cancel immediately (no refund, lose access)
  │   └─ Cancel at end of billing period (recommended)
  ├─ User confirms cancellation
  ├─ Email confirmation sent
  └─ If end-of-period:
      ├─ Access continues until billing date
      ├─ Reminder email sent 7 days before
      └─ Reminder email sent 1 day before
  
On cancellation date:
  ├─ Account enters grace period (30 days, read-only)
  ├─ Email sent: "Subscription canceled, reactivate within 30 days"
  ├─ After 30 days:
  │   └─ Data deletion countdown begins (60 days)
  └─ After 90 days total:
      └─ All data permanently deleted
```

### 6. Annual Subscription Handling

```
Annual Subscription Payment
  ├─ Charged once per year
  ├─ 20% discount applied
  ├─ Email receipt sent
  ├─ Invoice generated (PDF)
  └─ Renewal reminder sent 30 days before expiry
  
30 Days Before Renewal:
  ├─ Email: "Your annual subscription renews in 30 days"
  ├─ Amount to be charged
  └─ Option to cancel or update payment method
  
7 Days Before Renewal:
  └─ Reminder email sent
  
Renewal Day:
  ├─ Payment processed
  ├─ Success:
  │   ├─ Subscription extended 1 year
  │   ├─ Email receipt sent
  │   └─ Invoice generated
  └─ Failure:
      └─ Follow recurring payment failure flow
```

---

## Configuration Management

### Package Configuration Structure

Stored in Firestore: `system/subscriptionPackages`

```typescript
interface PackageConfig {
  id: 'basic' | 'starter' | 'professional' | 'enterprise';
  name: string;
  displayName: string;
  pricing: {
    monthly: number;
    annual: number;
    currency: 'USD' | 'EUR' | 'GBP';
    annualDiscountPercent: number;
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
    scheduledScans: boolean | 'limited'; // 'limited' for Basic (1 per project)
    emailNotifications: boolean;
    slackNotifications: boolean;
    customIntegrations: boolean;
    dedicatedAccountManager: boolean;
    ssoAuth: boolean;
    onPremiseDeployment: boolean;
    advancedAnalytics: boolean;
    bulkOperations: boolean;
  };
  supportLevel: 'basic' | 'priority' | 'premium';
  supportResponseTime: string;
  isActive: boolean;
  displayOrder: number;
}
```

### Client-Level Overrides

Stored in Firestore: `organizations/{orgId}/subscriptionOverride`

```typescript
interface OrganizationSubscriptionOverride {
  organizationId: string;
  basePackage: 'basic' | 'starter' | 'professional' | 'enterprise';
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
  };
  featureOverrides?: {
    [key: string]: boolean;
  };
  notes?: string; // Admin notes about custom deal
  approvedBy?: string; // Admin who approved
  approvedAt?: Date;
  expiresAt?: Date | null; // For temporary overrides
}
```

---

## Technical Implementation Features

### Phase 1: Core Subscription (Priority: HIGH)
- [ ] **Database Schema**
  - [ ] Create `subscriptions` collection with user/org references
  - [ ] Create `subscriptionPackages` system config
  - [ ] Create `organizationOverrides` collection
  - [ ] Create `paymentHistory` collection
  - [ ] Create `invoices` collection

- [ ] **Stripe Integration**
  - [ ] Set up Stripe account and API keys
  - [ ] Create Stripe Products for each package
  - [ ] Create Stripe Prices (monthly/annual for each)
  - [ ] Implement Stripe Checkout session creation
  - [ ] Implement Stripe webhook handler for events:
    - `checkout.session.completed`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`

- [ ] **Trial Management**
  - [ ] Trial start on registration
  - [ ] Trial countdown display in UI
  - [ ] Trial expiration check (Cloud Function daily cron)
  - [ ] Email notifications (day 11, 13, 14, 15)
  - [ ] Account locking on trial expiration

- [ ] **Subscription State Management**
  - [ ] Subscription status tracking (active, trialing, past_due, canceled, expired)
  - [ ] Usage tracking (scans used, projects count, API calls)
  - [ ] Limit enforcement before creating scans/projects
  - [ ] Real-time subscription status display

### Phase 2: Payment Handling (Priority: HIGH)
- [ ] **Payment Processing**
  - [ ] Initial subscription payment
  - [ ] Recurring payment automation (via Stripe)
  - [ ] Payment method management (add, update, remove cards)
  - [ ] Payment retry logic
  - [ ] Failed payment grace period implementation

- [ ] **Invoicing & Receipts**
  - [ ] Generate PDF invoices (via Cloud Function)
  - [ ] Email invoices to customers
  - [ ] Invoice history page in dashboard
  - [ ] Tax/VAT calculation support

- [ ] **Payment Failure Handling**
  - [ ] Automatic retry schedule (day 4, day 7)
  - [ ] Email notifications for each retry
  - [ ] Grace period implementation (day 10-30)
  - [ ] Account suspension on day 30
  - [ ] Data deletion countdown (day 30-90)

### Phase 3: Plan Management (Priority: MEDIUM)
- [ ] **Plan Selection & Changes**
  - [ ] Plan comparison page
  - [ ] Upgrade flow with proration
  - [ ] Downgrade flow (scheduled for next billing)
  - [ ] Limit warnings on downgrade
  - [ ] Cancellation flow

- [ ] **Subscription Management UI**
  - [ ] Current plan display
  - [ ] Usage statistics (scans used, limits remaining)
  - [ ] Payment method management page
  - [ ] Billing history page
  - [ ] Invoice download functionality

### Phase 4: Feature Gating (Priority: HIGH)
- [ ] **Feature Access Control**
  - [ ] Middleware to check subscription status
  - [ ] Feature flags based on package
  - [ ] Limit enforcement:
    - Active projects count
    - Scans per month quota
    - Pages per scan limit
    - Team members limit
    - API rate limiting
  - [ ] UI elements hidden/disabled for unavailable features

- [ ] **Usage Tracking**
  - [ ] Track scans per month (reset on billing cycle)
  - [ ] Track active projects count
  - [ ] Track API calls per day
  - [ ] Track team members count
  - [ ] Display usage in dashboard

### Phase 5: Notifications & Communications (Priority: MEDIUM)
- [ ] **Email Notifications**
  - [ ] Welcome email (trial start)
  - [ ] Trial reminder emails (day 11, 13, 14)
  - [ ] Trial expired email
  - [ ] Subscription confirmation email
  - [ ] Payment receipt emails
  - [ ] Payment failed emails
  - [ ] Subscription renewed email
  - [ ] Subscription canceled email
  - [ ] Invoice emails

- [ ] **In-App Notifications**
  - [ ] Trial countdown banner
  - [ ] Payment failure warnings
  - [ ] Limit warnings (80%, 90%, 100% usage)
  - [ ] Feature upgrade prompts

### Phase 6: Admin Features (Priority: LOW)
- [ ] **Admin Dashboard** (Future)
  - [ ] View all subscriptions
  - [ ] Manual subscription adjustments
  - [ ] Apply custom pricing/overrides
  - [ ] Refund processing
  - [ ] View payment history
  - [ ] Customer support tools

- [ ] **Analytics** (Future)
  - [ ] MRR (Monthly Recurring Revenue) tracking
  - [ ] Churn rate calculation
  - [ ] Trial conversion rate
  - [ ] Popular plans analytics
  - [ ] Revenue forecasting

### Phase 7: PDF Report Generation (Priority: MEDIUM)
- [ ] **PDF Export Functionality**
  - [ ] Create PDF template design (white-label ready)
  - [ ] Implement PDF generation library (puppeteer/pdfkit)
  - [ ] Cloud Function to generate PDF from scan results
  - [ ] White-label customization (logo, colors, company name)
  - [ ] PDF storage in Firebase Storage
  - [ ] PDF download link generation
  - [ ] Email PDF option

- [ ] **Report Customization** (Starter+)
  - [ ] Custom logo upload
  - [ ] Brand color selection
  - [ ] Company name/footer customization
  - [ ] Report template selection

### Phase 8: Additional Features (Priority: LOW)
- [ ] **Multi-Device Testing** (Starter+)
  - [ ] Desktop viewport testing (default)
  - [ ] Tablet viewport testing
  - [ ] Mobile viewport testing
  - [ ] Viewport selection in scan configuration

- [ ] **Team Collaboration** (Starter+)
  - [ ] Comments on scan results
  - [ ] Task assignment
  - [ ] Issue status tracking
  - [ ] Activity feed

- [ ] **Advanced Features** (Professional+)
  - [ ] CI/CD integration examples
  - [ ] Webhook configuration UI
  - [ ] Custom scan configurations
  - [ ] Bulk operations UI
  - [ ] Advanced analytics dashboard

- [ ] **Enterprise Features** (Enterprise only)
  - [ ] SSO/SAML setup
  - [ ] Custom integrations consultation
  - [ ] Dedicated support channel

---

## Database Schema

### Collection: `subscriptions`
```typescript
{
  id: string; // auto-generated
  userId: string; // reference to user
  organizationId: string | null; // reference to org if applicable
  packageId: 'basic' | 'starter' | 'professional' | 'enterprise';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  
  // Stripe references
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string;
  
  // Billing
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  
  // Trial
  trialStart: Date | null;
  trialEnd: Date | null;
  
  // Usage tracking
  usage: {
    scansThisCycle: number;
    activeProjects: number;
    apiCallsToday: number;
    lastResetDate: Date;
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
  createdAt: Date;
  updatedAt: Date;
  canceledAt: Date | null;
  cancelReason: string | null;
}
```

### Collection: `paymentHistory`
```typescript
{
  id: string;
  subscriptionId: string;
  userId: string;
  
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  
  stripeInvoiceId: string;
  stripeChargeId: string | null;
  
  billingReason: 'subscription_create' | 'subscription_cycle' | 'subscription_update';
  
  failureCode: string | null;
  failureMessage: string | null;
  
  receiptUrl: string | null;
  invoiceUrl: string | null;
  
  createdAt: Date;
}
```

---

## Security & Compliance

### Payment Security
- All payment processing via Stripe (PCI DSS compliant)
- Never store full card details
- Use Stripe.js for client-side tokenization
- Server-side validation of all payment requests

### Data Privacy
- GDPR compliant data handling
- Clear data retention policy (90 days after cancellation)
- Data export option for users
- Data deletion on request

### Access Control
- Subscription status checked on every API request
- Feature flags enforced server-side
- Usage limits enforced in Cloud Functions
- Rate limiting on API endpoints

---

## Success Metrics

### Key Performance Indicators (KPIs)
- **Trial Conversion Rate**: Target 25%+
- **Churn Rate**: Target <5% monthly
- **Monthly Recurring Revenue (MRR)**: Track growth
- **Average Revenue Per User (ARPU)**: Track by plan
- **Customer Lifetime Value (CLV)**: Calculate and optimize
- **Upgrade Rate**: % of users upgrading to higher plans

### Monitoring
- Track subscription events in analytics
- Monitor payment success/failure rates
- Alert on unusual churn patterns
- Dashboard for real-time subscription metrics

---

## Future Enhancements

### Potential Features
- Add-on purchases (extra scans, extra pages, etc.)
- Reseller/Agency partnerships with volume discounts
- Educational/Non-profit discounts
- Referral program
- Affiliate program
- Usage-based billing option
- Multi-currency support
- Regional pricing

---

## Notes

### Implementation Priority
1. **Phase 1 & 2** (Core + Payments): Critical for launch
2. **Phase 4** (Feature Gating): Essential for enforcing limits
3. **Phase 7** (PDF Reports): Key differentiator
4. **Phase 3 & 5** (Plan Management + Notifications): Important UX
5. **Phase 8** (Additional Features): Can be rolled out incrementally
6. **Phase 6** (Admin): Can be basic initially, improved later

### Technology Stack
- **Payment Processing**: Stripe
- **PDF Generation**: Puppeteer or PDFKit
- **Email**: SendGrid, Resend, or Firebase Extensions
- **Cron Jobs**: Firebase Cloud Functions scheduled functions
- **Database**: Firestore
- **File Storage**: Firebase Storage (for PDFs, white-label assets)

### Testing Strategy
- Test all payment flows in Stripe Test Mode
- Simulate payment failures
- Test trial expiration logic
- Test limit enforcement
- Test upgrade/downgrade flows
- Load testing for PDF generation
