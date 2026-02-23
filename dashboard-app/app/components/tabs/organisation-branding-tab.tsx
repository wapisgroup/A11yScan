"use client";
/**
 * Organisation Branding Tab
 * Shared component in tabs/organisation-branding-tab.tsx.
 */

import { useRef, useState } from "react";
import { PiCheckCircle, PiWarningCircle, PiImage } from "react-icons/pi";
import { DSButton } from "@/components/atom/ds-button";

type BrandingTabProps = {
  customLogo: string;
  setCustomLogo: (logo: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
};

const PRESET_COLORS = [
  "#1a56db", "#0ea5e9", "#7c3aed", "#db2777",
  "#16a34a", "#ea580c", "#0f172a", "#64748b",
];

function isValidHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (color: string) => void;
};

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hex, setHex] = useState(value);
  const nativeRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    if (isValidHex(raw)) onChange(raw);
  };

  // Keep local hex in sync when parent resets
  if (hex !== value && isValidHex(value)) {
    setHex(value);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="as-p2-text primary-text-color font-medium">{label}</label>

      {/* Swatch row */}
      <div className="flex items-center gap-3">
        {/* Clickable color swatch — opens native picker */}
        <button
          type="button"
          aria-label={`Pick ${label}`}
          onClick={() => nativeRef.current?.click()}
          className="w-10 h-10 rounded-lg border-2 border-[var(--color-border-light)] shadow-sm flex-shrink-0 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand"
          style={{ backgroundColor: isValidHex(hex) ? hex : "#ffffff" }}
        />
        {/* Hidden native color input */}
        <input
          ref={nativeRef}
          type="color"
          value={isValidHex(hex) ? hex : "#000000"}
          onChange={(e) => { setHex(e.target.value); onChange(e.target.value); }}
          className="sr-only"
          tabIndex={-1}
        />

        {/* Hex text field */}
        <input
          type="text"
          maxLength={7}
          placeholder="#000000"
          value={hex}
          onChange={(e) => {
            const v = e.target.value;
            setHex(v);
            if (isValidHex(v)) onChange(v);
          }}
          onBlur={() => { if (!isValidHex(hex)) setHex(value); }}
          className="input w-32 font-mono"
        />
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2 mt-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => { setHex(c); commit(c); }}
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand ${
              value === c ? "border-brand scale-110" : "border-[var(--color-border-light)]"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Preview bar */}
      <div
        className="h-8 rounded-lg border border-[var(--color-border-light)] shadow-inner mt-1"
        style={{ backgroundColor: isValidHex(hex) ? hex : "transparent" }}
      />
    </div>
  );
}

export function BrandingTab({
  customLogo,
  setCustomLogo,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  saving,
  onSave,
}: BrandingTabProps) {
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoOk, setLogoOk] = useState(false);

  const handleLogoChange = (value: string) => {
    setCustomLogo(value);
    setLogoOk(false);
    if (!value) { setLogoError(null); return; }
    if (!isValidUrl(value)) {
      setLogoError("Logo URL must start with https://");
    } else {
      setLogoError(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border-light)] p-6">
      <form onSubmit={onSave} className="space-y-8">
        <div>
          <h2 className="as-h4-text primary-text-color mb-1">Branding Settings</h2>
          <p className="as-p2-text secondary-text-color">
            Customize the logo and colors used in your PDF reports.
          </p>
        </div>

        {/* Logo URL */}
        <div className="flex flex-col gap-2">
          <label className="as-p2-text primary-text-color font-medium">Custom Logo URL</label>
          <div className="relative">
            <input
              type="url"
              className={`input w-full pr-9 ${logoError ? "border-[var(--color-error)]" : ""}`}
              placeholder="https://example.com/logo.png"
              value={customLogo}
              onChange={(e) => handleLogoChange(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {logoError && <PiWarningCircle size={16} className="text-[var(--color-error)]" />}
              {!logoError && logoOk && <PiCheckCircle size={16} className="text-[var(--color-success)]" />}
            </span>
          </div>
          {logoError && (
            <p className="as-p3-text text-[var(--color-error)]">{logoError}</p>
          )}
          <p className="as-p3-text secondary-text-color">Must be a publicly accessible https:// URL pointing to a PNG, JPG, or SVG image.</p>

          {/* Logo preview */}
          {customLogo && !logoError && (
            <div className="p-4 bg-[var(--color-bg-light)] rounded-lg border border-[var(--color-border-light)] inline-flex items-center gap-3 mt-1">
              <PiImage size={20} className="secondary-text-color flex-shrink-0" />
              <img
                src={customLogo}
                alt="Logo preview"
                className="max-h-14 max-w-[200px] object-contain"
                onLoad={() => { setLogoOk(true); setLogoError(null); }}
                onError={() => { setLogoOk(false); setLogoError("Could not load image from this URL."); }}
              />
            </div>
          )}
        </div>

        {/* Color pickers */}
        <div className="border-t border-[var(--color-border-light)] pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ColorPicker
            label="Primary Color"
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorPicker
            label="Secondary Color"
            value={secondaryColor}
            onChange={setSecondaryColor}
          />
        </div>

        <div className="pt-2 border-t border-[var(--color-border-light)]">
          <DSButton
            type="submit"
            disabled={saving || !!logoError}
          >
            {saving ? "Saving…" : "Save Branding Settings"}
          </DSButton>
        </div>
      </form>
    </div>
  );
}
