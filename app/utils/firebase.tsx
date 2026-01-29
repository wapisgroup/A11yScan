"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";

import {
  getAuth,
  connectAuthEmulator,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
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
// TODO: Move these values to NEXT_PUBLIC_FIREBASE_* env vars.
const firebaseConfig = {
  apiKey: "AIzaSyD8SboIH9i5KFvEYHxZr_VUeaTuu4ndfRw",
  authDomain: "accessibilitychecker-c6585.firebaseapp.com",
  projectId: "accessibilitychecker-c6585",
  storageBucket: "accessibilitychecker-c6585.firebasestorage.app",
  messagingSenderId: "1007627748299",
  appId: "1:1007627748299:web:0f4d5b01850b8cdcc0ec4e",
  measurementId: "G-CCC28J2YFN",
} as const;

// Ensure we don't initialize multiple times with HMR / Next dev.
const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

/**
 * Optional emulator support (client-side only).
 * Set these in `.env.local`:
 * - NEXT_PUBLIC_AUTH_EMULATOR_HOST=localhost:9099
 * - NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
 * - NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST=localhost:5001
 * - NEXT_PUBLIC_STORAGE_EMULATOR_HOST=localhost:9199
 */
function maybeConnectEmulators() {
  if (process.env.NODE_ENV !== "development") return;
  // Only run in the browser
  if (typeof window === "undefined") return;

  // Persist across Next.js dev HMR reloads (module-level `let` resets on hot reload)
  const g = globalThis as unknown as { __fbEmulatorsConnected?: boolean };
  if (g.__fbEmulatorsConnected) return;
  g.__fbEmulatorsConnected = true;

  const authEmRaw = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST || "";
  if (authEmRaw) {
    const em = authEmRaw.replace(/^https?:\/\//, "");
    try {
      // Must be a URL string for Auth emulator
      connectAuthEmulator(auth, `http://${em}`, { disableWarnings: true });
      // eslint-disable-next-line no-console
      console.log("[firebase] Auth emulator connected at", em);
    } catch (err) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.log("[firebase] Firestore emulator connected at", host + ":" + port);
    } catch (err) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.log("[firebase] Functions emulator connected at", host + ":" + port);
    } catch (err) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.log("[firebase] Storage emulator connected at", host + ":" + port);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[firebase] Failed to connect Storage emulator", err);
    }
  }
}

// Connect emulators as early as possible in the browser (helps avoid auth/emulator-config-failed)
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  try {
    maybeConnectEmulators();
  } catch {
    // ignore
  }
}

type UserProfile = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  language?: string;
  organisationId?: string;
  createdAt?: unknown;
};

export type AuthUser = {
  uid: string;
  email: string | null;
} & UserProfile;

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type CreateProjectInput = {
  name: string;
  domain: string;
};

export type StartScanInput = {
  projectId: string;
  domain: string;
  maxPages?: number;
};

export type FirebaseContextValue = {
  user: AuthUser | null;
  loading: boolean;

  login: (email: string, password: string) => ReturnType<typeof signInWithEmailAndPassword>;
  loginWithGoogle: () => ReturnType<typeof signInWithPopup>;
  register: (input: RegisterInput) => ReturnType<typeof createUserWithEmailAndPassword>;
  logout: () => ReturnType<typeof signOut>;
  resetPassword: (email: string) => ReturnType<typeof sendPasswordResetEmail>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  createProject: (input: CreateProjectInput) => Promise<string>;
  startScan: (input: StartScanInput) => Promise<string>;
  getReportDownloadUrl: (gsUrl: string | null | undefined) => Promise<string | null>;

  auth: ReturnType<typeof getAuth>;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u: FirebaseUser | null) => {
      if (u) {
        try {
          const ref = doc(db, "users", u.uid);
          const snap = await getDoc(ref);
          
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            setUser({ uid: u.uid, email: u.email, ...profile });
          } else {
            // Create minimal user document if it doesn't exist
            // User will be redirected to complete company setup during registration
            const newProfile = {
              email: u.email,
              createdAt: serverTimestamp(),
            };
            await setDoc(ref, newProfile);
            setUser({ uid: u.uid, email: u.email });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed loading user profile", err);
          setUser({ uid: u.uid, email: u.email });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const provider = useMemo(() => new GoogleAuthProvider(), []);

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = () => signInWithPopup(auth, provider);

  const register = async ({ email, password, firstName, lastName, phone }: RegisterInput) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;
    await setDoc(doc(db, "users", uid), {
      firstName,
      lastName,
      phone,
      email,
      createdAt: serverTimestamp(),
    });
    return res;
  };

  const logout = () => signOut(auth);

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const current = auth.currentUser;
    if (!current) throw new Error("Not authenticated");
    if (!current.email) throw new Error("Current user has no email");

    const cred = EmailAuthProvider.credential(current.email, currentPassword);
    await reauthenticateWithCredential(current, cred);
    await updatePassword(current, newPassword);
  };

  const createProject = async ({ name, domain }: CreateProjectInput) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");

    const docRef = await addDoc(collection(db, "projects"), {
      name,
      domain,
      owner: uid,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  };

  const startScanCtx = async ({ projectId, domain, maxPages = 200 }: StartScanInput) => {
    // Note: startScan now exists as a Firebase function
    // It will get all pages in the project and create a run with all page IDs
    // The function is available via callServerFunction in other services
    throw new Error(
      "startScan context method is deprecated. Use callServerFunction('startScan', { projectId, type: 'full_scan' }) instead."
    );
  };

  const getReportDownloadUrlCtx = async (gsUrl: string | null | undefined) => {
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
  };

  const value: FirebaseContextValue = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    changePassword,
    createProject,
    startScan: startScanCtx,
    getReportDownloadUrl: getReportDownloadUrlCtx,
    auth,
    db,
    storage,
    functions,
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

// Named exports (so components can import them directly)
/**
 * @deprecated Use callServerFunction('startScan', { projectId, type: 'full_scan' }) from @/services/serverService instead.
 * Or use startFullScan from @/services/projectDetailService.
 */
export async function startScan({ projectId, domain, maxPages = 200 }: StartScanInput) {
  throw new Error(
    "startScan is deprecated. Use callServerFunction('startScan', { projectId, type: 'full_scan' }) or startFullScan from projectDetailService instead."
  );
}

export async function getReportDownloadUrl(gsUrl: string | null | undefined) {
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

export function useAuth() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <FirebaseProvider>");
  }
  return ctx;
}

export { auth, db, storage, functions };

