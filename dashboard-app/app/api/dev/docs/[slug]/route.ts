import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Only allow in development/localhost
  const hostname = request.headers.get("host") || "";
  if (!hostname.includes("localhost") && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { slug } = await params;
    const docsPath = path.join(process.cwd(), "..", "dev", "docs");
    const filePath = path.join(docsPath, `${slug}.md`);

    // Security check: ensure the file is within the docs directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(docsPath)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");

    return NextResponse.json({
      content,
      name: `${slug}.md`,
    });
  } catch (error) {
    console.error("Error reading document:", error);
    return NextResponse.json(
      { error: "Failed to read document" },
      { status: 500 }
    );
  }
}
