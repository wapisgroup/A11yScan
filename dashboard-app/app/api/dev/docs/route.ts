import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  // Only allow in development/localhost
  const hostname = request.headers.get("host") || "";
  if (!hostname.includes("localhost") && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const docsPath = path.join(process.cwd(), "..", "dev", "docs");
    
    // Check if directory exists
    if (!fs.existsSync(docsPath)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(docsPath);
    const mdFiles = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const filePath = path.join(docsPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          slug: file.replace(".md", ""),
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ files: mdFiles });
  } catch (error) {
    console.error("Error reading docs:", error);
    return NextResponse.json(
      { error: "Failed to read documentation files" },
      { status: 500 }
    );
  }
}
