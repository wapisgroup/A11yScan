/**
 * Firebase Admin SDK for server-side operations
 * Used in API routes to access Firestore with admin privileges
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Bridge NEXT_PUBLIC_ emulator env vars to the ones the Admin SDK expects
if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
}
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST;
}

// Initialize Firebase Admin SDK
if (!getApps().length) {
  // In production, use service account credentials
  // In development/emulator, Admin SDK automatically connects to emulator
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Emulator mode - no credentials needed, but project ID is required
    const projectId = 
      process.env.GCLOUD_PROJECT || 
      process.env.GOOGLE_CLOUD_PROJECT || 
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT ||
      'accessibilitychecker-c6585';
    
    initializeApp({
      projectId,
    });
    
    console.log('[Firebase Admin] Initialized with project:', projectId);
  }
}

export const adminDB = getFirestore();
