

# Local development — quick guide

This document explains how to run the full project locally for development and testing. It assumes you have Node.js, npm, the Firebase CLI, and (optionally) gcloud installed.

## Overview — terminals you will use

1. **Terminal A** — Frontend dev server (Vite / React)
2. **Terminal B** — Firebase Emulators (Functions, Firestore, Auth if used)
3. **Terminal C** — Worker process (local worker that processes jobs)
4. **Optional Terminal D** — Pub/Sub emulator (if you prefer Pub/Sub over Firestore fallback)

---

## 0. Preflight / prerequisites

- Install dependencies:

```bash
# project root
npm install
# install functions deps
cd functions && npm install && cd -
# install worker deps
cd worker && npm install && cd -
```

- Create a `.env.local` in the project root with Vite env vars (example below). Restart dev server after editing.

```.env.local
VITE_FIREBASE_PROJECT=accessibilitychecker-c6585
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FUNCTIONS_EMULATOR_HOST=http://localhost:5001
VITE_FUNCTIONS_BASE_URL=http://localhost:5001
```

- If you want the worker to use Google services (Pub/Sub / Storage) instead of emulators, set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path.

---

## 1. Start the frontend (Terminal A)

From the project root run:

```bash
npm run dev
```

This starts Vite and serves the React app at `http://localhost:5173/` (default). Keep this terminal open.

---

## 2. Start Firebase emulators (Terminal B)

Start the emulators for Functions and Firestore (and Auth if you use it):

```bash
firebase emulators:start --only functions,firestore,auth,storage

# or

npm run dev:emulators
```

Notes:
- The Functions emulator will serve callable functions at `http://localhost:5001/<PROJECT_ID>/us-central1/<FUNCTION_NAME>`.
- The emulator will print the Firestore host (e.g. `localhost:8080`) and ports — we use those when running the worker in emulator mode.
- If your functions publish to Pub/Sub, you can either run the Pub/Sub emulator separately or use the Firestore fallback (recommended for quick local dev).

---

## 3. (Optional) Start Pub/Sub emulator (Terminal D)

If you want to test Pub/Sub end-to-end instead of Firestore fallback, run the Pub/Sub emulator.

```bash
gcloud beta emulators pubsub start --host-port=localhost:8085
```

Then in the shells that need the emulator, export:

```bash
export PUBSUB_EMULATOR_HOST=localhost:8085
export GCLOUD_PROJECT=local-project
export PUBSUB_TOPIC=a11yscan-jobs
export PUBSUB_SUB=a11yscan-worker-sub
```

You can create topic/subscription programmatically (helper included) or with gcloud configured to talk to emulator.

---

## 4. Start the worker (Terminal C)

Run the worker in emulator mode so it listens to Firestore `/jobs` collection or Pub/Sub subscription.

```bash
# example env for emulator mode
export FIRESTORE_EMULATOR_HOST=localhost:8080
export GCLOUD_PROJECT=accessibilitychecker-c6585
export EMULATOR_MODE=1
export PUBSUB_TOPIC=a11yscan-jobs
export PUBSUB_SUB=a11yscan-worker-sub
export FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
export STORAGE_BUCKET=${STORAGE_BUCKET:-accessibilitychecker-c6585.appspot.com}


node worker/index.js
```

Behavior:
- When `EMULATOR_MODE=1` or `FIRESTORE_EMULATOR_HOST` is set, the worker will watch Firestore `jobs` collection for queued jobs (fallback) and process them locally (writing artifacts to `local-artifacts/`).
- If you run Pub/Sub emulator and the worker is configured for it, it will subscribe to the emulator subscription instead.

---

## 5. Triggering a sitemap job (two options)

### A — From the frontend UI (recommended)

1. Open the app in the browser (`http://localhost:5173`).
2. Sign in (if function requires auth via Auth emulator).
3. Open a project and click **Generate sitemap**. The frontend calls the callable function `startSitemap` which creates a run doc and queues the job.

### B — Manual (useful for debugging)

Create a run doc and publish a job manually (helper scripts are in `worker/`):

```bash
# create run doc (connects to Firestore emulator)
node worker/createRun.js <PROJECT_ID>
# note the printed runId

# publish job to Pub/Sub emulator (or real Pub/Sub if configured)
node worker/publishJob.js <PROJECT_ID> <RUN_ID>

# or if you want to invoke callable via HTTP wrapper (startSitemapHttp)
curl -X POST "http://localhost:5001/<PROJECT_ID>/us-central1/startSitemapHttp" -H "Content-Type: application/json" -d '{"projectId":"<PROJECT_ID>"}'
```

---

## 6. Verify results

- Worker logs (Terminal C) will show crawl progress and any warnings/errors.
- Firestore emulator UI (usually at `http://localhost:4000/`) shows documents under:
  - `/projects/{projectId}/runs/{runId}`
  - `/projects/{projectId}/pages/{pageId}`
  - optional `/jobs/{runId}`
- Local artifacts (sitemap, graph JSON) are written to `local-artifacts/` when running with `EMULATOR_MODE=1`.

---

## Troubleshooting

- **Functions returns 500/INTERNAL**: check Functions emulator logs (where you ran `firebase emulators:start`) for stack traces. Common causes: Pub/Sub not available (use Firestore fallback), missing env vars, or runtime exceptions.
- **Worker does not pick up messages**: ensure `FIRESTORE_EMULATOR_HOST` and `PUBSUB_EMULATOR_HOST` env vars are set in the shell where the worker runs, and that you created the topic/sub in the Pub/Sub emulator.
- **MetadataLookupWarning**: harmless when using emulators. Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key to silence it.

---

## Quick env reference

```bash
# when using emulators locally
export FIRESTORE_EMULATOR_HOST=localhost:8080
export PUBSUB_EMULATOR_HOST=localhost:8085
export GCLOUD_PROJECT=accessibilitychecker-c6585
export EMULATOR_MODE=1

# if you need service account for real services
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa-key.json
```

---

## Next steps (suggested)

- Once local flow is stable, deploy the Functions to Cloud and the worker to Cloud Run and switch your frontend to the production functions URL / callable.
- Add monitoring and alerts for the worker (Cloud Run logs, Cloud Monitoring).

---

If you want, I can also add a `scripts/local-start.sh` and `worker/.env.example` to the repo that set these env vars and run the commands for you.