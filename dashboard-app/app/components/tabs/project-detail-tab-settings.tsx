"use client";

/**
 * Project Detail Tab Settings
 * Shared component in tabs/project-detail-tab-settings.tsx.
 */

import React, { useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { PiCheckCircle, PiWarningCircle, PiInfo } from "react-icons/pi";
import { PageContainer } from "../molecule/page-container";
import { LoadingState } from "../atom/LoadingState";

type Cookie = {
  name: string;
  value: string;
  domain?: string;
};

type ProjectConfig = {
  maxPages?: number;
  crawlDelayMs?: number;
  robotsRespect?: boolean;
  storeArtifacts?: boolean;
  cookies?: Cookie[];
  removeCookieBanners?: 'none' | 'cookieyes' | 'all';
  complianceProfiles?: string[];
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

  console.log("Project config:", project);

  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; message?: string }>({
    kind: "idle",
  });

  const defaults = useMemo(
    () => ({
      maxPages: config?.maxPages ?? 1000,
      crawlDelayMs: config?.crawlDelayMs ?? 100,
      robotsRespect: config?.robotsRespect ?? true,
      storeArtifacts: config?.storeArtifacts ?? true,
      cookies: config?.cookies ?? [],
      removeCookieBanners: config?.removeCookieBanners ?? 'none',
      complianceProfiles: config?.complianceProfiles ?? ['ada_title_ii_wcag21'],
    }),
    [config]
  );

  const [cookieInput, setCookieInput] = useState({ name: '', value: '', domain: '' });

  const complianceProfiles = [
    {
      id: 'ada_title_ii_wcag21',
      label: 'ADA Title II (WCAG 2.1 A/AA)',
      description: 'US DOJ Title II rule aligned to WCAG 2.1 A/AA.'
    },
    {
      id: 'section_508_wcag20',
      label: 'Section 508 (WCAG 2.0 A/AA)',
      description: 'US Section 508 standards aligned to WCAG 2.0 A/AA.'
    },
    {
      id: 'en_301_549_web',
      label: 'EN 301 549 (WCAG 2.1 A/AA)',
      description: 'EU EN 301 549 web requirements aligned to WCAG 2.1 A/AA.'
    },
    {
      id: 'wcag22',
      label: 'WCAG 2.2 Level A/AA',
      description: 'Includes WCAG 2.2 A/AA success criteria.'
    }
  ];

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

  function addCookie() {
    if (!cookieInput.name || !cookieInput.value) return;
    
    const newCookie: Cookie = {
      name: cookieInput.name.trim(),
      value: cookieInput.value.trim(),
      ...(cookieInput.domain && { domain: cookieInput.domain.trim() }),
    };
    
    const updatedCookies = [...defaults.cookies, newCookie];
    void updateProjectConfig({ cookies: updatedCookies });
    setCookieInput({ name: '', value: '', domain: '' });
  }

  function removeCookie(index: number) {
    const updatedCookies = defaults.cookies.filter((_, i) => i !== index);
    void updateProjectConfig({ cookies: updatedCookies });
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
        <div className="flex items-center justify-between border-b border-solid border-[var(--color-border-light)] pb-[var(--spacing-m)]">
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

        {/* Compliance Profiles */}
        <div className="bg-white p-[var(--spacing-m)] rounded-lg border border-[var(--color-border-light)] shadow-sm flex flex-col gap-medium">
          <div className="flex flex-col gap-1">
            <h4 className="as-h4-text primary-text-color">Compliance Profiles</h4>
            <p className="as-p2-text secondary-text-color">
              Select the compliance profiles used for reports and success criteria summaries.
            </p>
          </div>

          <div className="flex flex-col gap-small">
            {complianceProfiles.map((profile) => {
              const selected = defaults.complianceProfiles.includes(profile.id);
              return (
                <label
                  key={profile.id}
                  className="flex items-start gap-small p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => {
                      const updated = event.target.checked
                        ? [...defaults.complianceProfiles, profile.id]
                        : defaults.complianceProfiles.filter((id) => id !== profile.id);
                      void updateProjectConfig({ complianceProfiles: updated });
                    }}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <span className="as-p2-text primary-text-color font-medium">
                      {profile.label}
                    </span>
                    <span className="as-p3-text secondary-text-color">
                      {profile.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Cookie Banner Handling */}
        <div className="bg-white p-[var(--spacing-m)] rounded-lg border border-[var(--color-border-light)] shadow-sm flex flex-col gap-medium">
          <div className="flex flex-col gap-1">
            <h4 className="as-h4-text primary-text-color">Cookie Banner Handling</h4>
            <p className="as-p2-text secondary-text-color">
              Automatically remove cookie consent banners from scanned pages
            </p>
          </div>

          <div className="flex flex-col gap-small">
            <label className="as-p2-text primary-text-color">Banner Removal Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-small">
              <button
                type="button"
                onClick={() => void updateProjectConfig({ removeCookieBanners: 'none' })}
                className={`px-4 py-3 rounded-lg as-p2-text transition-all text-left ${
                  defaults.removeCookieBanners === 'none'
                    ? "bg-brand text-white shadow-sm"
                    : "bg-gray-100 secondary-text-color hover:bg-gray-200"
                }`}
              >
                <div className="font-medium">None</div>
                <div className="as-p3-text mt-1 opacity-80">Keep all banners</div>
              </button>
              <button
                type="button"
                onClick={() => void updateProjectConfig({ removeCookieBanners: 'cookieyes' })}
                className={`px-4 py-3 rounded-lg as-p2-text transition-all text-left ${
                  defaults.removeCookieBanners === 'cookieyes'
                    ? "bg-brand text-white shadow-sm"
                    : "bg-gray-100 secondary-text-color hover:bg-gray-200"
                }`}
              >
                <div className="font-medium">CookieYes</div>
                <div className="as-p3-text mt-1 opacity-80">Remove CookieYes banners</div>
              </button>
              <button
                type="button"
                onClick={() => void updateProjectConfig({ removeCookieBanners: 'all' })}
                className={`px-4 py-3 rounded-lg as-p2-text transition-all text-left ${
                  defaults.removeCookieBanners === 'all'
                    ? "bg-brand text-white shadow-sm"
                    : "bg-gray-100 secondary-text-color hover:bg-gray-200"
                }`}
              >
                <div className="font-medium">All Common</div>
                <div className="as-p3-text mt-1 opacity-80">Remove all known banners</div>
              </button>
            </div>
            <p className="as-p3-text secondary-text-color mt-2">
              💡 Recommended: Use "All Common" to remove banners from CookieYes, OneTrust, Cookiebot, and other providers
            </p>
          </div>
        </div>

        {/* Cookies Configuration */}
        <div className="bg-white p-[var(--spacing-m)] rounded-lg border border-[var(--color-border-light)] shadow-sm flex flex-col gap-medium">
          <div className="flex flex-col gap-1">
            <h4 className="as-h4-text primary-text-color">Cookie Injection</h4>
            <p className="as-p2-text secondary-text-color">
              Add cookies to inject into the browser during scanning (useful for bypassing GDPR banners)
            </p>
            <p className="as-p3-text text-amber-600 mt-1">
              💡 Domain should be just the hostname (e.g., "pearson-pensions.com" or ".example.com"), not "https://www.example.com"
            </p>
          </div>

          {/* Cookie Input Form */}
          <div className="flex flex-col gap-small">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-small">
              <input
                type="text"
                placeholder="Cookie name (e.g., cookieyes-consent)"
                value={cookieInput.name}
                onChange={(e) => setCookieInput({ ...cookieInput, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 primary-text-color input-focus as-p2-text"
              />
              <input
                type="text"
                placeholder="Cookie value (e.g., consent:yes)"
                value={cookieInput.value}
                onChange={(e) => setCookieInput({ ...cookieInput, value: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 primary-text-color input-focus as-p2-text"
              />
              <input
                type="text"
                placeholder="Domain (e.g., pearson-pensions.com)"
                value={cookieInput.domain}
                onChange={(e) => setCookieInput({ ...cookieInput, domain: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 primary-text-color input-focus as-p2-text"
              />
            </div>
            <button
              type="button"
              onClick={addCookie}
              disabled={!cookieInput.name || !cookieInput.value}
              className="self-start px-4 py-2 rounded-lg bg-brand text-white as-p2-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/90 transition-all"
            >
              Add Cookie
            </button>
          </div>

          {/* Cookie List */}
          {defaults.cookies.length > 0 && (
            <div className="flex flex-col gap-small">
              <h5 className="as-p2-text font-medium primary-text-color">Configured Cookies</h5>
              <div className="space-y-2">
                {defaults.cookies.map((cookie, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="as-p2-text font-medium primary-text-color">{cookie.name}</span>
                        <span className="as-p3-text secondary-text-color">=</span>
                        <span className="as-p2-text secondary-text-color max-w-[600px] truncate">{cookie.value}</span>
                      </div>
                      {cookie.domain && (
                        <span className="as-p3-text tertiary-text-color">Domain: {cookie.domain}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCookie(idx)}
                      className="px-3 py-1 rounded-lg bg-red-100 text-red-600 as-p3-text hover:bg-red-200 transition-all"
                    > 
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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