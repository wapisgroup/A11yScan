import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/check-domain?url=https://example.com
 * Server-side reachability probe — avoids browser CORS restrictions.
 * Returns { live: boolean, status?: number }.
 *
 * SSRF protection: rejects private/loopback/metadata IP ranges so
 * the endpoint cannot be used to probe internal services.
 */

const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i;

function isPrivateHostname(hostname: string): boolean {
  // Reject localhost and private/link-local/CGNAT IP prefixes
  if (hostname === "localhost") return true;
  if (PRIVATE_IP_RE.test(hostname)) return true;
  // Reject AWS/GCP/Azure metadata endpoints
  if (hostname === "169.254.169.254") return true;
  if (hostname === "metadata.google.internal") return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ live: false, error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ live: false, error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https schemes
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ live: false, error: "Invalid scheme" }, { status: 400 });
  }

  if (isPrivateHostname(parsed.hostname)) {
    return NextResponse.json({ live: false, error: "Private addresses are not allowed" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(parsed.href, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return NextResponse.json({ live: true, status: res.status });
  } catch {
    return NextResponse.json({ live: false });
  }
}
