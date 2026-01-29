# A11yScan Cost Analysis & Pricing Strategy

## Monthly Cost Breakdown (Google Cloud Platform)

### 1. Firebase Hosting (Public Website + Main App if using Firebase)

**Public Website (Static)**
- Storage: ~100 MB → **$0.026/GB** = **$0.003/month**
- Bandwidth: 
  - 1,000 visitors/month × 2 MB average = 2 GB
  - First 10 GB free, then **$0.15/GB**
  - **Free tier covers this**

**Main App Hosting (if using Firebase)**
- Similar costs, but recommend Vercel (see below)
- **Total Firebase Hosting: ~$0-5/month**

**Recommendation:** Use Vercel for main app (better Next.js support, free tier available)

---

### 2. Vercel (Main App Dashboard) - **Recommended**

**Pro Plan: $20/month** (required for commercial use)
- 100 GB bandwidth
- Unlimited sites
- Advanced analytics
- Custom domains
- Commercial license

**Bandwidth overage:** $40/100GB (unlikely for SaaS dashboard)

**Total Vercel: $20/month**

---

### 3. Firebase Firestore (Database)

**Free Tier:**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

**Paid Usage (Blaze plan):**
- Storage: **$0.18/GB/month**
- Reads: **$0.06 per 100,000 documents**
- Writes: **$0.18 per 100,000 documents**
- Deletes: **$0.02 per 100,000 documents**

**Estimated Monthly Usage (100 active users, 1000 scans/month):**

| Operation | Count | Cost |
|-----------|-------|------|
| Storage (projects, scans, results) | 5 GB | $0.90 |
| Reads (dashboard views, reports) | 500,000 | $0.30 |
| Writes (scans, updates) | 100,000 | $0.18 |
| Deletes (cleanup) | 10,000 | $0.02 |

**Total Firestore: ~$1.40/month** (for 100 users, 1000 scans)

**At scale (1,000 users, 10,000 scans/month):**
- Storage: 50 GB = $9.00
- Reads: 5M = $3.00
- Writes: 1M = $1.80
- Deletes: 100K = $0.02
- **Total: ~$13.82/month**

---

### 4. Firebase Storage (PDF Reports, Artifacts)

**Free Tier:**
- 5 GB storage
- 1 GB downloads/day

**Paid Usage:**
- Storage: **$0.026/GB/month**
- Downloads: **$0.12/GB**
- Uploads: **$0.12/GB**

**Estimated Monthly Usage (1000 scans/month):**
- Average PDF size: 500 KB
- Storage: 500 MB = **$0.013**
- Downloads (users downloading reports): 50 GB = **$6.00**
- Uploads: 500 MB = **$0.06**

**Total Storage: ~$6.08/month** (for 1000 scans)

**At scale (10,000 scans/month):**
- Storage: 5 GB = $0.13
- Downloads: 500 GB = $60.00
- **Total: ~$60.13/month**

---

### 5. Firebase Authentication

**Free Tier:**
- Phone auth: 10,000 verifications/month
- Email/password: Unlimited
- Google/OAuth: Unlimited

**Paid (if using phone):**
- $0.06 per verification after 10,000

**Total Auth: $0/month** (using email/password & Google OAuth)

---

### 6. Cloud Functions (API Endpoints)

**Free Tier:**
- 2M invocations/month
- 400,000 GB-seconds compute
- 200,000 GHz-seconds compute
- 5 GB egress

**Paid Usage:**
- Invocations: **$0.40 per million**
- Compute time: **$0.0000025/GB-second**
- Memory: 256 MB typical
- Execution time: 1-5 seconds average

**Estimated Monthly Usage (1000 scans/month):**
- API calls (project CRUD, user management): 50,000 = **Free tier**
- Scan initiation calls: 1,000 = **Free tier**
- Webhook/notification functions: 10,000 = **Free tier**

**Total Cloud Functions: $0-5/month** (within free tier for moderate usage)

**At scale (10,000 scans/month):**
- 500,000 invocations = $0.00 (under 2M free)
- Compute: ~$2-5/month
- **Total: ~$5/month**

---

### 7. Worker (Cloud Run) - **Most Expensive Component**

**Cloud Run Pricing:**
- CPU: **$0.00002400 per vCPU-second**
- Memory: **$0.00000250 per GB-second**
- Requests: **$0.40 per million**

**Worker Specifications:**
- 2 vCPU
- 2 GB RAM
- Always-on: 1 minimum instance

**Estimated per Scan:**
- Scan duration: 15-30 minutes average (let's say 20 min = 1200 seconds)
- CPU: 2 vCPU × 1200 sec = 2400 vCPU-seconds = **$0.058**
- Memory: 2 GB × 1200 sec = 2400 GB-seconds = **$0.006**
- **Cost per scan: ~$0.064**

**Monthly Costs:**

| Scans/Month | CPU Cost | Memory Cost | Always-On Cost | Total |
|-------------|----------|-------------|----------------|-------|
| 100 | $5.76 | $0.60 | $70 (1 instance) | **$76.36** |
| 1,000 | $57.60 | $6.00 | $70 | **$133.60** |
| 5,000 | $288.00 | $30.00 | $140 (2 instances) | **$458.00** |
| 10,000 | $576.00 | $60.00 | $210 (3 instances) | **$846.00** |

**Alternative: Cloud Run Jobs (No Always-On)**
- Only pay when scanning
- Cold start: 5-10 seconds
- Cost per scan: $0.064 (same as above, but no always-on cost)
- **Monthly: $6.40 (100 scans) to $640 (10,000 scans)**
- **Recommended for cost savings!**

**Total Worker (Cloud Run Jobs): $0.064 per scan**

---

### 8. Puppeteer Chrome Instances

**Already included in worker costs above**, but separately:
- Uses worker's allocated CPU/memory
- No additional Chrome licensing needed (using Chromium)

---

### 9. Networking & Bandwidth

**Cloud Run Egress:**
- First 100 GB/month: **Free**
- After: **$0.12/GB**

**Estimated (1000 scans/month):**
- Crawling: 1000 sites × 100 pages × 1 MB = 100 GB = **Free**
- At 10,000 scans: 1,000 GB = $108

**Total Networking: $0-108/month** (depending on scale)

---

## Total Monthly Costs Summary

### Scenario 1: Startup (100 users, 1,000 scans/month)

| Service | Cost |
|---------|------|
| Firebase Hosting | $0 |
| Vercel (Main App) | $20 |
| Firestore | $1.40 |
| Storage | $6.08 |
| Auth | $0 |
| Cloud Functions | $0 |
| Worker (Cloud Run Jobs) | $64 |
| Networking | $0 |
| **TOTAL** | **~$91.48/month** |

**Cost per scan: $0.091**
**Cost per user: $0.91/month**

---

### Scenario 2: Growing (500 users, 5,000 scans/month)

| Service | Cost |
|---------|------|
| Firebase Hosting | $0 |
| Vercel (Main App) | $20 |
| Firestore | $7 |
| Storage | $30 |
| Auth | $0 |
| Cloud Functions | $3 |
| Worker (Cloud Run Jobs) | $320 |
| Networking | $48 |
| **TOTAL** | **~$428/month** |

**Cost per scan: $0.086**
**Cost per user: $0.86/month**

---

### Scenario 3: Scale (2,000 users, 20,000 scans/month)

| Service | Cost |
|---------|------|
| Firebase Hosting | $5 |
| Vercel (Main App) | $20 |
| Firestore | $28 |
| Storage | $120 |
| Auth | $0 |
| Cloud Functions | $10 |
| Worker (Cloud Run Jobs) | $1,280 |
| Networking | $216 |
| **TOTAL** | **~$1,679/month** |

**Cost per scan: $0.084**
**Cost per user: $0.84/month**

---

## Pricing Strategy Recommendations

### Goal: 50% Profit Margin

**Base Cost per Scan: $0.084** (at scale)
**Target Price per Scan: $0.168** (100% markup = 50% margin)

But we need to factor in:
- Customer acquisition cost (CAC)
- Support costs
- Development/maintenance
- Payment processing fees (2.9% + $0.30)
- Buffer for growth

**Recommended Pricing:**

---

### Tier 1: Free (Lead Generation)
**Price: $0/month**
- 50 pages per scan
- 1 scan per month
- Basic WCAG checks
- 7-day report retention
- Community support

**Cost to you:** ~$4.20/user/month (50 pages = 0.5 scan equivalent)
**Purpose:** Lead generation, prove value

---

### Tier 2: Pro
**Price: $99/month**
- 500 pages per scan
- 10 scans per month
- Full WCAG 2.1 testing
- 90-day report retention
- Email support
- PDF export
- Scheduled scans

**Cost to you:** ~$42/month (5 full scans @ $0.084 each, plus infrastructure)
**Profit:** $57/month per subscriber (58% margin)
**Break-even:** 1 subscriber

---

### Tier 3: Business
**Price: $299/month**
- 2,000 pages per scan
- 50 scans per month
- Everything in Pro
- 1-year retention
- Priority support
- API access
- Team collaboration (5 users)
- White-label reports

**Cost to you:** ~$210/month (25 full scans equivalent)
**Profit:** $89/month per subscriber (30% margin)
**Break-even:** 1 subscriber

---

### Tier 4: Enterprise
**Price: $999/month** (starting)
- Unlimited pages
- Unlimited scans
- Dedicated support
- SLA guarantees
- Custom integrations
- SSO/SAML
- Dedicated worker instance
- Custom contracts

**Cost to you:** ~$600/month (estimated, depends on usage)
**Profit:** $399/month per subscriber (40% margin)
**Negotiable based on volume**

---

### Alternative: Pay-Per-Scan Model

**Price per scan:**
- 0-100 pages: $5
- 101-500 pages: $15
- 501-2000 pages: $40
- 2001+ pages: $0.02 per page

**Margins:** 60-70% (higher for smaller scans)

---

## Cost Optimization Strategies

### 1. Use Cloud Run Jobs (Not Always-On)
**Savings:** $70-210/month
- Cold starts acceptable for scan workload
- Users don't need instant results

### 2. Implement Caching
- Cache scan results for unchanged pages
- **Savings:** 20-30% reduction in compute costs

### 3. Page Limits
- Enforce strict page limits per tier
- Prevents abuse and cost overruns

### 4. Scheduled Scans
- Batch scans during off-peak hours
- Get committed use discounts from GCP

### 5. Storage Lifecycle
- Auto-delete old reports after retention period
- Move to Coldline storage for archived reports
- **Savings:** 50% storage costs

### 6. Smart Crawling
- Respect robots.txt (reduces unnecessary crawling)
- Implement URL deduplication
- Skip unchanged pages
- **Savings:** 30-40% compute costs

### 7. Firestore Optimization
- Use subcollections for large datasets
- Implement pagination
- Cache frequently accessed data
- **Savings:** 40-60% read costs

### 8. CDN for Reports
- Use Cloud CDN for PDF downloads
- Cache at edge locations
- **Savings:** 60% bandwidth costs

---

## Revenue Projections

### Conservative (Year 1)
- 20 Free users
- 10 Pro ($99) = $990/month
- 3 Business ($299) = $897/month
- 1 Enterprise ($999) = $999/month

**Monthly Revenue:** $2,886
**Monthly Costs:** ~$400
**Monthly Profit:** $2,486 (86% margin)
**Annual Profit:** ~$29,832

### Moderate (Year 2)
- 100 Free users
- 50 Pro = $4,950/month
- 15 Business = $4,485/month
- 5 Enterprise = $4,995/month

**Monthly Revenue:** $14,430
**Monthly Costs:** ~$1,200
**Monthly Profit:** $13,230 (92% margin)
**Annual Profit:** ~$158,760

### Aggressive (Year 3)
- 500 Free users
- 200 Pro = $19,800/month
- 80 Business = $23,920/month
- 20 Enterprise = $19,980/month

**Monthly Revenue:** $63,700
**Monthly Costs:** ~$5,000
**Monthly Profit:** $58,700 (92% margin)
**Annual Profit:** ~$704,400

---

## Key Metrics to Monitor

1. **Cost per Scan** - Target: <$0.10
2. **Cost per Active User** - Target: <$1.00
3. **Gross Margin** - Target: >60%
4. **LTV:CAC Ratio** - Target: >3:1
5. **Churn Rate** - Target: <5%/month

---

## Break-Even Analysis

**Fixed Costs (Monthly):**
- Vercel: $20
- Minimum infrastructure: $50
- **Total:** $70/month

**Variable Costs:**
- $0.084 per scan

**Break-Even:**
- At $99/month Pro tier (10 scans): Need 1 customer
- At $299/month Business tier (50 scans): Need 1 customer

**You're profitable from Day 1 with just 1 Pro subscriber!**

---

## Recommendations

1. **Start with Cloud Run Jobs** (not always-on) to minimize costs
2. **Focus on Pro & Business tiers** for best margins
3. **Implement strict page limits** to control costs
4. **Free tier is your marketing** - make it generous but limited
5. **Enterprise is custom pricing** - negotiate based on actual costs
6. **Monitor costs weekly** - set up billing alerts
7. **Optimize aggressively** - implement caching, smart crawling immediately
8. **Consider annual plans** - 20% discount for annual prepay (better cash flow)

---

## Next Steps

1. Set up GCP billing alerts:
   - $100/month warning
   - $200/month alert
   - $500/month critical

2. Implement cost tracking per customer

3. Create dashboard showing:
   - Cost per scan
   - Cost per user
   - Margin per tier

4. Test deployment with free tier first

5. Monitor for 1 month before opening paid tiers

6. Set up Stripe for subscriptions

7. Implement usage-based billing backup (in case users exceed limits)
