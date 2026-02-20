// functions/index.js
// Minimal Firebase Functions - Only scheduled tasks and webhooks
// Most functionality moved to dashboard-app API routes

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK once
admin.initializeApp();

// Import only the functions we're keeping
const {
  processEmailQueueScheduled,
} = require('./handlers/emailQueue');
const { stripeWebhook } = require('./handlers/stripeWebhook');

// ============================================================================
// Scheduled Functions (Cannot be moved to Vercel)
// ============================================================================

/**
 * Email Queue Processor
 * Runs every 2 minutes to process queued notification emails
 */
exports.processEmailQueueScheduled = processEmailQueueScheduled;

// ============================================================================
// Webhooks (Better on Firebase for reliability)
// ============================================================================

/**
 * Stripe Webhook Handler
 * Handles payment events from Stripe
 */
exports.stripeWebhook = stripeWebhook;

// ============================================================================
// Public REST API (Express, API key auth)
// ============================================================================

/**
 * Public REST API for external integrations
 * Endpoints: /v1/projects, /v1/scans, /v1/reports, etc.
 * Authentication: x-api-key header
 * Usage: CI/CD pipelines, third-party integrations
 */
const functions = require('firebase-functions');
const apiApp = require('./api/router');
exports.api = functions.https.onRequest(apiApp);

// ============================================================================
// MIGRATED TO DASHBOARD-APP
// ============================================================================
// The following functions have been moved to dashboard-app/app/api:
//
// - startScan → /api/scans/start
// - addPage → /api/pages/add
// - startPageCollection → (to be migrated)
// - startSitemap → (to be migrated)
// - scanPage → (to be migrated)
// - createPageSet → (to be migrated)
// - uploadSitemap → (to be migrated)
// - getEmailDeliveryStats → (to be migrated)
// - retryFailedEmails → (to be migrated)
// - processEmailQueueNow → (to be migrated)
// - getAdminOrganizations → (to be migrated)
// - getAdminOrganizationDetail → (to be migrated)
// - resetAdminOrganizationUsage → (to be migrated)
// - setAdminOrganizationLimitsOverride → (to be migrated)
// - api (REST API) → (to be migrated)
//
// ============================================================================

