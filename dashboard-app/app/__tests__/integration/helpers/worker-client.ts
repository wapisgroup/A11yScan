/**
 * Worker API client for integration tests.
 * Simulates the worker calling the dashboard v2 API with a Bearer token.
 */
import { BASE_URL } from "./api-client";

const WORKER_TOKEN = process.env.WORKER_API_TOKEN ?? "integration-test-worker-token";

export async function workerFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${WORKER_TOKEN}`);
  headers.set("content-type", "application/json");
  return fetch(url, { ...init, headers });
}

export async function workerGet<T = unknown>(path: string): Promise<T> {
  const res = await workerFetch(path);
  return res.json();
}

export async function workerPatch(path: string, body: unknown): Promise<Response> {
  return workerFetch(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function workerPost(path: string, body: unknown): Promise<Response> {
  return workerFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
