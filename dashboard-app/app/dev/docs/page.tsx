"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DocFile {
  name: string;
  slug: string;
  size: number;
  modified: string;
}

export default function DevDocsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not localhost
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await fetch("/api/dev/docs");
        if (!response.ok) {
          throw new Error("Failed to fetch docs");
        }
        const data = await response.json();
        setDocs(data.files || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load docs");
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Development Documentation
          </h1>
          <p className="text-slate-600">
            Browse internal project documentation (localhost only)
          </p>
        </div>

        {docs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-slate-600">
            No documentation files found
          </div>
        ) : (
          <div className="grid gap-4">
            {docs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/dev/docs/${doc.slug}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-slate-200 hover:border-slate-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      {doc.name}
                    </h2>
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                      <span>Modified: {new Date(doc.modified).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
