# A11yScan - Accessibility Checker

This monorepo contains two applications and shared backend services.

## Project Structure

```
/
├── dashboard-app/          # Main dashboard application (Next.js)
│   ├── app/               # Next.js app directory
│   ├── public/            # Dashboard static assets
│   ├── package.json       # Dashboard dependencies
│   └── ...                # Dashboard configs
│
├── public-website/        # Marketing website (Next.js + Sanity CMS)
│   ├── app/               # Website pages
│   ├── sanity/            # Sanity CMS configuration
│   ├── package.json       # Website dependencies
│   └── ...                # Website configs
│
├── functions/             # Firebase Cloud Functions
├── worker/                # Background worker service
├── emulator-data/         # Firebase emulator data
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
└── storage.rules          # Storage security rules
```

## Running the Applications

### Dashboard App
```bash
cd dashboard-app
npm run dev
# Runs on http://localhost:3000
```

### Public Website
```bash
cd public-website
npm run dev
# Runs on http://localhost:3001
```

### Firebase Emulators
```bash
firebase emulators:start --only auth,firestore,storage,functions --import=./emulator-data --export-on-exit=./emulator-data
```

### Worker Service
```bash
cd worker
npm run start:local
```

## Environment Variables

### Dashboard App (.env.local in /dashboard-app)
- Firebase configuration
- API keys

### Public Website (.env.local in /public-website)
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`

## Deployment

- **Dashboard**: Vercel (from /dashboard-app)
- **Public Website**: Vercel (from /public-website)
- **Functions**: Firebase
- **Worker**: Cloud Run

## Documentation

- [Dashboard README](./dashboard-app/README.md)
- [Public Website Sanity Setup](./public-website/README_SANITY.md)
- [Product Documentation](./PRODUCT.md)
- [Deployment Guide](./DEPLOYMENT.md)
