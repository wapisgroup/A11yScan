# Subscription Cancellation - Implementation Guide

## Overview

Subscription cancellations work differently from plan changes because we want to:
1. Give users access until their billing period ends
2. Allow them to change their mind
3. Send retention emails (future feature)
4. Handle both dashboard and Stripe backoffice cancellations

---

## Three Cancellation Scenarios

### Scenario 1: User Cancels from Dashboard

**User Action:** Clicks "Cancel Subscription" button on billing page

**Flow:**

1. **Confirmation Dialog:**
   - Shows what will happen
   - Explains access until period end
   - Suggests downgrading instead
   - Confirms intent

2. **API Call** (`/api/stripe/cancel-subscription`):
   ```typescript
   stripe.subscriptions.update(subscriptionId, {
     cancel_at_period_end: true
   });
   ```

3. **Stripe:**
   - Sets `cancel_at_period_end: true`
   - Sets `cancel_at` to the `current_period_end` timestamp
   - Subscription remains ACTIVE
   - Triggers `customer.subscription.updated` webhook

4. **Webhook** (`handleSubscriptionUpdated`):
   ```javascript
   if (stripeSubscription.cancel_at_period_end) {
     updateData.cancelAtPeriodEnd = true;
     updateData.cancelAt = Timestamp(cancel_at);
   }
   ```

5. **Firestore Update:**
   ```javascript
   {
     status: 'active', // Still active!
     cancelAtPeriodEnd: true, // NEW
     cancelAt: Timestamp(March 4, 2026), // When it will cancel
     // ... other fields unchanged
   }
   ```

6. **UI Update:**
   - Red banner appears: "Subscription Cancellation Scheduled"
   - Shows cancellation date
   - Shows "Keep My Subscription" button
   - Explains retention period
   - Cancel Subscription button HIDDEN (already cancelled)
   - Upgrade/downgrade buttons STILL WORK (can change plan before cancellation)

**Database State:**
```javascript
{
  packageId: 'starter',
  status: 'active',
  cancelAtPeriodEnd: true,
  cancelAt: Timestamp(Mar 4, 2026),
  currentPeriodEnd: Timestamp(Mar 4, 2026),
  // scheduledChange might also exist if they had a downgrade pending
}
```

---

### Scenario 2: User Reactivates (Undo Cancel)

**User Action:** Clicks "Keep My Subscription" button in red banner

**Flow:**

1. **Confirmation:**
   - Confirms they want to continue subscription

2. **API Call** (`/api/stripe/reactivate-subscription`):
   ```typescript
   stripe.subscriptions.update(subscriptionId, {
     cancel_at_period_end: false
   });
   ```

3. **Stripe:**
   - Sets `cancel_at_period_end: false`
   - Clears `cancel_at`
   - Subscription continues normally
   - Triggers `customer.subscription.updated` webhook

4. **Webhook:**
   ```javascript
   if (!stripeSubscription.cancel_at_period_end && currentData?.cancelAtPeriodEnd) {
     // Cancellation was reverted
     updateData.cancelAtPeriodEnd = false;
     updateData.cancelAt = FieldValue.delete();
   }
   ```

5. **Firestore:**
   ```javascript
   {
     packageId: 'starter',
     status: 'active',
     cancelAtPeriodEnd: false, // CHANGED
     cancelAt: DELETED, // REMOVED
     // Everything else normal
   }
   ```

6. **UI:**
   - Red banner DISAPPEARS
   - "Cancel Subscription" button reappears
   - Everything back to normal
   - User will be charged on next period

**Verification:**
- [ ] Red banner disappears
- [ ] Can cancel again if desired
- [ ] Billing continues normally

---

### Scenario 3: Cancellation Date Arrives (Automatic)

**Trigger:** Stripe's scheduler reaches `cancel_at` date (Mar 4, 2026)

**Flow:**

1. **Stripe Automatic Action:**
   - Deletes the subscription
   - Sets status to `canceled`
   - Triggers `customer.subscription.deleted` webhook

2. **Webhook** (`handleSubscriptionDeleted`):
   ```javascript
   {
     status: 'canceled',
     canceledAt: Timestamp(now),
     cancelAtPeriodEnd: false, // Clear flag
     cancelAt: FieldValue.delete(), // Remove date
     scheduledChange: FieldValue.delete(), // Clear any downgrades too
   }
   ```

3. **Firestore:**
   ```javascript
   {
     packageId: 'starter',
     status: 'canceled', // CHANGED
     canceledAt: Timestamp(Mar 4, 2026),
     // cancelAtPeriodEnd and cancelAt removed
   }
   ```

4. **UI:**
   - Red banner disappears
   - Shows "No active subscription" state
   - Could redirect to onboarding
   - Could show resubscribe options

**Verification:**
- [ ] User loses access
- [ ] Status shows "canceled"
- [ ] Can resubscribe to new plan

---

### Scenario 4: Cancelled from Stripe Backoffice (Immediate)

**Admin Action:** Cancel subscription in Stripe dashboard with "Cancel immediately"

**Flow:**

1. **Stripe:**
   - Immediately deletes subscription
   - No grace period
   - Triggers `customer.subscription.deleted` webhook

2. **Webhook** (`handleSubscriptionDeleted`):
   - Same as Scenario 3
   - Marks as canceled immediately

3. **Firestore:**
   ```javascript
   {
     status: 'canceled',
     canceledAt: Timestamp(now),
     scheduledChange: FieldValue.delete(),
   }
   ```

4. **UI Behavior:**
   - If user has scheduled downgrade banner: HIDE IT (subscription cancelled, downgrade irrelevant)
   - If no scheduled changes: Show "subscription cancelled" state
   - Redirect to onboarding flow (future feature)

**Special Handling:**
```typescript
// On billing page load:
if (subscription.status === 'canceled') {
  if (subscription.scheduledChange) {
    // Don't show scheduled downgrade banner
    // Subscription is cancelled, downgrade won't happen
  }
  
  // Could redirect to onboarding
  // router.push('/onboarding');
}
```

---

### Scenario 5: Cancelled from Stripe Backoffice (At Period End)

**Admin Action:** Cancel subscription in Stripe dashboard with "Cancel at period end"

**Flow:**
- Same as Scenario 1 (user cancellation)
- Sets `cancel_at_period_end: true`
- Webhook handles it identically
- User sees red banner in dashboard

---

## Interaction with Scheduled Downgrades

### Case: User has scheduled downgrade AND cancels

**Initial State:**
```javascript
{
  packageId: 'professional',
  scheduledChange: {
    packageName: 'starter',
    effectiveDate: Timestamp(Mar 4, 2026)
  }
}
```

**User clicks "Cancel Subscription":**

**Result:**
```javascript
{
  packageId: 'professional',
  cancelAtPeriodEnd: true,
  cancelAt: Timestamp(Mar 4, 2026),
  scheduledChange: { // STILL EXISTS
    packageName: 'starter',
    effectiveDate: Timestamp(Mar 4, 2026)
  }
}
```

**UI Behavior:**
- Red cancel banner takes PRIORITY
- Hide blue downgrade banner (cancellation overrides downgrade)
- If user reactivates: scheduledChange remains, blue banner reappears

**On cancellation date:**
- Subscription deleted
- scheduledChange cleared (irrelevant now)
- User loses access

---

## Database Schema

### Firestore: `subscriptions/{userId}`

```typescript
interface Subscription {
  // ... existing fields ...
  
  // Cancellation fields
  cancelAtPeriodEnd?: boolean; // True if scheduled for cancellation
  cancelAt?: Timestamp; // When it will be cancelled
  canceledAt?: Timestamp; // When it was actually cancelled (status=canceled)
  
  // Interaction with other fields
  // - If cancelAtPeriodEnd=true, hide scheduledChange banner
  // - If status='canceled', clear both cancelAtPeriodEnd and scheduledChange
}
```

---

## UI Components

### CancelScheduledBanner
- **Shows when:** `cancelAtPeriodEnd === true`
- **Color:** Red (urgent, negative action)
- **Content:**
  - Cancellation date
  - Retention messaging
  - Suggestions (downgrade, contact support)
  - "Keep My Subscription" button

### Cancel Subscription Button
- **Location:** Bottom of Current Plan Card
- **Shows when:** `!cancelAtPeriodEnd && !isTrial`
- **Hidden when:** Already scheduled for cancellation
- **Text:** "Cancel Subscription" / "Cancelling..."
- **Action:** Calls `cancelSubscription()` API

---

## Priority Hierarchy (What to Show)

When multiple states exist, show in this order:

1. **Cancelled Status** (`status === 'canceled'`)
   - Override everything
   - Show "No subscription" or redirect to onboarding

2. **Cancel Scheduled** (`cancelAtPeriodEnd === true`)
   - Show red CancelScheduledBanner
   - Hide blue ScheduledChangeBanner (if exists)
   - Hide "Cancel Subscription" button

3. **Downgrade Scheduled** (`scheduledChange` exists)
   - Show blue ScheduledChangeBanner
   - Disable upgrade/downgrade buttons
   - Show "Cancel Subscription" button (can cancel before downgrade applies)

4. **Normal Active**
   - Show current plan
   - Show upgrade/downgrade options
   - Show "Cancel Subscription" button

---

## Retention Email Flow (Future)

When `cancelAtPeriodEnd` is set:

1. **Immediate:** Confirmation email
2. **7 days before:** Reminder with discount offer
3. **3 days before:** Last chance email
4. **On cancel date:** Goodbye email with resubscribe link

**Implementation:**
- Cloud Function triggered daily
- Checks `subscriptions` collection for `cancelAtPeriodEnd: true`
- Calculates days until `cancelAt`
- Sends appropriate email via SendGrid/Mailgun

---

## Testing Checklist

### Cancel from Dashboard
- [ ] Click "Cancel Subscription"
- [ ] Confirm dialog appears with correct info
- [ ] Red banner appears after 2 second delay
- [ ] Shows correct cancellation date
- [ ] "Cancel Subscription" button disappears
- [ ] Can still use all features
- [ ] Firestore has `cancelAtPeriodEnd: true`

### Reactivate Subscription
- [ ] Click "Keep My Subscription"
- [ ] Confirm dialog appears
- [ ] Red banner disappears after reload
- [ ] "Cancel Subscription" button reappears
- [ ] Firestore has `cancelAtPeriodEnd: false`
- [ ] Billing continues normally

### Cancel + Scheduled Downgrade
- [ ] Schedule a downgrade (blue banner appears)
- [ ] Cancel subscription
- [ ] Red banner appears, blue banner HIDDEN
- [ ] Reactivate subscription
- [ ] Red banner disappears, blue banner REAPPEARS
- [ ] Cancel button works again

### Stripe Backoffice (Immediate)
- [ ] Admin cancels immediately in Stripe
- [ ] Webhook fires within 1-2 seconds
- [ ] User sees "No subscription" in dashboard
- [ ] Status shows "canceled"
- [ ] Any scheduled changes cleared

### Stripe Backoffice (At Period End)
- [ ] Admin cancels at period end in Stripe
- [ ] Red banner appears in dashboard
- [ ] User can reactivate
- [ ] Works same as dashboard cancellation

### Automatic Cancellation
- [ ] Advance time to `cancel_at` date (use Stripe test clocks)
- [ ] Webhook fires automatically
- [ ] Status changes to "canceled"
- [ ] User loses access
- [ ] Can resubscribe to new plan

---

## Edge Cases

### User cancels, then upgrades before cancellation date
- **Current behavior:** Upgrade works, clears cancellation
- **Expected:** Upgrade should also clear `cancelAtPeriodEnd`
- **TODO:** Add logic to webhook: if upgrade happens, clear cancellation

### User has scheduled downgrade + cancellation
- **Show:** Red banner (cancel takes priority)
- **On reactivate:** Blue banner reappears
- **On cancel date:** Both cleared, subscription ends

### Trial user tries to cancel
- **Button:** Hidden (trials can't be "cancelled", just expire)
- **Behavior:** Let trial expire naturally

---

## Success Criteria

✅ Users can cancel from dashboard
✅ Cancel schedules for period end (not immediate)
✅ Red banner shows with clear messaging
✅ Users can reactivate before cancellation date
✅ Automatic cancellation works on date
✅ Stripe backoffice cancellations sync correctly
✅ Cancellation overrides scheduled downgrades in UI
✅ All webhooks process correctly
✅ Database stays consistent
✅ No access loss until period end

---

**End of Cancellation Guide**
