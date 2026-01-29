/**
 * Worker
 * ------
 * Background worker that executes crawl/scan jobs.
 *
 * Sources of jobs:
 * - Pub/Sub (production)
 * - Firestore `/jobs` collection (local/emulator fallback)
 *
 * Key responsibilities:
 * - Page collection (crawl site and create page documents)
 * - Pages → sitemap generation
 * - Accessibility scan of selected pages (axe-core via puppeteer, with a static HTML fallback)
 *
 * Safety notes:
 * - In local/emulator mode we must not call production Firestore/Storage.
 * - Firestore Admin SDK must be explicitly pointed at the emulator.
 */

const admin = require('firebase-admin');
const { handleScanPages } = require('./handlers/scanPages');
const { handlePagesToSitemapJob } = require('./handlers/pagesToSitemap');
const { handlePageCollectionJob } = require('./handlers/pageCollection');
const { handleGenerateReport } = require('./handlers/generateReport');

// --- Emulator wiring must happen BEFORE initializeApp/firestore() ---
// Admin SDK uses FIRESTORE_EMULATOR_HOST to route all traffic to the emulator.
if (process.env.EMULATOR_MODE === '1') {
  // Provide sensible defaults if not already set by `firebase emulators:start`.
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  // Ensure a project id exists (the emulator namespaces data by project).
  process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'demo-a11yscan';
  // Set up Firebase Storage emulator host
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199';
  // Set default storage bucket if not provided
  if (!process.env.STORAGE_BUCKET) {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    process.env.STORAGE_BUCKET = `${projectId}.appspot.com`;
  }
}

// Prefer explicit projectId and storageBucket so admin.app().options aren't undefined.
admin.initializeApp({ 
  projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT,
  storageBucket: process.env.STORAGE_BUCKET
});
const db = admin.firestore();

console.log('process.env.EMULATOR_MODE', process.env.EMULATOR_MODE);
console.log('admin projectId:', admin.app().options.projectId);
console.log('admin storageBucket:', admin.app().options.storageBucket);
console.log('GCLOUD_PROJECT:', process.env.GCLOUD_PROJECT);
console.log('FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
console.log('FIREBASE_STORAGE_EMULATOR_HOST:', process.env.FIREBASE_STORAGE_EMULATOR_HOST);
console.log('STORAGE_BUCKET:', process.env.STORAGE_BUCKET);

// Firestore jobs fallback (used in emulator / local dev). The worker will watch /jobs for queued jobs.
if (process.env.EMULATOR_MODE === '1' || process.env.FIRESTORE_EMULATOR_HOST) {
    // Firestore Admin SDK routes to the emulator automatically when FIRESTORE_EMULATOR_HOST is set.
    console.log('[firebase-admin] Using Firestore emulator at', process.env.FIRESTORE_EMULATOR_HOST);
    console.log('Worker: enabling Firestore jobs listener (emulator mode)');
    const jobsCol = db.collection('jobs');

    (async () => {
      const allSnap = await db.collection('projects').get();
      console.log('ALL projects:', allSnap.size);

      allSnap.forEach(d => {
        const data = d.data() || {};
        console.log('PROJECT', d.id);
      });

      const qSnap = await db.collection('jobs').where('status', '==', 'queued').get();
      console.log('QUEUED jobs:', qSnap.size);
      qSnap.forEach(d => console.log('QUEUED JOB', d.id));
    })();

    jobsCol.where('status', '==', 'queued').onSnapshot(snapshot => {
        snapshot.docs.forEach(doc => {
            try {
                console.log('Job doc:', doc.id, JSON.stringify(doc.data(), null, 2));
            } catch (e) {
                console.log('Job doc (non-serializable):', doc.id, doc.data());
            }
        });
        
        snapshot.docChanges().forEach(change => {
            console.log('change.type', change.type);
            if (change.type === 'added') {
              const doc = change.doc;
              (async () => {
                try {
                  const job = doc.data();
                  console.log('Processing job:', job);
                  if (!job || !job.action) return;
                  
                  // Claim the job (avoid double-processing on reconnects / replays).
                  const claimed = await db.runTransaction(async (tx) => {
                      const fresh = await tx.get(doc.ref);
                      const cur = fresh.data();
                      if (!cur || cur.status !== 'queued') return false;
                      tx.update(doc.ref, {
                          status: 'in-progress',
                          startedAt: admin.firestore.FieldValue.serverTimestamp(),
                      });
                      return true;
                  });

                  if (!claimed) return;

                  switch(job.action) {
                      case 'page_collection':
                          await handlePageCollectionJob(db, job.projectId, job.runId);
                          break;
                      case 'pages_to_sitemap':
                          await handlePagesToSitemapJob(db, job.projectId, job.runId);
                          break;
                      case 'scan_pages':
                      case 'full_scan':
                          await handleScanPages(db, job.projectId, job.runId);
                          break;
                      case 'generate_report':
                          await handleGenerateReport(db, job.projectId, job.runId);
                          break;
                      default:
                          console.log('Unknown job action:', job.action);
                          return;
                  }

                  await doc.ref.update({ status: 'done', doneAt: admin.firestore.FieldValue.serverTimestamp() });
                } catch (err) {
                  console.error('Error processing Firestore job doc', err);
                  try { await doc.ref.update({ status: 'error', error: String(err) }); } catch(e){}
                }
              })();
            }
        });
    }, err => console.error('Jobs listener error', err));
}

console.log('Worker started successfully. Listening for jobs...');

