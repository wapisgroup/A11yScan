"use client";

import React, { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { PiCheckCircle, PiWarningCircle, PiInfo } from "react-icons/pi";
import { PageContainer } from "../molecule/page-container";
import { LoadingState } from "../atom/LoadingState";

type ProjectConfig = {
  maxPages?: number;
  crawlDelayMs?: number;
  robotsRespect?: boolean;
  storeArtifacts?: boolean;
};

type Project = {
  id: string;
  config?: ProjectConfig;
};

type SettingsTabProps = {
  project: Project;
};

export function SettingsTab({ project }: SettingsTabProps) {
  const projectId = project?.id;
  const config = project?.config;

  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; message?: string }>({
    kind: "idle",
  });

  const defaults = useMemo(
    () => ({
      maxPages: config?.maxPages ?? 1000,
      crawlDelayMs: config?.crawlDelayMs ?? 100,
      robotsRespect: config?.robotsRespect ?? true,
      storeArtifacts: config?.storeArtifacts ?? true,
    }),
    [config]
  );

  async function updateProjectConfig(updated: Partial<ProjectConfig>) {
    if (!projectId) return;

    setStatus({ kind: "idle" });

    try {
      const pRef = doc(db, "projects", projectId);
      await updateDoc(pRef, { config: { ...(config || {}), ...updated } });
      setStatus({ kind: "ok", message: "Settings saved successfully" });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus({ kind: "idle" });
      }, 3000);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ kind: "error", message: "Save failed: " + msg });
    }
  }

  if (!projectId) {
    return (
      <PageContainer inner>
        <div className="p-[var(--spacing-m)]">
          <LoadingState message="Loading settings..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer inner>
      <div className="flex flex-col gap-medium w-full p-[var(--spacing-m)]">
        {/* Header with Status */}
        <div className="flex items-center justify-between border-b border-solid border-white/6 pb-[var(--spacing-m)]">
          <div className="flex flex-col gap-1">
            <h2 className="as-h3-text primary-text-color">Project Settings</h2>
            <p className="as-p2-text secondary-text-color">Configure crawling and scanning behavior</p>
          </div>

          {status.kind !== "idle" && (
            <div
              className={`flex items-center gap-small px-[var(--spacing-m)] py-[var(--spacing-s)] rounded-lg ${
                status.kind === "ok" 
                  ? "bg-[var(--color-success)]/10 border border-[var(--color-success)]/30" 
                  : "bg-[var(--color-error)]/10 border border-[var(--color-error)]/30"
              }`}
              role={status.kind === "error" ? "alert" : "status"}
            >
              {status.kind === "ok" ? (
                <PiCheckCircle className="text-[var(--color-success)]" size={20} />
              ) : (
                <PiWarningCircle className="text-[var(--color-error)]" size={20} />
              )}
              <span className={`as-p2-text ${
                status.kind === "ok" ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
              }`}>
                {status.message}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-medium">
          {/* Crawling Settings */}
          <div className="bg-white p-[var(--spacing-m)] rounded-lg border border-[var(--color-border-light)] shadow-sm flex flex-col gap-medium">
            <h4 className="as-h4-text primary-text-color">Crawling Settings</h4>
            
            <div className="flex flex-col gap-medium">
              {/* Max Pages */}
              <div className="flex flex-col gap-1">
                <label className="as-p2-text primary-text-color">
                  Maximum Pages
                </label>
                <p className="as-p3-text secondary-text-color">
                  Limit the number of pages to discover during crawling
                </p>
                <input
                  type="number"
                  min="1"
                  defaultValue={defaults.maxPages}
                  onBlur={(e) => void updateProjectConfig({ maxPages: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 primary-text-color input-focus as-p2-text"
                />
              </div>

              {/* Crawl Delay */}
              <div className="flex flex-col gap-1">
                <label className="as-p2-text primary-text-color">
                  Crawl Delay (ms)
                </label>
                <p className="as-p3-text secondary-text-color">
                  Time to wait between page requests (prevents server overload)
                </p>
                <input
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={defaults.crawlDelayMs}
                  onBlur={(e) => void updateProjectConfig({ crawlDelayMs: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 primary-text-color input-focus as-p2-text"
                />
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div className="bg-white p-[var(--spacing-m)] rounded-lg border border-[var(--color-border-light)] shadow-sm flex flex-col gap-medium">
            <h4 className="as-h4-text primary-text-color">Behavior Settings</h4>
            
            <div className="flex flex-col gap-medium">
              {/* Robots.txt */}
              <div className="flex flex-col gap-1">
                <label className="as-p2-text primary-text-color">
                  Respect robots.txt
                </label>
                <p className="as-p3-text secondary-text-color">
                  Follow site's robots.txt exclusion rules during crawling
                </p>
                <div className="flex gap-small">
                  <button
                    type="button"
                    onClick={() => void updateProjectConfig({ robotsRespect: true })}
                    className={`flex-1 px-4 py-2 rounded-lg as-p2-text transition-all ${
                      defaults.robotsRespect
                        ? "bg-brand text-white shadow-sm"
                        : "bg-gray-100 secondary-text-color hover:bg-gray-200"
                    }`}
                  >
                    On
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateProjectConfig({ robotsRespect: false })}
                    className={`flex-1 px-4 py-2 rounded-lg as-p2-text transition-all ${
                      defaults.robotsRespect === false
                        ? "bg-brand text-white shadow-sm"
                        : "bg-gray-100 secondary-text-color hover:bg-gray-200"
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              {/* Store Artifacts */}
              <div className="flex flex-col gap-1">
                <label className="as-p2-text primary-text-color">
                  Store Artifacts
                </label>
                <p className="as-p3-text secondary-text-color">
                  Save screenshots and HTML snapshots for each scanned page
                </p>
                <div className="flex gap-small">
                  <button
                    type="button"
                    onClick={() => void updateProjectConfig({ storeArtifacts: true })}
                    className={`flex-1 px-4 py-2 rounded-lg as-p2-text transition-all ${
                      defaults.storeArtifacts
                        ? "bg-brand text-white shadow-sm"
                        : "bg-gray-100 secondary-text-color hover:bg-gray-200"
                    }`}
                  >
                    On
                  </button>
                  <button
                    type="button"
                    onClick={() => void updateProjectConfig({ storeArtifacts: false })}
                    className={`flex-1 px-4 py-2 rounded-lg as-p2-text transition-all ${
                      defaults.storeArtifacts === false
                        ? "bg-brand text-white shadow-sm"
                        : "bg-gray-100 secondary-text-color hover:bg-gray-200"
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[var(--color-info)]/10 border border-[var(--color-info)]/30 rounded-lg p-[var(--spacing-m)] flex gap-small">
          <PiInfo className="text-[var(--color-info)] flex-shrink-0 mt-0.5" size={20} />
          <div className="flex flex-col gap-1">
            <p className="as-p2-text primary-text-color">Settings are applied during page collection</p>
            <p className="as-p2-text secondary-text-color">
              These settings will be used when collecting pages from your sitemap or starting a crawl. 
              Changes take effect immediately for new crawls.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}