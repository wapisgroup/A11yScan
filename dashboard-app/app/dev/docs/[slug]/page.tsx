"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Mermaid } from "@/components/Mermaid";

export default function DevDocViewPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not localhost
  useEffect(() => {
    if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!slug) return;

    const fetchDoc = async () => {
      try {
        const response = await fetch(`/api/dev/docs/${slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const data = await response.json();
        setContent(data.content || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Link
            href="/dev/docs"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to documentation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dev/docs"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all docs
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow p-8 prose prose-slate max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                // Handle mermaid diagrams
                if (!inline && language === "mermaid") {
                  return <Mermaid chart={String(children).trim()} />;
                }

                // Handle inline code (like `text`)
                if (inline) {
                  return (
                    <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                }

                // Regular code blocks
                return (
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
