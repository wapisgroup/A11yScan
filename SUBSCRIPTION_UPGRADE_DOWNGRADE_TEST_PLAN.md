# Subscription Upgrade/Downgrade Test Plan

**Test Date:** February 4, 2026  
**Feature:** Subscription plan changes with upgrade/downgrade logic

---

## Overview

This document covers all possible subscription change scenarios and what happens in the database, Stripe, and UI.

### Key Principles

1. **Upgrades** (going to a higher-priced plan):
   - Immediate change
   - Billing period resets from now
   - User is charged prorated amount
   - Can do multiple upgrades in same billing period

2. **Downgrades** (going to a lower-priced plan):
   - Scheduled for next billing period
   - No immediate charge
   - Current plan remains active until period end
   - Cannot make further changes during transition period (only cancel)

3. **Cancelling scheduled changes**:
   - Reverts to current plan
   - Re-enables upgrade/downgrade buttons
   - No charges

---

## Package Hierarchy (Pricing)

Lowest → Highest price:
1. **Basic** - $0/month (or lowest paid tier)
2. **Starter** - $X/month
3. **Professional** - $Y/month (highest)

---

## Test Scenarios

### Scenario 1: UPGRADE - Basic → Starter

**User Action:** Click "Upgrade to Starter" while on Basic plan

**Expected Flow:**

1. **API Call** (`/api/stripe/update-subscription`):
   - Fetches Basic price: $0
   - Fetches Starter price: $X
   - Compares: $X > $0 → **UPGRADE**
   - Calls Stripe with `proration_behavior: 'always_invoice'`
   - Returns `{ changeType: 'upgrade', isUpgrade: true, subscription }`

2. **Stripe Processes:**
   - Creates prorated invoice immediately
   - Charges user for remaining days in month
   - Resets `current_period_start` to now
   - Resets `current_period_end` to now + 1 month
   - Updates metadata: `packageName: 'starter'`
   - Triggers `customer.subscription.updated` webhook

3. **Webhook Processing** (`handleSubscriptionUpdated`):
   - Fetches full subscription from Stripe
   - Detects package change: `basic` → `starter`
   - Fetches both price objects
   - Compares amounts: Starter > Basic → **isUpgrade = true**
   - Logs: `✅ Immediate upgrade detected - applied now`
   
4. **Firestore Update:**
   ```javascript
   {
     packageId: 'starter',
     packageName: 'starter',
     stripePriceId: 'price_xxxxx', // Starter price ID
     status: 'active',
     currentPeriodStart: Timestamp(Feb 4, 2026 10:30:00),
     currentPeriodEnd: Timestamp(Mar 4, 2026 10:30:00),
     scheduledChange: FieldValue.delete(), // Clears any existing scheduled changes
     updatedAt: Timestamp(now)
   }
   ```

5. **UI Updates:**
   - Shows green success message: "Upgraded to Starter successfully! Your new plan is active immediately. You've been charged a prorated amount."
   - Auto-dismisses after 3 seconds
   - Waits 2 seconds for webhook to process
   - Reloads page
   - Current Plan Card shows: "Starter"
   - Period dates updated to new dates
   - NO scheduled change banner

**Database State After:**
- `packageName`: `'starter'`
- `scheduledChange`: does NOT exist
- Period dates: reset to now

**Verification Checklist:**
- [ ] Green success banner appears
- [ ] Page reloads after ~5 seconds
- [ ] Current plan shows "Starter"
- [ ] Period start shows today's date
- [ ] Period end shows ~1 month from now
- [ ] NO blue scheduled change banner
- [ ] Stripe dashboard shows new invoice
- [ ] Can immediately upgrade to Professional

---

### Scenario 2: UPGRADE - Starter → Professional

**User Action:** Click "Upgrade to Professional" while on Starter plan

**Expected Flow:**

1. **API Call:**
   - Starter price: $X
   - Professional price: $Y
   - $Y > $X → **UPGRADE**
   - `proration_behavior: 'always_invoice'`

2. **Stripe:**
   - Immediate charge (prorated)
   - Resets period dates
   - Metadata: `packageName: 'professional'`

3. **Webhook:**
   - Compares prices: Professional > Starter → **isUpgrade = true**
   - Logs: `✅ Immediate upgrade detected`

4. **Firestore:**
   ```javascript
   {
     packageId: 'professional',
     packageName: 'professional',
     stripePriceId: 'price_yyyyy',
     currentPeriodStart: Timestamp(Feb 4, 2026 10:35:00),
     currentPeriodEnd: Timestamp(Mar 4, 2026 10:35:00),
     scheduledChange: FieldValue.delete(),
     updatedAt: Timestamp(now)
   }
   ```

5. **UI:**
   - Green success: "Upgraded to Professional successfully!"
   - Reloads page
   - Shows Professional plan
   - New period dates

**Database State After:**
- `packageName`: `'professional'`
- `scheduledChange`: does NOT exist

**Verification Checklist:**
- [ ] Green success banner
- [ ] Immediate charge in Stripe
- [ ] Period dates reset
- [ ] Current plan: "Professional"
- [ ] Can still downgrade to Starter or Basic

---

### Scenario 3: DOWNGRADE - Professional → Starter

**User Action:** Click "Downgrade to Starter" while on Professional plan

**Expected Flow:**

1. **API Call:**
   - Professional price: $Y
   - Starter price: $X
   - $X < $Y → **DOWNGRADE**
   - `proration_behavior: 'none'`
   - `billing_cycle_anchor: 'unchanged'`

2. **Stripe:**
   - NO immediate charge
   - Period dates remain unchanged (still shows Mar 4 end date)
   - Metadata: `packageName: 'starter'` (but subscription still active on Professional)

3. **Webhook:**
   - Compares prices: Starter < Professional → **isUpgrade = false**
   - Logs: `📅 Scheduled downgrade detected`

4. **Firestore:**
   ```javascript
   {
     packageId: 'professional', // UNCHANGED - still on Pro
     packageName: 'professional', // UNCHANGED
     stripePriceId: 'price_yyyyy', // Still Pro price
     currentPeriodStart: Timestamp(Feb 4, 2026 10:30:00), // Original date
     currentPeriodEnd: Timestamp(Mar 4, 2026 10:30:00), // Original date
     scheduledChange: { // NEW FIELD
       packageName: 'starter',
       packageId: 'starter',
       billingCycle: 'monthly',
       effectiveDate: Timestamp(Mar 4, 2026 10:30:00), // When change will apply
       scheduledAt: Timestamp(Feb 4, 2026 10:40:00)
     },
     updatedAt: Timestamp(now)
   }
   ```

5. **UI:**
   - Blue success message: "Downgrade to Starter scheduled successfully! Your plan will change to Starter on March 4, 2026. You'll continue to have access to your current plan until then. ⓘ During this transition period, you cannot make further plan changes. You can only cancel this scheduled downgrade."
   - Auto-dismisses after 5 seconds
   - Reloads page
   - Shows blue scheduled change banner
   - All upgrade/downgrade buttons DISABLED except cancel

**Database State After:**
- `packageName`: `'professional'` (still current plan)
- `scheduledChange`: EXISTS with Starter info
- Period dates: unchanged

**Verification Checklist:**
- [ ] Blue success message with date
- [ ] Blue banner appears: "Your plan will change from Professional to Starter on March 4, 2026"
- [ ] Current plan still shows "Professional"
- [ ] Period dates unchanged
- [ ] NO immediate charge
- [ ] ALL upgrade/downgrade buttons disabled
- [ ] Tooltip on disabled buttons: "You have a pending plan change..."
- [ ] "Cancel Change" button visible in banner

---

### Scenario 4: DOWNGRADE - Professional → Basic

**User Action:** Click "Downgrade to Basic" while on Professional

**Expected Flow:**
Same as Scenario 3, but with Basic instead of Starter.

**Firestore:**
```javascript
{
  packageId: 'professional', // Current
  scheduledChange: {
    packageName: 'basic', // Scheduled
    packageId: 'basic',
    effectiveDate: Timestamp(Mar 4, 2026)
  }
}
```

**Verification Checklist:**
- [ ] Blue banner: "Professional to Basic on March 4, 2026"
- [ ] All buttons disabled
- [ ] Can only cancel

---

### Scenario 5: DOWNGRADE - Starter → Basic

**User Action:** Click "Downgrade to Basic" while on Starter

**Expected Flow:**
- Starter price: $X
- Basic price: $0
- $0 < $X → **DOWNGRADE**
- Scheduled for next period

**Firestore:**
```javascript
{
  packageId: 'starter', // Current
  scheduledChange: {
    packageName: 'basic',
    packageId: 'basic',
    effectiveDate: Timestamp(Mar 4, 2026)
  }
}
```

**Verification Checklist:**
- [ ] Blue banner appears
- [ ] Current plan: Starter
- [ ] Scheduled: Basic
- [ ] No charge

---

### Scenario 6: CANCEL SCHEDULED DOWNGRADE

**User Action:** Click "Cancel Change" button in blue banner

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

**Expected Flow:**

1. **API Call** (`/api/stripe/cancel-scheduled-change`):
   - Receives: `subscriptionId`, `currentPackageName: 'professional'`
   - Updates Stripe metadata back to: `packageName: 'professional'`
   - Uses `proration_behavior: 'none'` (no charges)
   - Triggers webhook

2. **Webhook:**
   - New package name: `'professional'`
   - Current package name: `'professional'`
   - They match, BUT `scheduledChange` exists
   - Logs: `🚫 Scheduled change cancelled - clearing scheduledChange field`

3. **Firestore:**
   ```javascript
   {
     packageId: 'professional',
     packageName: 'professional',
     scheduledChange: FieldValue.delete(), // REMOVED
     updatedAt: Timestamp(now)
   }
   ```

4. **UI:**
   - Button shows "Cancelling..."
   - Waits 2 seconds for webhook
   - Reloads page
   - Blue banner DISAPPEARS
   - All upgrade/downgrade buttons RE-ENABLED
   - Can now make new plan changes

**Database State After:**
- `packageName`: `'professional'`
- `scheduledChange`: does NOT exist

**Verification Checklist:**
- [ ] Confirmation dialog appears
- [ ] Button shows "Cancelling..." with spinner
- [ ] Page reloads after ~3 seconds
- [ ] Blue banner disappears
- [ ] Current plan still "Professional"
- [ ] All upgrade/downgrade buttons enabled again
- [ ] Can now schedule new changes

---

### Scenario 7: MULTIPLE UPGRADES IN SAME PERIOD

**User Action:**
1. Start on Basic
2. Upgrade to Starter
3. Immediately upgrade to Professional

**Expected Flow:**

**First Upgrade (Basic → Starter):**
- Charge: $X prorated for remaining month
- Period reset to Feb 4 - Mar 4

**Second Upgrade (Starter → Professional):**
- Charge: $(Y-X) prorated for remaining month
- Period reset AGAIN to Feb 4 10:45 - Mar 4 10:45
- Both upgrades succeed

**Firestore Final State:**
```javascript
{
  packageId: 'professional',
  stripePriceId: 'price_yyyyy',
  currentPeriodStart: Timestamp(Feb 4, 2026 10:45:00), // Second reset
  currentPeriodEnd: Timestamp(Mar 4, 2026 10:45:00),
  scheduledChange: does NOT exist
}
```

**Verification Checklist:**
- [ ] First upgrade succeeds immediately
- [ ] Second upgrade button becomes available after reload
- [ ] Second upgrade also succeeds immediately
- [ ] Two charges in Stripe (both prorated)
- [ ] Period dates reset twice
- [ ] Final plan: Professional

---

### Scenario 8: ATTEMPT CHANGE DURING TRANSITION PERIOD (Should Fail)

**User Action:**
1. Downgrade from Professional to Starter (creates scheduledChange)
2. Try to upgrade to Professional OR downgrade to Basic

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

**Expected Behavior:**

1. **UI:**
   - Blue banner visible
   - ALL upgrade/downgrade buttons DISABLED
   - Buttons have gray background
   - `cursor-not-allowed` style
   - Tooltip: "You have a pending plan change. Cancel it first to make new changes."

2. **If somehow clicked (shouldn't be possible):**
   - Button won't trigger because `disabled` prop is true

**Verification Checklist:**
- [ ] Upgrade to Professional button: DISABLED
- [ ] Downgrade to Basic button: DISABLED
- [ ] Only "Cancel Change" button is clickable
- [ ] Tooltip shows on hover
- [ ] Clicking disabled buttons does nothing

---

### Scenario 9: SCHEDULED CHANGE TAKES EFFECT (Automatic)

**Setup:**
1. Feb 4: User downgrades Professional → Starter
2. scheduledChange created with effectiveDate: Mar 4

**What Happens on Mar 4:**

1. **Stripe:**
   - Billing period ends
   - Stripe automatically charges for Starter plan
   - Creates invoice for $X
   - Period updates: Mar 4 - Apr 4
   - Triggers `customer.subscription.updated` webhook

2. **Webhook:**
   - Checks if `scheduledChange` exists: YES
   - Compares `scheduledChange.effectiveDate` to now
   - Mar 4 <= Mar 4: TRUE (time has come)
   - Logs: `Applied scheduled change: starter`

3. **Firestore:**
   ```javascript
   {
     packageId: 'starter', // CHANGED
     packageName: 'starter', // CHANGED
     stripePriceId: 'price_xxxxx', // Starter price
     currentPeriodStart: Timestamp(Mar 4, 2026),
     currentPeriodEnd: Timestamp(Apr 4, 2026),
     scheduledChange: FieldValue.delete(), // REMOVED
     updatedAt: Timestamp(now)
   }
   ```

4. **UI (when user visits):**
   - Blue banner GONE
   - Current plan: Starter
   - New period dates
   - All buttons re-enabled

**Verification Checklist:**
- [ ] On Mar 4, Stripe charges for Starter
- [ ] Database updates automatically
- [ ] scheduledChange field deleted
- [ ] packageName changed to 'starter'
- [ ] User sees Starter plan
- [ ] No manual action needed

---

## Edge Cases

### Edge Case 1: Webhook Delay / Race Condition

**Problem:** User clicks upgrade, page reloads before webhook processes.

**Solution Implemented:**
- UpdateSubscriptionButton waits 2 seconds before calling `onSuccess`
- ScheduledChangeBanner waits 2 seconds before reload
- Gives webhook time to process and update Firestore

**Test:**
1. Open browser DevTools → Network tab → Add throttling
2. Upgrade from Basic to Starter
3. Check if data is fresh after reload

**Expected:**
- [ ] Page shows loading/success message for at least 2 seconds
- [ ] After reload, correct plan is displayed
- [ ] No need for manual refresh

---

### Edge Case 2: Duplicate Webhook Events

**Problem:** Stripe might send duplicate `subscription.updated` events.

**Current Handling:**
- Webhook is idempotent
- Uses `set(..., { merge: true })` 
- Re-applying same change is safe

**Test:**
1. Check Firebase Functions logs
2. Look for duplicate event IDs

**Expected:**
- [ ] If duplicate events occur, final state is still correct
- [ ] No errors in logs

---

### Edge Case 3: Metadata Mismatch

**Problem:** Stripe metadata has different value than Firestore.

**Solution:**
- Webhook always trusts Stripe as source of truth
- Price comparison happens via Stripe API
- Firestore is updated to match

**Test:**
1. Manually edit Firestore to wrong package
2. Trigger a subscription update
3. Webhook should correct it

**Expected:**
- [ ] Firestore corrects to match Stripe metadata

---

## Testing Checklist Summary

### Initial Setup
- [ ] Create test account
- [ ] Subscribe to Starter plan
- [ ] Verify initial state in Firestore

### Upgrade Tests
- [ ] Basic → Starter (immediate, charge, dates reset)
- [ ] Starter → Professional (immediate, charge, dates reset)
- [ ] Basic → Professional (skip tier, immediate)
- [ ] Multiple upgrades in sequence (all immediate)

### Downgrade Tests
- [ ] Professional → Starter (scheduled, no charge, banner)
- [ ] Professional → Basic (scheduled, no charge, banner)
- [ ] Starter → Basic (scheduled, no charge, banner)
- [ ] Check all buttons disabled during transition

### Cancel Tests
- [ ] Cancel Professional → Starter downgrade
- [ ] Cancel Professional → Basic downgrade
- [ ] Cancel Starter → Basic downgrade
- [ ] Verify buttons re-enabled after cancel

### Automatic Application
- [ ] Wait for scheduled date (or manually advance time in Stripe)
- [ ] Verify webhook applies change automatically
- [ ] Verify scheduledChange deleted

### UI/UX Tests
- [ ] Green banner for upgrades (3s dismiss)
- [ ] Blue banner for downgrades (5s dismiss)
- [ ] Blue scheduled change banner appears
- [ ] Tooltips on disabled buttons
- [ ] Loading states during operations
- [ ] No race conditions on reload

### Database Integrity
- [ ] stripePriceId always matches current package
- [ ] Period dates update correctly on upgrades
- [ ] Period dates preserved on downgrades
- [ ] scheduledChange only exists during transition
- [ ] packageName matches packageId

---

## Database Schema Reference

### Firestore: `subscriptions/{userId}`

```typescript
interface Subscription {
  userId: string;
  organizationId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trial';
  
  // Current active plan
  packageId: string; // 'basic', 'starter', 'professional'
  packageName: string; // Same as packageId
  billingCycle: 'monthly' | 'annual';
  stripePriceId: string; // Current Stripe price ID
  
  // Period dates (reset on upgrades, preserved on downgrades)
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  
  // Only exists during downgrade transition period
  scheduledChange?: {
    packageName: string;
    packageId: string;
    billingCycle: string;
    effectiveDate: Timestamp; // When change will apply
    scheduledAt: Timestamp; // When user initiated change
  };
  
  updatedAt: Timestamp;
}
```

---

## Troubleshooting

### Issue: Blue banner shows same plan twice
**Symptom:** "Your plan will change from Professional to Professional"

**Cause:** scheduledChange not deleted when change was cancelled

**Fix:** 
- Webhook now checks if packageName unchanged but scheduledChange exists
- Explicitly deletes scheduledChange
- Check logs for: `🚫 Scheduled change cancelled`

### Issue: Page shows old data after reload
**Symptom:** Click upgrade, page reloads, still shows old plan

**Cause:** Race condition - webhook hasn't processed yet

**Fix:**
- Added 2-second delay before reload
- Webhook processing time: ~1-2 seconds typically
- If still happening, increase delay to 3 seconds

### Issue: Can't make changes after downgrade
**Symptom:** All buttons disabled, no banner

**Cause:** scheduledChange field exists but shouldn't

**Fix:**
- Manually delete `scheduledChange` field from Firestore
- Or cancel and redo the change

### Issue: Multiple scheduled changes stacking
**Symptom:** Multiple scheduledChange entries

**Cause:** scheduledChange is an object, not array - this shouldn't happen

**Fix:**
- Check database structure
- scheduledChange should be single object
- If seeing multiple, investigate code

---

## Success Criteria

All tests pass when:

✅ Upgrades apply immediately with correct charges
✅ Downgrades schedule for next period with no charge  
✅ Scheduled changes show clear UI messaging
✅ Transition period blocks new changes
✅ Cancel functionality works correctly
✅ No race conditions or stale data
✅ Database always consistent with Stripe
✅ Period dates handle correctly for both scenarios
✅ User can perform multiple upgrades
✅ Automatic application works on scheduled date

---

**End of Test Plan**
