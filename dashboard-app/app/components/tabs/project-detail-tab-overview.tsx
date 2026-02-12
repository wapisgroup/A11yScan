"use client";

/**
 * Project Detail Tab Overview
 * Shared component in tabs/project-detail-tab-overview.tsx.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeProjectRuns } from "@/services/projectRunsService";
import { PiPlay, PiGlobe, PiTreeStructure, PiDownloadSimple, PiArrowRight } from "react-icons/pi";

import {
  startFullScan,
  startPageCollection,
  startSitemap,
} from "@/services/projectDetailService";
import { OverviewTaskRow } from "../molecule/overview-task-row";
import { PageContainer } from "../molecule/page-container";
import { DSButton } from "../atom/ds-button";
import { useAlert } from "../providers/window-provider";

type Run = {
  id: string;
  // add more fields if needed by RunRow
  [key: string]: unknown;
};

type Project = {
  id: string;
  sitemapUrl?: string | null;
  sitemapTreeUrl?: string | null;
  sitemapGraphUrl?: string | null;
  [key: string]: unknown;
};

type OverviewTabProps = {
  project?: Project | null;
  runs?: Run[];
  setTab: (tab: "overview" | "runs" | string) => void;
};

export function OverviewTab({ project, runs = [], setTab }: OverviewTabProps) {
  const projectId = project?.id;
  const alert = useAlert();
  const [latestRuns, setLatestRuns] = useState<Run[]>([]);

  // Subscribe to runs for real-time updates
  useEffect(() => {
    if (!projectId) return;
    
    const unsubscribe = subscribeProjectRuns(
      projectId,
      (runs) => setLatestRuns(runs.slice(0, 5)),
      (error) => console.error("Error loading runs:", error)
    );
    
    return unsubscribe;
  }, [projectId]);

  const handleStartSitemap = async () => {
    const result = await startSitemap(projectId);
    await alert(result);
  };

  const handleStartPageCollection = async () => {
    const result = await startPageCollection(projectId);
    await alert(result);
  };

  const handleStartFullScan = async () => {
    const result = await startFullScan(projectId);
    await alert(result);
  };

  if (!projectId) return <div>Loading</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Collect Pages Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-lg text-white group-hover:scale-110 transition-transform">
              <PiGlobe size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Collect Pages</h3>
          <p className="text-sm text-slate-600 mb-4">
            Automatically discover and collect all pages from your website's sitemap and internal links.
          </p>
          <DSButton
            variant="outline"
            onClick={handleStartPageCollection}
          >
            Collect pages from website
          </DSButton>
        </div>

        {/* Full Scan Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg text-white group-hover:scale-110 transition-transform">
              <PiPlay size={24} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Start Full Scan</h3>
          <p className="text-sm text-slate-600 mb-4">
            Run a comprehensive accessibility scan across all collected pages to identify issues.
          </p>
          <DSButton onClick={handleStartFullScan}>Start full scan</DSButton>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sitemap Section */}
        <PageContainer title="Sitemap" inner>
          <div className="flex flex-col gap-4">
            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate a visual sitemap to understand your website structure. This helps identify navigation patterns and ensures all pages are properly linked.
            </p>

            {project?.sitemapUrl ? (
              <>
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <PiTreeStructure size={20} className="text-green-600" />
                  <div className="flex flex-col">
                    <span className="text-sm text-green-700 font-medium">Sitemap generated</span>
                    <span className="text-xs text-green-600">Ready to view and download</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <a 
                    href={project.sitemapUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <PiDownloadSimple size={16} className="text-slate-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">Download sitemap.xml</span>
                        <span className="text-xs text-slate-500">XML format for SEO tools</span>
                      </div>
                    </div>
                    <PiArrowRight size={18} className="text-slate-400 group-hover:text-slate-600" />
                  </a>
                  
                  <Link 
                    href={`/workspace/sitemap/${projectId}`}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <PiTreeStructure size={16} className="text-slate-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">View sitemap diagram</span>
                        <span className="text-xs text-slate-500">Interactive visualization</span>
                      </div>
                    </div>
                    <PiArrowRight size={18} className="text-slate-400 group-hover:text-slate-600" />
                  </Link>
                </div>

                <DSButton onClick={handleStartSitemap} variant="outline">
                  Regenerate sitemap
                </DSButton>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3 py-6 px-4 text-center bg-slate-50 rounded-lg border border-slate-200">
                  <div className="p-4 bg-white rounded-full border border-slate-200">
                    <PiTreeStructure size={32} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">No sitemap generated yet</p>
                    <p className="text-xs text-slate-500">Generate a sitemap to visualize your site structure</p>
                  </div>
                </div>
                <DSButton onClick={handleStartSitemap}>
                  Generate sitemap
                </DSButton>
              </>
            )}
          </div>
        </PageContainer>

        {/* Latest Tasks Section */}
        <PageContainer title="Latest Tasks" inner>
          <div className="flex flex-col gap-2 w-full">
            {latestRuns.length > 0 ? (
              <>
                {latestRuns.map((r) => (
                  <OverviewTaskRow key={r.id} run={r} onClick={() => setTab("runs")} />
                ))}
                <button
                  onClick={() => setTab("runs")}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
                >
                  View all runs
                  <PiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="p-4 bg-slate-100 rounded-full">
                  <PiPlay size={32} className="text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No tasks yet</p>
                <p className="text-xs text-slate-400">Start a scan to see task history</p>
              </div>
            )}
          </div>
        </PageContainer>

        {/* Getting Started Section */}
        <PageContainer title="Getting Started" inner>
          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Collect pages</p>
                  <p className="text-xs text-slate-500 mt-1">Discover all pages on your website</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Run accessibility scan</p>
                  <p className="text-xs text-slate-500 mt-1">Analyze pages for WCAG compliance</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-semibold mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Review results</p>
                  <p className="text-xs text-slate-500 mt-1">Fix issues and improve accessibility</p>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
