# A11yScan Deployment Guide

## Overview

Your application consists of 4 deployable components:
1. **Public Website** (marketing site) - Static Next.js
2. **Main App** (dashboard) - Next.js with Firebase
3. **Firebase Functions** (API endpoints)
4. **Worker** (background scanning service)

---

## Prerequisites

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify your project
firebase projects:list
```

---

## 1. Deploy Public Website (Static Marketing Site)

The public website is a static Next.js export that will be hosted on Firebase Hosting.

```bash
# Navigate to public-website directory
cd public-website

# Build the static site
npm run build

# Test locally (optional)
npx serve out

# Deploy to Firebase Hosting (from root directory)
cd ..
npm run deploy:public
```

**What this does:**
- Builds Next.js static export to `public-website/out`
- Deploys to Firebase Hosting target: `public-website`
- URL will be: `https://public-website-PROJECT_ID.web.app` or your custom domain

---

## 2. Deploy Main App (Dashboard)

The main app is a Next.js app that uses Firebase (client-side only). **You don't need SSR** since:
- All data comes from Firebase client SDK
- Authentication is client-side  
- No SEO needed (it's behind login)

### Option A: Vercel (Recommended - FREE for personal projects)

**Why Vercel:**
- ✅ FREE Hobby plan (perfect for getting started)
- ✅ Works with Next.js out-of-the-box (no configuration)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero-config deployments
- ✅ Upgrade to Pro ($20/month) only when you need it

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from root directory (one command!)
vercel

# Follow prompts:
# - Link to existing project or create new
# - Framework: Next.js (auto-detected)
# - Root directory: ./
# - Keep default settings

# For production deployment
vercel --prod
```

**Environment Variables on Vercel:**
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these (get from Firebase Console → Project Settings):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_USE_EMULATOR=false
```

**Cost:** FREE on Hobby plan (100GB bandwidth, unlimited sites)

**When to upgrade to Pro ($20/month):**
- Commercial use (required by Vercel ToS)
- Need team collaboration
- Want advanced analytics
- Need more than 100GB bandwidth

---

### Option B: Firebase Hosting + Static Export (Cost-Effective but Limited)

**Only works if you:**
- Don't have dynamic routes with data from Firebase
- Can pre-generate all pages at build time
- Don't mind limitations

This is NOT recommended for your app because you have dynamic routes like `/workspace/projects/[id]` that load data from Firebase at runtime.

---

### Option C: Cloud Run (For Advanced Users)

```bash
# Build Docker image for main app
docker build -t gcr.io/PROJECT_ID/a11yscan-app .

# Push to Google Container Registry
docker push gcr.io/PROJECT_ID/a11yscan-app

# Deploy to Cloud Run
gcloud run deploy a11yscan-app \
  --image gcr.io/PROJECT_ID/a11yscan-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 3. Deploy Firebase Functions

```bash
# From root directory
npm run deploy:backend

# Or deploy specific functions
firebase deploy --only functions:functionName
```

**What this deploys:**
- All functions in `/functions` directory
- API endpoints accessible at: `https://REGION-PROJECT_ID.cloudfunctions.net/functionName`

**Check function logs:**
```bash
firebase functions:log
```

---

## 4. Deploy Worker (Background Scanning Service)

The worker is a long-running Node.js process that needs to be deployed to a compute platform.

### Option A: Google Cloud Run (Recommended)

**Create Dockerfile for worker:**

```bash
# Create this file: /worker/Dockerfile
```

```dockerfile
FROM node:20-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome path for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy worker code
COPY . .

EXPOSE 8080

CMD ["node", "worker-server.js"]
```

**Deploy to Cloud Run:**

```bash
cd worker

# Build and deploy in one command
gcloud run deploy a11yscan-worker \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --min-instances 1 \
  --max-instances 10

# Get the worker URL
gcloud run services describe a11yscan-worker --region us-central1 --format 'value(status.url)'
```

**Update Firebase Functions with Worker URL:**

In your functions code, set the worker URL as an environment variable:

```bash
firebase functions:config:set worker.url="https://a11yscan-worker-xxxxx-uc.a.run.app"
```

### Option B: Google Compute Engine (For persistent VM)

```bash
# Create VM instance
gcloud compute instances create a11yscan-worker \
  --machine-type=e2-medium \
  --zone=us-central1-a \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB

# SSH into instance
gcloud compute ssh a11yscan-worker --zone=us-central1-a

# On the VM, install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs chromium-browser

# Clone your worker code or upload it
# Install dependencies and start the worker
cd /path/to/worker
npm install
npm start

# Set up PM2 for process management
sudo npm install -g pm2
pm2 start worker-server.js --name a11yscan-worker
pm2 startup
pm2 save
```

### Option C: Heroku

```bash
# Login to Heroku
heroku login

# Create new app
heroku create a11yscan-worker

# Add Heroku Chrome buildpack
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-google-chrome

# Deploy
cd worker
git init
git add .
git commit -m "Initial worker commit"
git push heroku main

# Scale worker
heroku ps:scale web=1:standard-2x
```

---

## 5. Complete Deployment Checklist

### Pre-Deployment

- [ ] Update Firebase config in both apps (remove emulator settings)
- [ ] Set `NEXT_PUBLIC_USE_EMULATOR=false` in main app
- [ ] Update worker URL in Firebase Functions config
- [ ] Set up custom domains in Firebase Hosting
- [ ] Configure Firebase security rules (firestore.rules, storage.rules)

### Deploy Steps

```bash
# 1. Deploy Firebase (Firestore rules, Storage rules, Functions, Hosting)
npm run deploy:backend

# 2. Deploy public website
npm run deploy:public

# 3. Build and deploy main app (Vercel or Cloud Run)
vercel --prod
# OR
gcloud run deploy a11yscan-app --source .

# 4. Deploy worker
cd worker
gcloud run deploy a11yscan-worker --source .

# 5. Update worker URL in functions config
firebase functions:config:set worker.url="YOUR_WORKER_URL"
firebase deploy --only functions
```

### Post-Deployment

- [ ] Test authentication flow
- [ ] Create a test project and run a scan
- [ ] Check Firebase Functions logs
- [ ] Monitor worker performance
- [ ] Set up Firebase Performance Monitoring
- [ ] Configure custom domains
- [ ] Set up SSL certificates (automatic with Firebase/Vercel/Cloud Run)
- [ ] Configure CORS if needed

---

## 6. Environment Variables Summary

### Main App (Vercel/Cloud Run)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_USE_EMULATOR=false
```

### Firebase Functions
```bash
firebase functions:config:set worker.url="https://worker-url"
```

### Worker (Cloud Run)
Set via Cloud Run environment variables in console or CLI:
```env
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## 7. Monitoring & Logs

### Firebase Functions Logs
```bash
firebase functions:log
firebase functions:log --only functionName
```

### Cloud Run Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=a11yscan-worker" --limit 50
```

### Vercel Logs
View in Vercel Dashboard → Your Project → Logs

---

## 8. Rollback Procedures

### Rollback Firebase Deployment
```bash
# View deployment history
firebase hosting:sites:list

# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION DESTINATION_SITE_ID
```

### Rollback Vercel Deployment
In Vercel Dashboard → Deployments → Click on previous deployment → Promote to Production

### Rollback Cloud Run
```bash
# List revisions
gcloud run revisions list --service a11yscan-worker

# Route traffic to previous revision
gcloud run services update-traffic a11yscan-worker --to-revisions REVISION_NAME=100
```

---

## 9. Scaling Configuration

### Worker Scaling (Cloud Run)
```bash
gcloud run services update a11yscan-worker \
  --min-instances 2 \
  --max-instances 20 \
  --concurrency 10
```

### Firebase Functions
Edit `functions/index.js`:
```javascript
exports.myFunction = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB',
    maxInstances: 10
  })
  .https.onCall((data, context) => {
    // function code
  });
```

---

## 10. Custom Domains

### Firebase Hosting (Public Website & Main App if using Firebase)
```bash
firebase hosting:channel:deploy production --only public-website
firebase hosting:sites:list

# In Firebase Console:
# Hosting → Your site → Add custom domain
# Follow DNS configuration steps
```

### Vercel (Main App)
In Vercel Dashboard → Your Project → Settings → Domains → Add Domain

### Cloud Run (Worker - Optional)
```bash
gcloud run domain-mappings create --service a11yscan-worker --domain worker.yourdomain.com
```

---

## Quick Deploy Commands

```bash
# Deploy everything (run from root)
npm run deploy:all

# Individual deployments
npm run deploy:public    # Public website
npm run deploy:backend   # Functions + Firestore rules
vercel --prod            # Main app (Vercel)
cd worker && gcloud run deploy a11yscan-worker --source .  # Worker
```

---

## Troubleshooting

### "Function deployment failed"
- Check Node.js version in functions/package.json (should be 20)
- Verify Firebase CLI is updated: `npm install -g firebase-tools`
- Check functions logs: `firebase functions:log`

### "Cloud Run deployment timeout"
- Increase memory: `--memory 2Gi`
- Increase CPU: `--cpu 2`
- Increase timeout: `--timeout 900`

### "Worker not processing jobs"
- Check Cloud Run logs
- Verify worker URL is set in Firebase Functions config
- Ensure Firestore rules allow worker to read/write
- Check if worker has proper service account permissions

### "Main app can't connect to Firebase"
- Verify environment variables are set
- Check Firebase config in app
- Ensure NEXT_PUBLIC_USE_EMULATOR=false
- Check CORS settings in Firebase

---

## Next Steps

1. Set up continuous deployment with GitHub Actions
2. Configure monitoring and alerting
3. Set up automated backups
4. Implement rate limiting
5. Add performance monitoring
6. Set up error tracking (Sentry)
7. Configure CDN for static assets
