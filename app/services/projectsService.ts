
/**
 * projectsService
 * --------------
 * Service layer for Project CRUD operations.
 *
 * Responsibilities:
 * - Load projects (one-time fetch)
 * - Subscribe to projects (realtime updates)
 * - Create / update / delete projects
 * - Start project scans via Cloud Functions (through utils/firebase)
 *
 * Notes:
 * - Firestore reads in this file use the client SDK.
 * - Realtime subscriptions return an `Unsubscribe` function; callers must call it on unmount.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  where,
  type DocumentData,
  type Timestamp,
  type Unsubscribe,
  type QuerySnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/utils/firebase";
import { callServerFunction } from "@/services/serverService";

/**
 * Validates a URL string.
 * Accepts URLs with or without protocol.
 */
export function validateUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  
  try {
    // Add https:// if no protocol specified
    const urlToTest = url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
    new URL(urlToTest);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a project name from a URL.
 * Example: "https://sta.ablelytics.com/" -> "Sta Ablelytics Com"
 */
export function generateNameFromUrl(url: string): string {
  if (!url) return "";
  
  try {
    // Add https:// if no protocol specified
    const urlToTest = url.startsWith("http://") || url.startsWith("https://") 
      ? url 
      : `https://${url}`;
    const urlObj = new URL(urlToTest);
    const hostname = urlObj.hostname;
    
    // Remove www. prefix
    const withoutWww = hostname.replace(/^www\./, "");
    
    // Split by dots and capitalize each part
    const parts = withoutWww.split(".");
    const capitalized = parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    
    return capitalized;
  } catch {
    return "";
  }
}

/**
 * Checks if a URL is already used by the current user.
 */
export async function isUrlUnique(url: string, excludeProjectId?: string): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return true; // If not authenticated, let it pass (will fail later)
  
  // Normalize URL for comparison
  const normalizedUrl = url.toLowerCase().trim();
  
  const q = query(
    collection(db, "projects"),
    where("owner", "==", uid)
  );
  
  const snap = await getDocs(q);
  
  return !snap.docs.some(doc => {
    if (excludeProjectId && doc.id === excludeProjectId) return false;
    const data = doc.data();
    const existingUrl = String(data.domain ?? "").toLowerCase().trim();
    return existingUrl === normalizedUrl;
  });
}

export type Project = {
  id: string;
  name: string | null;
  domain: string;
  owner: string | null;
  organisationId?: string | null;
  createdAt?: Timestamp | Date | null;
};

export type CreateProjectInput = {
  name?: string;
  domain: string;
};

export type UpdateProjectInput = {
  id: string;
  name: string | null;
  domain: string;
};

export async function loadProjects(): Promise<Project[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }
  
  const q = query(
    collection(db, "projects"),
    where("owner", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      id: d.id,
      name: (data.name ?? null) as string | null,
      domain: String(data.domain ?? ""),
      owner: (data.owner ?? null) as string | null,
      organisationId: (data.organisationId ?? null) as string | null,
      createdAt: (data.createdAt ?? null) as Timestamp | Date | null,
    };
  });
}

/**
 * subscribeProjects
 * -----------------
 * Realtime subscription to the `projects` collection.
 *
 * Use this when the UI should automatically reflect changes made by:
 * - this client (create/update/delete)
 * - other clients
 * - background workers writing to Firestore
 *
 * Ordering:
 * - Projects are ordered by `createdAt` descending (newest first).
 *
 * @param onNext  Callback invoked on every snapshot with the full, mapped list of projects.
 * @param onError Optional callback invoked when the subscription errors.
 *
 * @returns Firestore `Unsubscribe` function. Call it to stop listening.
 */
export function subscribeProjects(
  onNext: (projects: Project[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  // Wait for auth to initialize before subscribing
  let unsubscribeSnapshot: Unsubscribe | null = null;
  
  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    // Clean up previous subscription if any
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    
    if (!user) {
      // Return empty list if not authenticated
      onNext([]);
      return;
    }
    
    const q = query(
      collection(db, "projects"),
      where("owner", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    // Firestore will immediately invoke this listener with the current set of documents,
    // and then again whenever documents are added/changed/removed.
    unsubscribeSnapshot = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list: Project[] = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          name: (data.name ?? null) as string | null,
          domain: String(data.domain ?? ""),
          owner: (data.owner ?? null) as string | null,
          organisationId: (data.organisationId ?? null) as string | null,
          createdAt: (data.createdAt ?? null) as any,
        };
      });

      onNext(list);
    },
    (err) => onError?.(err)
  );
  });
  
  // Return cleanup function that unsubscribes from both auth and snapshot listeners
  return () => {
    unsubscribeAuth();
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

export async function createProject({ name, domain }: CreateProjectInput): Promise<Project> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");

  // Get user's organisationId
  const userDoc = await getDoc(doc(db, "users", uid));
  const organisationId = userDoc.exists() ? (userDoc.data().organisationId as string | undefined) : undefined;

  // Validate URL
  if (!validateUrl(domain)) {
    throw new Error("Invalid URL address. Please provide a valid URL.");
  }

  // Check URL uniqueness
  const isUnique = await isUrlUnique(domain);
  if (!isUnique) {
    throw new Error("You already have a project with this URL.");
  }

  // Generate name from URL if not provided
  const projectName = name?.trim() || generateNameFromUrl(domain);

  const payload = {
    name: projectName || null,
    domain,
    owner: uid,
    organisationId: organisationId || null,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "projects"), payload);

  return {
    id: ref.id,
    name: projectName || null,
    domain,
    owner: uid,
    organisationId: organisationId || null,
    createdAt: null,
  };
}

export async function updateProject(project: UpdateProjectInput): Promise<void> {
  if (!project?.id) throw new Error("project.id required");

  // Validate name is not empty
  if (!project.name?.trim()) {
    throw new Error("Project name cannot be empty.");
  }

  // Only update name - domain is locked after creation
  await updateDoc(doc(db, "projects", project.id), {
    name: project.name.trim(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  if (!id) throw new Error("id required");
  await deleteDoc(doc(db, "projects", id));
}

export async function startProjectScan(project: Pick<Project, "id" | "domain">): Promise<string> {
  if (!project?.id) throw new Error("project.id required");

  // Use startPageCollection to crawl and collect pages
  try {
    const res = await callServerFunction("startPageCollection", { projectId: project.id });
    const runId = res && typeof res === "object" && "runId" in res ? String((res as any).runId) : "unknown";
    return runId;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error("Failed to start page collection: " + msg);
  }
}
