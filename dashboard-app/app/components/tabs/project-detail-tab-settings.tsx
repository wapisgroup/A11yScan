"use client";

/**
 * Project Detail Tab Settings
 */

import React, { useEffect, useMemo, useState } from "react";
import { updateProjectConfig } from "@/actions/projects";
import { PiCheckCircle, PiWarningCircle, PiInfo } from "react-icons/pi";
import { PageContainer } from "../molecule/page-container";
import { LoadingState } from "../atom/LoadingState";
import { DSButton } from "../atom/ds-button";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  removeCookieBanners?: "none" | "cookieyes" | "all";
  complianceProfiles?: string[];
};

type Project = {
  id: string;
  config?: ProjectConfig;
};

type SettingsTabProps = {
  project: Project;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Saves a partial config patch to PostgreSQL via Server Action. Returns error message or null. */
async function saveConfigPatch(
  projectId: string,
  _existing: ProjectConfig | undefined,
  patch: Partial<ProjectConfig>
): Promise<string | null> {
  try {
    await updateProjectConfig(projectId, patch as Record<string, unknown>);
    return null;
  } catch (err: unknown) {
    return err instanceof Error ? err.message : String(err);
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[var(--color-border-light)] shadow-sm flex flex-col gap-medium p-[var(--spacing-m)]">
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--color-border-light)] pb-[var(--spacing-s)]">
      <h4 className="as-h4-text primary-text-color">{title}</h4>
      {description && (
        <p className="as-p2-text secondary-text-color">{description}</p>
      )}
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="as-p2-text primary-text-color font-medium">{label}</label>
      {hint && <p className="as-p3-text secondary-text-color">{hint}</p>}
      {children}
    </div>
  );
}

function ToggleButtons({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-small w-48">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 px-4 py-2 rounded-lg as-p2-text transition-all ${
          value
            ? "bg-brand text-white shadow-sm"
            : "bg-[var(--color-bg-light)] secondary-text-color hover:bg-[var(--color-bg-light)]/70"
        }`}
      >
        On
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 px-4 py-2 rounded-lg as-p2-text transition-all ${
          !value
            ? "bg-brand text-white shadow-sm"
            : "bg-[var(--color-bg-light)] secondary-text-color hover:bg-[var(--color-bg-light)]/70"
        }`}
      >
        Off
      </button>
    </div>
  );
}

function SaveFooter({
  status,
  errorMsg,
  onSave,
}: {
  status: SaveStatus;
  errorMsg: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-small pt-[var(--spacing-s)] border-t border-[var(--color-border-light)]">
      <DSButton
        size="sm"
        onClick={onSave}
        disabled={status === "saving"}
      >
        {status === "saving" ? "Saving…" : "Save"}
      </DSButton>

      {status === "saved" && (
        <span className="flex items-center gap-1 as-p3-text text-[var(--color-success)]">
          <PiCheckCircle size={16} />
          Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1 as-p3-text text-[var(--color-error)]">
          <PiWarningCircle size={16} />
          {errorMsg || "Save failed"}
        </span>
      )}
    </div>
  );
}

/** Hook to manage save state for one section. */
function useSectionSave() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function save(fn: () => Promise<string | null>) {
    setStatus("saving");
    setErrorMsg("");
    const err = await fn();
    if (err) {
      setStatus("error");
      setErrorMsg(err);
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return { status, errorMsg, save };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const COMPLIANCE_PROFILES = [
  {
    id: "ada_title_ii_wcag21",
    label: "ADA Title II (WCAG 2.1 A/AA)",
    description: "US DOJ Title II rule aligned to WCAG 2.1 A/AA.",
  },
  {
    id: "section_508_wcag20",
    label: "Section 508 (WCAG 2.0 A/AA)",
    description: "US Section 508 standards aligned to WCAG 2.0 A/AA.",
  },
  {
    id: "en_301_549_web",
    label: "EN 301 549 (WCAG 2.1 A/AA)",
    description: "EU EN 301 549 web requirements aligned to WCAG 2.1 A/AA.",
  },
  {
    id: "wcag22",
    label: "WCAG 2.2 Level A/AA",
    description: "Includes WCAG 2.2 A/AA success criteria.",
  },
];

export function SettingsTab({ project }: SettingsTabProps) {
  const projectId = project?.id;
  const config = project?.config;

  // Stable defaults derived from config
  const defaults = useMemo(
    () => ({
      maxPages: config?.maxPages ?? 1000,
      crawlDelayMs: config?.crawlDelayMs ?? 100,
      robotsRespect: config?.robotsRespect ?? true,
      storeArtifacts: config?.storeArtifacts ?? true,
      cookies: config?.cookies ?? [],
      removeCookieBanners: config?.removeCookieBanners ?? "none",
      complianceProfiles: config?.complianceProfiles ?? ["ada_title_ii_wcag21"],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(config)]
  );

  // ── Section: Crawling ──────────────────────────────────────────────────────
  const [crawl, setCrawl] = useState({
    maxPages: defaults.maxPages,
    crawlDelayMs: defaults.crawlDelayMs,
  });
  const crawlSave = useSectionSave();

  useEffect(() => {
    setCrawl({ maxPages: defaults.maxPages, crawlDelayMs: defaults.crawlDelayMs });
  }, [defaults.maxPages, defaults.crawlDelayMs]);

  // ── Section: Behavior ──────────────────────────────────────────────────────
  const [behavior, setBehavior] = useState({
    robotsRespect: defaults.robotsRespect,
    storeArtifacts: defaults.storeArtifacts,
  });
  const behaviorSave = useSectionSave();

  useEffect(() => {
    setBehavior({
      robotsRespect: defaults.robotsRespect,
      storeArtifacts: defaults.storeArtifacts,
    });
  }, [defaults.robotsRespect, defaults.storeArtifacts]);

  // ── Section: Compliance Profiles ───────────────────────────────────────────
  const [profiles, setProfiles] = useState<string[]>(defaults.complianceProfiles);
  const profilesSave = useSectionSave();

  useEffect(() => {
    setProfiles(defaults.complianceProfiles);
  }, [defaults.complianceProfiles]);

  // ── Section: Cookie Banner ─────────────────────────────────────────────────
  const [bannerMode, setBannerMode] = useState<"none" | "cookieyes" | "all">(
    defaults.removeCookieBanners
  );
  const bannerSave = useSectionSave();

  useEffect(() => {
    setBannerMode(defaults.removeCookieBanners);
  }, [defaults.removeCookieBanners]);

  // ── Section: Cookie Injection (immediate actions) ──────────────────────────
  const [cookieInput, setCookieInput] = useState({ name: "", value: "", domain: "" });
  const cookieSave = useSectionSave();

  async function addCookie() {
    if (!cookieInput.name || !cookieInput.value) return;
    const newCookie: Cookie = {
      name: cookieInput.name.trim(),
      value: cookieInput.value.trim(),
      ...(cookieInput.domain ? { domain: cookieInput.domain.trim() } : {}),
    };
    const updated = [...defaults.cookies, newCookie];
    await cookieSave.save(() => saveConfigPatch(projectId, config, { cookies: updated }));
    setCookieInput({ name: "", value: "", domain: "" });
  }

  async function removeCookie(index: number) {
    const updated = defaults.cookies.filter((_, i) => i !== index);
    await cookieSave.save(() => saveConfigPatch(projectId, config, { cookies: updated }));
  }

  // ──────────────────────────────────────────────────────────────────────────

  if (!projectId) {
    return (
      <PageContainer inner>
        <div className="p-[var(--spacing-m)]">
          <LoadingState message="Loading settings…" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer inner>
      <div className="flex flex-col gap-medium w-full p-[var(--spacing-m)]">

        {/* ── Crawling Settings ────────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Crawling Settings"
            description="Control how the crawler discovers pages on your site."
          />

          <FieldRow
            label="Maximum pages"
            hint="Limit the number of pages discovered during a crawl."
          >
            <input
              type="number"
              min="1"
              value={crawl.maxPages}
              onChange={(e) =>
                setCrawl((p) => ({ ...p, maxPages: Number(e.target.value) }))
              }
              className="input w-48"
            />
          </FieldRow>

          <FieldRow
            label="Crawl delay (ms)"
            hint="Time to wait between page requests to avoid overloading the server."
          >
              <input
              type="number"
              min="0"
              step="100"
              value={crawl.crawlDelayMs}
              onChange={(e) =>
                setCrawl((p) => ({ ...p, crawlDelayMs: Number(e.target.value) }))
              }
              className="input w-48"
            />
          </FieldRow>

          <SaveFooter
            status={crawlSave.status}
            errorMsg={crawlSave.errorMsg}
            onSave={() =>
              crawlSave.save(() => saveConfigPatch(projectId, config, crawl))
            }
          />
        </SectionCard>

        {/* ── Behavior Settings ────────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Behavior Settings"
            description="Configure browser and crawling behavior during scans."
          />

          <FieldRow
            label="Respect robots.txt"
            hint="Follow the site's robots.txt exclusion rules during crawling."
          >
            <ToggleButtons
              value={behavior.robotsRespect}
              onChange={(v) => setBehavior((p) => ({ ...p, robotsRespect: v }))}
            />
          </FieldRow>

          <FieldRow
            label="Store artifacts"
            hint="Save screenshots and HTML snapshots for each scanned page."
          >
            <ToggleButtons
              value={behavior.storeArtifacts}
              onChange={(v) => setBehavior((p) => ({ ...p, storeArtifacts: v }))}
            />
          </FieldRow>

          <SaveFooter
            status={behaviorSave.status}
            errorMsg={behaviorSave.errorMsg}
            onSave={() =>
              behaviorSave.save(() => saveConfigPatch(projectId, config, behavior))
            }
          />
        </SectionCard>

        {/* ── Compliance Profiles ──────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Compliance Profiles"
            description="Select the standards used for reports and success criteria."
          />

          <div className="flex flex-col gap-small">
            {COMPLIANCE_PROFILES.map((profile) => (
              <label
                key={profile.id}
                className="flex items-start gap-small p-3 rounded-lg border border-[var(--color-border-light)] hover:border-[var(--color-border)] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={profiles.includes(profile.id)}
                  onChange={(e) => {
                    setProfiles((prev) =>
                      e.target.checked
                        ? [...prev, profile.id]
                        : prev.filter((id) => id !== profile.id)
                    );
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
            ))}
          </div>

          <SaveFooter
            status={profilesSave.status}
            errorMsg={profilesSave.errorMsg}
            onSave={() =>
              profilesSave.save(() =>
                saveConfigPatch(projectId, config, { complianceProfiles: profiles })
              )
            }
          />
        </SectionCard>

        {/* ── Cookie Banner Handling ───────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Cookie Banner Handling"
            description="Automatically dismiss cookie consent banners before scanning."
          />

          <FieldRow label="Banner removal mode">
            <div className="flex gap-small">
              {(
                [
                  { value: "none", label: "None", sub: "Keep all banners" },
                  { value: "cookieyes", label: "CookieYes", sub: "Remove CookieYes banners" },
                  { value: "all", label: "All common", sub: "Remove all known banners" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBannerMode(opt.value)}
                  className={`flex-1 px-4 py-3 rounded-lg as-p2-text transition-all text-left ${
                    bannerMode === opt.value
                      ? "bg-brand text-white shadow-sm"
                      : "bg-[var(--color-bg-light)] secondary-text-color hover:bg-[var(--color-bg-light)]/70"
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="as-p3-text mt-0.5 opacity-80">{opt.sub}</div>
                </button>
              ))}
            </div>
          </FieldRow>

          <SaveFooter
            status={bannerSave.status}
            errorMsg={bannerSave.errorMsg}
            onSave={() =>
              bannerSave.save(() =>
                saveConfigPatch(projectId, config, { removeCookieBanners: bannerMode })
              )
            }
          />
        </SectionCard>

        {/* ── Cookie Injection ─────────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Cookie Injection"
            description="Inject cookies into the browser during scanning — useful for bypassing consent banners."
          />

          <p className="as-p3-text text-amber-600">
            Domain should be just the hostname, e.g. "example.com" or ".example.com" — not the full URL.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-small">
            <input
              type="text"
              placeholder="Name (e.g. cookieyes-consent)"
              value={cookieInput.name}
              onChange={(e) =>
                setCookieInput((p) => ({ ...p, name: e.target.value }))
              }
              className="input"
            />
            <input
              type="text"
              placeholder="Value (e.g. consent:yes)"
              value={cookieInput.value}
              onChange={(e) =>
                setCookieInput((p) => ({ ...p, value: e.target.value }))
              }
              className="input"
            />
            <input
              type="text"
              placeholder="Domain (e.g. example.com)"
              value={cookieInput.domain}
              onChange={(e) =>
                setCookieInput((p) => ({ ...p, domain: e.target.value }))
              }
              className="input"
            />
          </div>

          <div className="flex items-center gap-small">
            <DSButton
              size="sm"
              onClick={() => void addCookie()}
              disabled={!cookieInput.name || !cookieInput.value || cookieSave.status === "saving"}
            >
              Add cookie
            </DSButton>
            {cookieSave.status === "saved" && (
              <span className="flex items-center gap-1 as-p3-text text-[var(--color-success)]">
                <PiCheckCircle size={16} />
                Saved
              </span>
            )}
            {cookieSave.status === "error" && (
              <span className="flex items-center gap-1 as-p3-text text-[var(--color-error)]">
                <PiWarningCircle size={16} />
                {cookieSave.errorMsg || "Save failed"}
              </span>
            )}
          </div>

          {defaults.cookies.length > 0 && (
            <div className="flex flex-col gap-small">
              <h5 className="as-p2-text font-medium primary-text-color">Configured cookies</h5>
              <div className="flex flex-col gap-small">
                {defaults.cookies.map((cookie, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[var(--color-bg-light)] rounded-lg border border-[var(--color-border-light)]"
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="as-p2-text font-medium primary-text-color">
                          {cookie.name}
                        </span>
                        <span className="as-p3-text secondary-text-color">=</span>
                        <span className="as-p2-text secondary-text-color truncate max-w-[400px]">
                          {cookie.value}
                        </span>
                      </div>
                      {cookie.domain && (
                        <span className="as-p3-text secondary-text-color">
                          Domain: {cookie.domain}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeCookie(idx)}
                      className="ml-4 px-3 py-1 rounded-lg bg-red-100 text-red-600 as-p3-text hover:bg-red-200 transition-all flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Info box ─────────────────────────────────────────────────────── */}
        <div className="bg-[var(--color-info)]/10 border border-[var(--color-info)]/30 rounded-lg p-[var(--spacing-m)] flex gap-small">
          <PiInfo className="text-[var(--color-info)] flex-shrink-0 mt-0.5" size={20} />
          <div className="flex flex-col gap-1">
            <p className="as-p2-text primary-text-color font-medium">What's applied</p>
            <ul className="as-p3-text secondary-text-color list-disc list-inside flex flex-col gap-0.5">
              <li><strong>Max pages &amp; crawl delay</strong> — applied during page collection.</li>
              <li><strong>Robots.txt</strong> — enforced during page collection when enabled.</li>
              <li><strong>Compliance profiles</strong> — applied to axe-core rules during scanning.</li>
              <li><strong>Store artifacts</strong> — controls whether HTML snapshots and screenshots are saved.</li>
              <li><strong>Cookie injection &amp; banner removal</strong> — applied during page scanning.</li>
            </ul>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
