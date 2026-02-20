"use client";

/**
 * ProjectModal
 * Shared component in modals/ProjectModal.tsx.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/services/projectsService";
import { validateUrl } from "@/services/projectsService";
import { Popup } from "../molecule/popup";
import { UIButton } from "@/components/ui/ui-button";
import { PiCheckCircle, PiWarningCircle, PiSpinner, PiCaretDown, PiCaretUp } from "react-icons/pi";

type Mode = "create" | "edit";

type ProjectConfig = {
  maxPages?: number;
  crawlDelayMs?: number;
  robotsRespect?: boolean;
  storeArtifacts?: boolean;
  complianceProfiles?: string[];
};

export type ProjectSubmitValues = {
  name: string;
  domain: string;
  config?: ProjectConfig;
};

type Props = {
  mode: Mode;
  open: boolean;
  initial?: Partial<Project> | null;
  onClose: () => void;
  onSubmit: (values: ProjectSubmitValues) => Promise<void> | void;
};

type DomainStatus = "idle" | "checking" | "live" | "unreachable" | "invalid";

const COMPLIANCE_PROFILES = [
  { id: "ada_title_ii_wcag21",  label: "ADA Title II",    sub: "WCAG 2.1 A/AA" },
  { id: "section_508_wcag20",   label: "Section 508",      sub: "WCAG 2.0 A/AA" },
  { id: "en_301_549_web",       label: "EN 301 549",       sub: "WCAG 2.1 A/AA" },
  { id: "wcag22",               label: "WCAG 2.2",         sub: "Level A/AA" },
];

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

export default function ProjectModal({ mode, open, initial, onClose, onSubmit }: Props) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [domain, setDomain] = useState(initial?.domain ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // domain live-check state (create mode only)
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("idle");

  // advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxPages, setMaxPages] = useState(1000);
  const [crawlDelayMs, setCrawlDelayMs] = useState(100);
  const [robotsRespect, setRobotsRespect] = useState(true);
  const [storeArtifacts, setStoreArtifacts] = useState(true);
  const [complianceProfiles, setComplianceProfiles] = useState<string[]>(["ada_title_ii_wcag21"]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setName(initial?.name ?? "");
    setDomain(initial?.domain ?? "");
    setError("");
    setDomainStatus("idle");
    setShowAdvanced(false);
    setMaxPages(1000);
    setCrawlDelayMs(100);
    setRobotsRespect(true);
    setStoreArtifacts(true);
    setComplianceProfiles(["ada_title_ii_wcag21"]);
  }, [initial?.name, initial?.domain, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset domain status when URL changes
  useEffect(() => {
    setDomainStatus("idle");
    setError("");
  }, [domain]);

  const checkDomain = async (): Promise<boolean> => {
    const normalized = normalizeUrl(domain);
    if (!validateUrl(normalized)) {
      setDomainStatus("invalid");
      setError("Please enter a valid URL (e.g. https://example.com)");
      return false;
    }

    setDomainStatus("checking");
    setError("");
    try {
      const res = await fetch(`/api/check-domain?url=${encodeURIComponent(normalized)}`);
      const data = await res.json() as { live: boolean };
      setDomainStatus(data.live ? "live" : "unreachable");
      return true; // allow proceed even if unreachable (server might block HEAD)
    } catch {
      setDomainStatus("unreachable");
      return true;
    }
  };

  const isEditMode = mode === "edit";

  const handleSubmit = async () => {
    setError("");

    if (isEditMode) {
      if (!name.trim()) { setError("Project name cannot be empty"); return; }
      setSubmitting(true);
      try {
        await onSubmit({ name, domain });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // create mode — validate URL format
    if (!domain.trim()) { setError("URL is required"); return; }
    const normalized = normalizeUrl(domain);
    if (!validateUrl(normalized)) {
      setDomainStatus("invalid");
      setError("Please enter a valid URL (e.g. https://example.com)");
      return;
    }

    setSubmitting(true);
    // live check (non-blocking for form submission — we warn but allow)
    await checkDomain();

    try {
      await onSubmit({
        name,
        domain: normalized,
        config: {
          maxPages,
          crawlDelayMs,
          robotsRespect,
          storeArtifacts,
          complianceProfiles,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProfile = (id: string) => {
    setComplianceProfiles((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const domainStatusIcon = () => {
    if (mode === "edit") return null;
    switch (domainStatus) {
      case "checking":
        return <PiSpinner size={16} className="animate-spin secondary-text-color" />;
      case "live":
        return <PiCheckCircle size={16} className="text-[var(--color-success)]" />;
      case "unreachable":
        return <PiWarningCircle size={16} className="text-[var(--color-warning)]" />;
      case "invalid":
        return <PiWarningCircle size={16} className="text-[var(--color-error)]" />;
      default:
        return null;
    }
  };

  const body = open ? (
    <Popup
      title={isEditMode ? "Edit project" : "New project"}
      onClose={onClose}
      size="md"
    >
      <p className="as-p2-text secondary-text-color">
        {isEditMode
          ? "Edit the project name. The URL cannot be changed after creation."
          : "Enter a URL to scan. The name will be auto-generated if left empty."}
      </p>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border as-p2-text"
          style={{ backgroundColor: "var(--color-error-light)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <PiWarningCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="as-p2-text primary-text-color">
          Name {!isEditMode && <span className="secondary-text-color">(optional)</span>}
        </label>
        <input
          className="w-full input"
          placeholder={isEditMode ? "Project name" : "Auto-generated from URL"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={isEditMode}
        />
      </div>

      {/* URL */}
      <div className="flex flex-col gap-1">
        <label className="as-p2-text primary-text-color">
          URL {isEditMode && <span className="secondary-text-color">(locked)</span>}
        </label>
        <div className="relative">
          <input
            className="w-full input pr-8"
            placeholder="https://example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onBlur={() => {
              if (!isEditMode && domain.trim()) void checkDomain();
            }}
            disabled={isEditMode}
            autoFocus={!isEditMode}
          />
          {!isEditMode && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {domainStatusIcon()}
            </span>
          )}
        </div>
        {!isEditMode && domainStatus === "unreachable" && (
          <p className="as-p3-text text-[var(--color-warning)]">
            Domain appears unreachable — you can still create the project.
          </p>
        )}
        {!isEditMode && domainStatus === "live" && (
          <p className="as-p3-text text-[var(--color-success)]">Domain is live.</p>
        )}
      </div>

      {/* Advanced options (create mode only) */}
      {!isEditMode && (
        <div className="border border-[var(--color-border-light)] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 as-p2-text primary-text-color hover:bg-[var(--color-bg-light)] transition-colors"
          >
            <span className="font-medium">Advanced options</span>
            {showAdvanced ? <PiCaretUp size={16} /> : <PiCaretDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 flex flex-col gap-[var(--spacing-m)] border-t border-[var(--color-border-light)]">

              {/* Compliance Profiles */}
              <div className="flex flex-col gap-2 pt-3">
                <p className="as-b2-text primary-text-color">Compliance Profiles</p>
                <p className="as-p3-text secondary-text-color">Select standards used in reports and issue summaries.</p>
                <div className="flex flex-col gap-1.5">
                  {COMPLIANCE_PROFILES.map((p) => (
                    <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={complianceProfiles.includes(p.id)}
                        onChange={() => toggleProfile(p.id)}
                        className="accent-[var(--color-primary)] w-4 h-4"
                      />
                      <span className="as-p2-text primary-text-color">{p.label}</span>
                      <span className="as-p3-text secondary-text-color">— {p.sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Crawling Settings */}
              <div className="flex flex-col gap-2">
                <p className="as-b2-text primary-text-color">Crawling Settings</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="as-p3-text secondary-text-color">Max pages</label>
                    <input
                      type="number"
                      min={1}
                      value={maxPages}
                      onChange={(e) => setMaxPages(Number(e.target.value))}
                      className="input w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="as-p3-text secondary-text-color">Crawl delay (ms)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={crawlDelayMs}
                      onChange={(e) => setCrawlDelayMs(Number(e.target.value))}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Behavior Settings */}
              <div className="flex flex-col gap-2">
                <p className="as-b2-text primary-text-color">Behavior Settings</p>
                <div className="flex flex-col gap-2">
                  {([
                    { key: "robotsRespect" as const, label: "Respect robots.txt", value: robotsRespect, set: setRobotsRespect },
                    { key: "storeArtifacts" as const, label: "Store screenshots & HTML snapshots", value: storeArtifacts, set: setStoreArtifacts },
                  ]).map(({ key, label, value, set }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="as-p2-text primary-text-color">{label}</span>
                      <div className="flex gap-1">
                        {(["On", "Off"] as const).map((opt) => {
                          const isOn = opt === "On";
                          const active = value === isOn;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => set(isOn)}
                              className={`px-3 py-1 rounded-lg as-p3-text transition-colors ${
                                active
                                  ? "bg-[var(--color-primary)] text-white"
                                  : "bg-[var(--color-bg-light)] secondary-text-color hover:bg-[var(--color-border-light)]"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2">
        <UIButton variant="outline" onClick={onClose} disabled={submitting}>Cancel</UIButton>
        <UIButton onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting
            ? (isEditMode ? "Saving…" : "Creating…")
            : (isEditMode ? "Save" : "Create project")}
        </UIButton>
      </div>
    </Popup>
  ) : null;

  if (!mounted) return null;
  return createPortal(body, document.body);
}
