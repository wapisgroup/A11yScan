/**
 * Firebase Admin SDK for server-side operations
 * Used in API routes to access Firestore with admin privileges
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
    // Emulator mode - no credentials needed
    initializeApp();
  }
}

export const adminDB = getFirestore();
