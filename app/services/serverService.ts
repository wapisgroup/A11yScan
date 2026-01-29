/* Utility to call server-side function:
   - first attempts Firebase Callable function if `functions` exists
   - otherwise POSTs to NEXT_PUBLIC_FUNCTIONS_BASE_URL/<name>
   - when running on localhost and no base URL is provided, it will use the Functions emulator:
       http://<NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST>/<projectId>/us-central1/<name>
*/

import { httpsCallable, type Functions } from "firebase/functions";
import type { HttpsCallableResult } from "firebase/functions";

import { functions } from "../utils/firebase";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type CallServerFunctionOptions = {
  /**
   * Optional override base URL for HTTP calls.
   * Example: https://example.com/functions
   */
  baseUrl?: string;

  /** Optional override for function region (used for emulator URL) */
  region?: string;

  /** Optional override for project id (used for emulator URL) */
  projectId?: string;

  /** Optional override for emulator host (used for emulator URL) */
  emulatorHost?: string;
};

const getEnv = (name: string, fallback = ""): string => {
  // In Next.js client bundles, NEXT_PUBLIC_* are inlined at build time.
  // We still guard for SSR / test environments.
  const v = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return typeof v === "string" && v.length ? v : fallback;
};

const isLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
};

const normalizeHost = (host: string): string => {
  // accepts "localhost:5001" or "http://localhost:5001"
  if (!host) return "";
  return host.startsWith("http://") || host.startsWith("https://")
    ? host
    : `http://${host}`;
};

const tryCallable = async <TResult extends JsonValue = JsonValue>(
  fns: Functions | undefined,
  name: string,
  payload: JsonObject
): Promise<TResult | undefined> => {
  if (!fns) return undefined;

  try {
    const fn = httpsCallable<JsonObject, TResult>(fns, name);
    const res: HttpsCallableResult<TResult> = await fn(payload);
    return res.data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Callable function failed, falling back to HTTP:", err);
    return undefined;
  }
};

function buildHttpBaseUrl(opts: CallServerFunctionOptions = {}): string {
  // 1) Explicit override wins
  const explicit =
    opts.baseUrl || getEnv("NEXT_PUBLIC_FUNCTIONS_BASE_URL", "");
  if (explicit) return explicit.replace(/\/$/, "");

  // 2) Emulator (local)
  const hostRaw =
    opts.emulatorHost || getEnv("NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST", "");
  const projectId =
    opts.projectId ||
    getEnv("NEXT_PUBLIC_FIREBASE_PROJECT", "") ||
    getEnv("NEXT_PUBLIC_PROJECT_ID", "");

  const region =
    opts.region || getEnv("NEXT_PUBLIC_FUNCTIONS_REGION", "us-central1");

  const host = normalizeHost(hostRaw || "localhost:5001");

  // Emulator callable/HTTP endpoints are under /<projectId>/<region>/<name>
  if (projectId) return `${host}/${projectId}/${region}`;

  // If we don’t know projectId, at least return host (caller will likely fail, but URL is valid)
  return host;
}


export const callServerFunction = async <TResult extends JsonValue = JsonValue>(
  name: string,
  payload: JsonObject = {},
  opts: CallServerFunctionOptions = {}
): Promise<TResult> => {
  // 1) Try Firebase Callable functions first
  const callableResult = await tryCallable<TResult>(functions as Functions | undefined, name, payload);
  if (callableResult !== undefined) return callableResult;

  // 2) Fall back to HTTP
  const base = buildHttpBaseUrl(opts);

  if (!base) {
    throw new Error(
      "No functions base URL available. Set NEXT_PUBLIC_FUNCTIONS_BASE_URL or run locally with NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST and NEXT_PUBLIC_FIREBASE_PROJECT."
    );
  }

  const url = base.replace(/\/$/, "") + `/${name}`;

  if (getEnv("NEXT_PUBLIC_DEBUG_SERVER_CALLS", "") === "1") {
    // eslint-disable-next-line no-console
    console.info("[serverService] HTTP fallback", { base, url, name });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Firebase callable functions expect the request body to be wrapped as { data: ... }
    body: JSON.stringify({ data: payload }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Server returned ${res.status}`);
  }

  // Some endpoints might return JSON, some might be empty.
  // If empty, return an empty object (typed as TResult via cast).
  try {
    const json = (await res.json()) as unknown;

    // Callable-over-HTTP typically returns: { result: <TResult> }
    if (json && typeof json === "object" && "result" in (json as any)) {
      return (json as any).result as TResult;
    }

    // Some endpoints may return raw JSON.
    return json as TResult;
  } catch {
    return {} as TResult;
  }
};
