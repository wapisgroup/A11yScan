# Firebase Functions → Dashboard-App Migration

## Overview
Moving most Firebase Functions to Next.js API routes in dashboard-app to simplify architecture and reduce deployment complexity.

## What Stays in Firebase Functions

### ✅ Keeping (Cannot move to Vercel):
- **`processEmailQueueScheduled`** - Scheduled function (runs every 2 minutes)
- **`stripeWebhook`** - Webhook handler (could move but fine here)

## Migration Status

### ✅ Completed:
1. **`startScan`** → `/api/scans/start`
2. **`addPage`** → `/api/pages/add`

### 🔄 To Migrate:

#### High Priority (Frontend Dependencies):
- [ ] `startPageCollection` → `/api/page-collection/start`
- [ ] `startSitemap` → `/api/sitemap/start`
- [ ] `scanPage` → `/api/pages/scan`
- [ ] `createPageSet` → `/api/page-sets/create`
- [ ] `uploadSitemap` → `/api/sitemap/upload`

#### Medium Priority (Admin Features):
- [ ] `getEmailDeliveryStats` → `/api/admin/email-stats`
- [ ] `retryFailedEmails` → `/api/admin/email-retry`
- [ ] `processEmailQueueNow` → `/api/admin/email-process`
- [ ] `getAdminOrganizations` → `/api/admin/organizations`
- [ ] `getAdminOrganizationDetail` → `/api/admin/organizations/[id]`
- [ ] `resetAdminOrganizationUsage` → `/api/admin/organizations/[id]/reset-usage`
- [ ] `setAdminOrganizationLimitsOverride` → `/api/admin/organizations/[id]/set-limits`

#### Low Priority (REST API):
- [ ] Entire `/functions/api` → `/dashboard-app/app/api/v1`

## Migration Pattern

### Before (Firebase Function):
```javascript
// functions/handlers/fullScan.js
const functions = require('firebase-functions');
exports.startScanHandler = async function(payload, context) {
  const uid = context.auth.uid;
  // ... logic
}

// functions/index.js
exports.startScan = functions.https.onCall(startScanHandler);
```

### After (Next.js API Route):
```typescript
// dashboard-app/app/api/scans/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/utils/firebase-admin';

export async function POST(request: NextRequest) {
  // Verify auth token
  const { getAuth } = await import('firebase-admin/auth');
  const token = request.headers.get('authorization')?.split('Bearer ')[1];
  const decodedToken = await getAuth().verifyIdToken(token);
  
  // ... logic
  return NextResponse.json({ ok: true });
}
```

## Frontend Update Pattern

### Before (Callable Function):
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const startScan = httpsCallable(functions, 'startScan');
const result = await startScan({ projectId, type: 'full_scan' });
```

### After (API Route):
```typescript
import { auth } from '@/utils/firebase';

const idToken = await auth.currentUser?.getIdToken();
const response = await fetch('/api/scans/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({ projectId, type: 'full_scan' }),
});
const result = await response.json();
```

## Benefits of Migration

1. **Simpler Deployment**: One codebase, one `vercel --prod`
2. **Shared Code**: Types, utils, components all in one place
3. **Better DX**: Hot reload, TypeScript everywhere
4. **Cost**: Both free tier, but easier to monitor in one place
5. **Performance**: Vercel Edge functions = faster cold starts

## Deployment After Migration

### Before:
```bash
cd functions && firebase deploy --only functions
cd dashboard-app && vercel --prod
```

### After:
```bash
# Only for scheduled function
cd functions && firebase deploy --only functions:processEmailQueueScheduled,functions:stripeWebhook

# Everything else
cd dashboard-app && vercel --prod
```

## Testing Checklist

After migrating each function:
- [ ] API route works in local dev
- [ ] Frontend calls new endpoint successfully
- [ ] Auth verification works
- [ ] Error handling matches original
- [ ] Deploy to Vercel preview
- [ ] Test in production
- [ ] Remove old Firebase Function
- [ ] Update frontend to remove old callable

## Next Steps

1. ✅ Backend structure created (index.js updated)
2. ✅ First two API routes created (scans/start, pages/add)
3. **YOU DO**: Create remaining API routes following the pattern
4. **YOU DO**: Update frontend calls from callable → fetch
5. **YOU DO**: Test thoroughly
6. **YOU DO**: Deploy functions with `firebase deploy --only functions`
7. **YOU DO**: Deploy dashboard-app with `vercel --prod`

## Questions?

- Pattern unclear? Check `/api/scans/start/route.ts` for reference
- Need help with specific function? Let me know which one
