/**
 * storage.js
 * ----------
 * Initialises a singleton @google-cloud/storage client.
 * Replaces all `admin.storage().bucket()` calls from the Firebase Admin SDK.
 *
 * Required env vars:
 *   STORAGE_BUCKET   — GCS bucket name (e.g. my-project.appspot.com)
 *   GCLOUD_PROJECT   — GCP project ID
 *
 * Optional:
 *   FIREBASE_SERVICE_ACCOUNT   — JSON key string (production, if ADC unavailable)
 *   FIREBASE_STORAGE_EMULATOR_HOST — for local emulator (e.g. localhost:9199)
 */

const { Storage } = require('@google-cloud/storage');

let storageInstance = null;

function getStorage() {
    if (storageInstance) return storageInstance;

    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;

    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
        storageInstance = new Storage({
            apiEndpoint: `http://${host}`,
            projectId,
        });
        console.log('[storage] Using emulator at', `http://${host}`);
    } else {
        const opts = { projectId };
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            opts.credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }
        storageInstance = new Storage(opts);
    }

    return storageInstance;
}

/** Returns the default GCS bucket for this project. */
function getBucket(bucketName) {
    const name = bucketName || process.env.STORAGE_BUCKET;
    if (!name) throw new Error('STORAGE_BUCKET env var is not set');
    return getStorage().bucket(name);
}

/**
 * Upload a buffer or string to GCS and return a download URL.
 *
 * In emulator mode: returns the public emulator URL.
 * In production:    sets a Firebase download token and returns the
 *                   non-expiring firebasestorage.googleapis.com URL.
 *
 * @param {string} filePath   — GCS object path, e.g. scans/proj/run/page/snapshot.html
 * @param {Buffer|string} data
 * @param {string} contentType
 * @param {string} [bucketName]
 * @returns {Promise<string|null>}
 */
async function uploadAndGetUrl(filePath, data, contentType, bucketName) {
    const { randomUUID } = require('crypto');
    try {
        const bucket = getBucket(bucketName);
        const file = bucket.file(filePath);

        await file.save(data, {
            contentType,
            metadata: { cacheControl: 'public, max-age=604800' },
        });

        if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
            const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
            return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
        }

        // Production: non-expiring Firebase download token URL
        const token = randomUUID();
        await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;
    } catch (err) {
        console.error('[storage] Upload failed:', filePath, err && err.message ? err.message : err);
        return null;
    }
}

/**
 * Upload to GCS and return a signed URL (PDF reports — optionally short-lived).
 * In emulator mode returns the plain media URL instead.
 *
 * @param {string} filePath
 * @param {Buffer} data
 * @param {string} contentType
 * @param {number} [expiresMs]  — milliseconds from now, default 7 days
 * @param {string} [bucketName]
 * @returns {Promise<string>}
 */
async function uploadAndGetSignedUrl(filePath, data, contentType, expiresMs, bucketName) {
    const bucket = getBucket(bucketName);
    const file = bucket.file(filePath);

    await file.save(data, {
        contentType,
        metadata: { cacheControl: 'private, max-age=0' },
    });

    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
        const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST.replace(/^https?:\/\//, '');
        return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
    }

    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiresMs || 1000 * 60 * 60 * 24 * 7),
    });
    return url;
}

module.exports = { getStorage, getBucket, uploadAndGetUrl, uploadAndGetSignedUrl };
