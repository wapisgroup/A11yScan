/**
 * Lightweight HTTP client for integration tests.
 *
 * Handles:
 * - CSRF token acquisition (needed for Auth.js credentials sign-in)
 * - Session cookie management
 * - Authenticated and unauthenticated requests
 */

export const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3737";

// ── Cookie jar ───────────────────────────────────────────────────────────────

function parseCookies(setCookieHeaders: string[]): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const [pair] = header.split(";");
    const [name, ...valueParts] = pair.split("=");
    if (name) cookies[name.trim()] = valueParts.join("=").trim();
  }
  return cookies;
}

function serializeCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

// ── ApiClient ────────────────────────────────────────────────────────────────

export class ApiClient {
  private cookies: Record<string, string> = {};
  private csrfToken: string | null = null;

  /** Raw fetch that merges in the stored session cookies. */
  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    const cookieHeader = serializeCookies(this.cookies);
    const headers = new Headers(init.headers);
    if (cookieHeader) headers.set("cookie", cookieHeader);

    const res = await fetch(url, { ...init, headers, redirect: "manual" });

    // Accumulate Set-Cookie headers from responses
    const rawSetCookie = res.headers.getSetCookie?.() ?? [];
    const newCookies = parseCookies(rawSetCookie);
    Object.assign(this.cookies, newCookies);

    return res;
  }

  /** GET that returns parsed JSON. */
  async get<T = unknown>(path: string): Promise<T> {
    const res = await this.fetch(path);
    return res.json();
  }

  /** POST JSON body and return parsed JSON. */
  async post<T = unknown>(path: string, body?: unknown): Promise<Response> {
    return this.fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /** PATCH JSON body and return Response. */
  async patch(path: string, body?: unknown): Promise<Response> {
    return this.fetch(path, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /** DELETE and return Response. */
  async delete(path: string): Promise<Response> {
    return this.fetch(path, { method: "DELETE" });
  }

  // ── Auth helpers ────────────────────────────────────────────────────────

  /** Fetch CSRF token required for credentials sign-in. */
  private async fetchCsrfToken(): Promise<string> {
    // Use trailing slash — next.config.ts has trailingSlash: true which causes
    // Next.js to 308-redirect paths without a slash, and redirect: "manual" means
    // we'd receive the redirect body (not JSON) if we omit the slash.
    const res = await this.fetch("/api/auth/csrf/");
    const data = await res.json();
    return (data as { csrfToken: string }).csrfToken;
  }

  /**
   * Follow redirect chain, accumulating cookies at each hop.
   * Stops when a non-redirect response is received or maxHops is exhausted.
   */
  private async followRedirects(url: string, maxHops = 8): Promise<Response> {
    let res = await this.fetch(url.startsWith("http") ? url : `${BASE_URL}${url}`);
    let hops = 0;
    while ([301, 302, 303, 307, 308].includes(res.status) && hops < maxHops) {
      const location = res.headers.get("location");
      if (!location) break;
      res = await this.fetch(location.startsWith("http") ? location : `${BASE_URL}${location}`);
      hops++;
    }
    return res;
  }

  /**
   * Sign in using the credentials provider.
   * Returns true on success, false if credentials are wrong.
   *
   * next-auth v5 (beta) signin flow:
   *   POST /api/auth/signin/credentials/
   *     → 302 /api/auth/callback/credentials/?...   (verifies token, sets JWT cookie)
   *     → 302 callbackUrl                           (final destination)
   * We must follow the full redirect chain to capture all Set-Cookie headers.
   */
  async login(email: string, password: string): Promise<boolean> {
    this.csrfToken = await this.fetchCsrfToken();

    const formData = new URLSearchParams({
      email,
      password,
      csrfToken: this.csrfToken,
      // callbackUrl required by next-auth v5 beta callback/credentials endpoint
      callbackUrl: `${BASE_URL}/`,
    });

    // In next-auth v5 (Auth.js v5 beta), POST directly to the callback/credentials
    // endpoint — it validates CSRF, calls authorize(), sets the session JWT cookie,
    // and redirects to callbackUrl in a single request.
    const signinRes = await this.fetch("/api/auth/callback/credentials/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    // 302 = success redirect (session cookie is already in the response headers)
    if ([200, 301, 302, 303, 307, 308].includes(signinRes.status)) {
      const session = await this.getSession();
      return !!session?.user?.id;
    }
    return false;
  }

  /** Return the current Auth.js session (null if not authenticated). */
  async getSession(): Promise<{ user?: { id?: string; email?: string } } | null> {
    const res = await this.fetch("/api/auth/session/");
    if (!res.ok) return null;
    return res.json();
  }

  /** Register a new user via the register API, then log in. */
  async register(
    email: string,
    password: string,
    org: string,
    firstName: string
  ): Promise<boolean> {
    // Registration uses server actions which aren't directly HTTP-callable.
    // We POST to the dedicated register endpoint instead.
    const res = await this.post("/api/test/register/", { email, password, org, firstName });
    if (!res.ok) return false;
    return this.login(email, password);
  }

  /** Clear cookies (simulate logout). */
  clearSession(): void {
    this.cookies = {};
    this.csrfToken = null;
  }
}

/** Create a fresh unauthenticated client. */
export function makeClient(): ApiClient {
  return new ApiClient();
}
