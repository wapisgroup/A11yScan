// functions/index.js
// firebase-functions v5 defaults to v2. This project uses the v1 API surface (functions.https.onCall).
// Import the v1 compatibility layer so the emulator can correctly discover functions.
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK once
admin.initializeApp();

// Import handlers from separate modules
const { 
  startPageCollectionHandler, 
  startPageCollectionHttpHandler 
} = require('./handlers/pageCollection');

const { startSitemapHandler } = require('./handlers/sitemap');
const { scanPageHandler } = require('./handlers/pageScanning');
const { 
  createPageSetHandler, 
  createPageSetHttpHandler 
} = require('./handlers/pageSet');
const { startScanHandler } = require('./handlers/fullScan');
const { addPageHandler } = require('./handlers/addPage');
const { uploadSitemapHandler } = require('./handlers/uploadSitemap');

// ============================================================================
// Callable Functions (preferred for frontend)
// ============================================================================

/**
 * Page Collection - Crawls and collects pages from a project
 */
exports.startPageCollection = functions.https.onCall(startPageCollectionHandler);

/**
 * Sitemap Generation - Converts collected pages to sitemap format
 */
exports.startSitemap = functions.https.onCall(startSitemapHandler);

/**
 * Page Scanning - Scans specific pages for accessibility issues
 */
exports.scanPage = functions.https.onCall(scanPageHandler);

/**
 * Page Set Creation - Creates filtered collections of pages
 */
exports.createPageSet = functions.https.onCall(createPageSetHandler);

/**
 * Full Scan - Scans all pages within a project
 */
exports.startScan = functions.https.onCall(startScanHandler);

/**
 * Add Page - Adds a single page to a project
 */
exports.addPage = functions.https.onCall(addPageHandler);

/**
 * Upload Sitemap - Uploads multiple pages from a sitemap
 */
exports.uploadSitemap = functions.https.onCall(uploadSitemapHandler);

// ============================================================================
// HTTP Debug Endpoints (no auth - for local testing only)
// ============================================================================

/**
 * HTTP wrapper for startPageCollection (debugging)
 * WARNING: Do NOT use in production without proper auth checks
 */
exports.startPageCollectionHttp = functions.https.onRequest(startPageCollectionHttpHandler);

/**
 * HTTP wrapper for createPageSet (debugging)
 * WARNING: Do NOT use in production without proper auth checks
 */
exports.createPageSetHttp = functions.https.onRequest(createPageSetHttpHandler);