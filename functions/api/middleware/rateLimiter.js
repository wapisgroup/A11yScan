// functions/api/middleware/rateLimiter.js
const admin = require('firebase-admin');
const { FieldValue, Timestamp } = require('firebase-admin/firestore');

const db = admin.firestore();

// Default plan configs keyed by packageId — mirrors dashboard-app/app/config/subscriptions.ts
const PLAN_LIMITS = {
  basic: null,       // no API access
  starter: 500,
  professional: 5000,
  enterprise: null,  // unlimited
};

/**
 * Rate-limiting middleware.
 * Checks `currentUsage.apiCallsToday` against the plan's `apiCallsPerDay` limit.
 * Increments the counter on pass.
 */
async function rateLimiter(req, res, next) {
  const { uid, subscription } = req.apiUser;

  try {
    const subRef = db.collection('subscriptions').doc(uid);
    const subSnap = await subRef.get();
    const subData = subSnap.data() || subscription;

    const packageId = subData.packageId || subData.packageName || 'basic';

    // Determine limit — prefer Firestore overrides, fallback to hardcoded
    let limit = PLAN_LIMITS[packageId];
    if (subData.limits && subData.limits.apiCallsPerDay !== undefined) {
      limit = subData.limits.apiCallsPerDay;
    }

    console.log(`Rate limit check for user ${uid} on package ${packageId}: limit=${limit}`);

    const hasUsageMap =
      !!subData.currentUsage &&
      typeof subData.currentUsage === 'object' &&
      !Array.isArray(subData.currentUsage);

    // null or 'unlimited' means no cap
    if (limit === null || limit === 'unlimited') {
      // Still increment for logging purposes
      if (!hasUsageMap) {
        await subRef.set({
          currentUsage: {
            apiCallsToday: 1,
            usagePeriodStart: Timestamp.now(),
          },
          updatedAt: Timestamp.now(),
        }, { merge: true });
      } else {
        await subRef.update({
          'currentUsage.apiCallsToday': FieldValue.increment(1),
          updatedAt: Timestamp.now(),
        });
      }
      return next();
    }

    // Check if we need to reset the daily counter
    const usage = hasUsageMap ? subData.currentUsage : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentCount = usage.apiCallsToday || 0;

    // Reset if last usage period is from a previous day
    if (usage.usagePeriodStart) {
      const periodDate = typeof usage.usagePeriodStart.toDate === 'function'
        ? usage.usagePeriodStart.toDate()
        : new Date(usage.usagePeriodStart);
      const periodDay = new Date(periodDate);
      periodDay.setHours(0, 0, 0, 0);

      if (periodDay.getTime() < today.getTime()) {
        // New day — reset counter
        await subRef.update({
          'currentUsage.apiCallsToday': 1,
          'currentUsage.usagePeriodStart': Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        return next();
      }
    }

    if (currentCount >= limit) {
      res.set('Retry-After', String(secondsUntilMidnight()));
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit,
        used: currentCount,
        resetsAt: nextMidnightISO(),
      });
    }

    // Increment counter
    if (!hasUsageMap) {
      await subRef.set({
        currentUsage: {
          apiCallsToday: 1,
          usagePeriodStart: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } else {
      const patch = {
        'currentUsage.apiCallsToday': FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      };
      if (!usage.usagePeriodStart) {
        patch['currentUsage.usagePeriodStart'] = Timestamp.now();
      }
      await subRef.update(patch);
    }

    // Attach rate info to response headers
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(Math.max(0, limit - currentCount - 1)));

    next();
  } catch (err) {
    console.error('rateLimiter error:', err);
    return res.status(500).json({ error: 'Rate limit check failed' });
  }
}

function secondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight - now) / 1000);
}

function nextMidnightISO() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.toISOString();
}

module.exports = { rateLimiter };
