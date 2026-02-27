"use client";

/**
 * firebase.tsx — Firebase SDK module-level exports.
 *
 * Auth context and useAuth() are now handled by Auth.js (next-auth).
 * SessionProvider is in app/layout.tsx; useAuth is in @/hooks/use-auth.
 *
 * This file keeps the Firebase SDK instances (auth, db, storage, functions) so
 * existing services (projectsService, serverService, etc.) can continue
 * importing them during the phased migration.
 */

import type { ReactNode } from "react";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
  connectStorageEmulator,
  type FirebaseStorage,
} from "firebase/storage";
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions";

// NOTE: In Next.js client code, only NEXT_PUBLIC_* env vars are available.
const firebaseConfig = {
  apiKey: "AIzaSyD8SboIH9i5KFvEYHxZr_VUeaTuu4ndfRw",
  authDomain: "accessibilitychecker-c6585.firebaseapp.com",
  projectId: "accessibilitychecker-c6585",
  storageBucket: "accessibilitychecker-c6585.firebasestorage.app",
  messagingSenderId: "1007627748299",
  appId: "1:1007627748299:web:0f4d5b01850b8cdcc0ec4e",
  measurementId: "G-CCC28J2YFN",
} as const;

// Prevent multiple SDK initializations during HMR
const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

/**
 * Optional emulator support (client-side only).
 * Set in `.env.local`:
 *   NEXT_PUBLIC_AUTH_EMULATOR_HOST=localhost:9099
 *   NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
 *   NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST=localhost:5001
 *   NEXT_PUBLIC_STORAGE_EMULATOR_HOST=localhost:9199
 */
function maybeConnectEmulators() {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined") return;

  const g = globalThis as unknown as { __fbEmulatorsConnected?: boolean };
  if (g.__fbEmulatorsConnected) return;
  g.__fbEmulatorsConnected = true;

  const authEmRaw = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST || "";
  if (authEmRaw) {
    const em = authEmRaw.replace(/^https?:\/\//, "");
    try {
      connectAuthEmulator(auth, `http://${em}`, { disableWarnings: true });
      console.log("[firebase] Auth emulator connected at", em);
    } catch (err) {
      console.warn("[firebase] Failed to connect Auth emulator", err);
    }
  }

  const fsEmRaw = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "";
  if (fsEmRaw) {
    const fsEm = fsEmRaw.replace(/^https?:\/\//, "");
    const [hostPart, portPart] = fsEm.split(":");
    const host = hostPart || "localhost";
    const port = portPart ? Number(portPart) : 8080;
    try {
      connectFirestoreEmulator(db, host, port);
      console.log("[firebase] Firestore emulator connected at", `${host}:${port}`);
    } catch (err) {
      console.warn("[firebase] Failed to connect Firestore emulator", err);
    }
  }

  const fnEmRaw = process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST || "";
  if (fnEmRaw) {
    const em = fnEmRaw.replace(/^https?:\/\//, "");
    const [hostPart, portPart] = em.split(":");
    const host = hostPart || "localhost";
    const port = portPart ? Number(portPart) : 5001;
    try {
      connectFunctionsEmulator(functions, host, port);
      console.log("[firebase] Functions emulator connected at", `${host}:${port}`);
    } catch (err) {
      console.warn("[firebase] Failed to connect Functions emulator", err);
    }
  }

  const stEmRaw = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST || "";
  if (stEmRaw) {
    const em = stEmRaw.replace(/^https?:\/\//, "");
    const [hostPart, portPart] = em.split(":");
    const host = hostPart || "localhost";
    const port = portPart ? Number(portPart) : 9199;
    try {
      connectStorageEmulator(storage, host, port);
      console.log("[firebase] Storage emulator connected at", `${host}:${port}`);
    } catch (err) {
      console.warn("[firebase] Failed to connect Storage emulator", err);
    }
  }
}

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  try {
    maybeConnectEmulators();
  } catch {
    // ignore
  }
}

// ─── Legacy types kept for services still using Firebase SDK directly ─────────

export type StartScanInput = {
  projectId: string;
  domain: string;
  maxPages?: number;
};

export type CreateProjectInput = {
  name: string;
  domain: string;
};

/**
 * FirebaseProvider — no-op passthrough stub.
 * Auth is now provided by SessionProvider (next-auth) in app/layout.tsx.
 * This stub prevents import errors during the phased migration.
 */
export function FirebaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * @deprecated Use startFullScan from projectDetailService instead.
 */
export async function startScan({ projectId: _projectId }: StartScanInput): Promise<never> {
  throw new Error(
    "startScan is deprecated. Use callServerFunction('startScan', { projectId, type: 'full_scan' }) or startFullScan from projectDetailService instead."
  );
}

export async function getReportDownloadUrl(gsUrl: string | null | undefined): Promise<string | null> {
  if (!gsUrl) return null;

  if (gsUrl.startsWith("gs://")) {
    const path = gsUrl.replace("gs://", "");
    const slash = path.indexOf("/");
    if (slash === -1) return null;

    const filePath = path.substring(slash + 1);
    const ref = storageRef(storage, filePath);
    return await getDownloadURL(ref);
  }

  return gsUrl;
}

/**
 * useAuth — re-exported from @/hooks/use-auth (next-auth based).
 * Workspace components importing useAuth from @/utils/firebase continue to work unchanged.
 */
export { useAuth } from "@/hooks/use-auth";

export type { Firestore, FirebaseStorage, Functions };
export { auth, db, storage, functions };
