A11yScan - Fully developed React + Firebase app (client-side)

This is a ready-to-run React app that integrates with Firebase:
- Auth (email/password + Google)
- Firestore for projects, runs and users
- Storage for report files (Cloud Storage / Firebase Storage)
- UI includes Login, Registration, Forgot Password, Dashboard, Projects CRUD, Reports list, Report viewer with summary and details, profile edit and password change.
- Export report to PDF using html2pdf.

SETUP
1) Install dependencies
   cd react_firebase_app_full
   npm install

2) Configure Firebase
   - Create Firebase project.
   - Enable Authentication providers (Email/Password and Google).
   - Create Firestore database.
   - Create Storage bucket.
   - Copy your Firebase config and replace the placeholder in src/utils/firebase.jsx.

3) Run locally
   npm run dev
   Open http://localhost:5173

NOTES
- The UI triggers a callable Cloud Function named 'startScan' if available; otherwise it still creates a 'runs' document in Firestore with status 'queued'. You should implement a Cloud Function or worker (Cloud Run) to consume runs and produce reports.
- Firestore security rules are not included; add them before production.
- This client assumes reports produced by the worker are uploaded to Storage and the run document updated with reportUrl = gs://bucket/path/file.json

If you want, I can:
- Add the Cloud Function code (Node) to enqueue jobs to Pub/Sub
- Add a Cloud Run worker Dockerfile with Puppeteer + axe-core to perform scans and update runs
- Deploy Firebase Hosting config and Firestore rules

