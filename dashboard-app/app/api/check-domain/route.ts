import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/check-domain?url=https://example.com
 * Server-side reachability probe — avoids browser CORS restrictions.
 * Returns { live: boolean, status?: number }.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ live: false, error: "Missing url param" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
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
