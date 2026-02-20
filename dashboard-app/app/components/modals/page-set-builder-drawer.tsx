"use client";

/**
 * Page Set Builder Drawer
 * Shared component in modals/page-set-builder-drawer.tsx.
 */

import { useEffect, useMemo, useState } from "react";
import { PiPlus, PiTrash, PiInfo } from "react-icons/pi";

import type { PageSetRule } from "@/types/page-types-set";
import { resolvePageSetPages, type ResolvablePage } from "@/services/pageSetResolver";
import { DSDrawerShell } from "@/components/organism/ds-drawer-shell";
import { DSButton } from "@/components/atom/ds-button";
import { DSBadge } from "@/components/atom/ds-badge";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: {
    id?: string;
    name?: string;
    rules?: PageSetRule[];
  } | null;
  pages: ResolvablePage[];
  onClose: () => void;
  onSave: (payload: { name: string; rules: PageSetRule[]; resolvedPageIds: string[] }) => void | Promise<void>;
};

function makeRule(): PageSetRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    mode: "include",
    matcher: "contains",
    value: ""
  };
}

export default function PageSetBuilderDrawer({ open, mode, initial, pages, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [rules, setRules] = useState<PageSetRule[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setRules(Array.isArray(initial?.rules) && initial?.rules.length ? initial!.rules!.map((r) => ({ ...r })) : []);
  }, [open, initial?.name, initial?.rules]);

  const resolvedPages = useMemo(
    () => resolvePageSetPages(pages, { rules, filterText: "", regex: "", pageIds: [], name, owner: null, created: null }),
    [pages, rules, name]
  );

  const validRules = useMemo(
    () => rules.filter((r) => String(r.value || "").trim().length > 0),
    [rules]
  );

  if (!open) return null;

  return (
    <DSDrawerShell
      open={open}
      subtitle="Page Set Builder"
      title={mode === "create" ? "Create page set" : "Edit page set"}
      widthClassName="w-[76vw] min-w-[980px]"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <DSButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </DSButton>
          <DSButton
            type="button"
            disabled={!name.trim() || validRules.length === 0 || saving}
            onClick={async () => {
              try {
                setSaving(true);
                await onSave({
                  name: name.trim(),
                  rules: validRules,
                  resolvedPageIds: resolvedPages.map((p) => p.id)
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : mode === "create" ? "Create set" : "Save changes"}
          </DSButton>
        </div>
      }
    >
      <div className="flex-1 grid grid-cols-2 overflow-hidden">
        <div className="border-r border-[var(--color-border-light)] p-6 overflow-y-auto">
          <div className="space-y-4">

            {/* Onboarding callout — only shown in create mode with no rules yet */}
            {mode === "create" && rules.length === 0 && (
              <div className="flex gap-3 p-4 rounded-lg bg-[var(--color-info)]/10 border border-[var(--color-info)]/30">
                <PiInfo size={20} className="text-[var(--color-info)] flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <p className="as-p2-text primary-text-color font-medium">What is a page set?</p>
                  <p className="as-p3-text secondary-text-color">
                    A page set is a named group of pages from your project. Use rules to include or exclude pages by URL pattern — for example, group all <code className="font-mono">/blog/</code> pages together.
                  </p>
                  <p className="as-p3-text secondary-text-color mt-1">
                    Once created, you can run a scan on the whole set and generate a single accessibility report for those pages.
                  </p>
                  <ol className="as-p3-text secondary-text-color list-decimal list-inside mt-2 flex flex-col gap-0.5">
                    <li>Give your set a name below</li>
                    <li>Click <strong>Add rule</strong> and enter a URL pattern to match</li>
                    <li>Check the preview on the right to see which pages match</li>
                    <li>Click <strong>Create set</strong> when ready</li>
                  </ol>
                </div>
              </div>
            )}

            <div>
              <label className="block as-p3-text secondary-text-color mb-1">Set name</label>
              <input
                className="input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. News pages"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h3 className="as-p2-text primary-text-color font-medium">Rules</h3>
                <p className="as-p3-text secondary-text-color">Include or exclude pages by URL pattern.</p>
              </div>
              <DSButton
                type="button"
                variant="solid"
                size="sm"
                leadingIcon={<PiPlus size={14} />}
                onClick={() => setRules((prev) => [...prev, makeRule()])}
              >
                Add rule
              </DSButton>
            </div>

            {rules.length === 0 ? (
              <div className="p-4 rounded-md border-2 border-dashed border-[var(--color-border-light)] as-p3-text secondary-text-color text-center">
                No rules yet — click <strong>Add rule</strong> to start building your set.
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3 border border-[var(--color-border-light)] rounded-lg">
                    <div className="grid grid-cols-12 gap-2">
                      <select
                        className="col-span-3 input"
                        value={rule.mode}
                        onChange={(e) =>
                          setRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, mode: e.target.value as PageSetRule["mode"] } : r))
                          )
                        }
                      >
                        <option value="include">Include</option>
                        <option value="exclude">Exclude</option>
                      </select>

                      <select
                        className="col-span-3 input"
                        value={rule.matcher}
                        onChange={(e) =>
                          setRules((prev) =>
                            prev.map((r) => (r.id === rule.id ? { ...r, matcher: e.target.value as PageSetRule["matcher"], value: "" } : r))
                          )
                        }
                      >
                        <option value="contains">URL contains</option>
                        <option value="wildcard">URL wildcard</option>
                        <option value="regex">URL regex</option>
                        <option value="page">Specific page</option>
                      </select>

                      {rule.matcher === "page" ? (
                        <select
                          className="col-span-5 input"
                          value={rule.value}
                          onChange={(e) =>
                            setRules((prev) =>
                              prev.map((r) => (r.id === rule.id ? { ...r, value: e.target.value } : r))
                            )
                          }
                        >
                          <option value="">Select page</option>
                          {pages.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.url || p.id}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="col-span-5 input"
                          value={rule.value}
                          onChange={(e) =>
                            setRules((prev) =>
                              prev.map((r) => (r.id === rule.id ? { ...r, value: e.target.value } : r))
                            )
                          }
                          placeholder={
                            rule.matcher === "contains"
                              ? "/news/"
                              : rule.matcher === "wildcard"
                                ? "/news/***"
                                : "^https?://.*/news/.*$"
                          }
                        />
                      )}

                      <button
                        type="button"
                        className="col-span-1 inline-flex items-center justify-center rounded-md border border-[var(--color-border-medium)] hover:bg-[var(--color-bg-light)]"
                        onClick={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                      >
                        <PiTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto bg-[var(--color-bg-light)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="as-p2-text primary-text-color font-medium">Matching pages</h3>
            <DSBadge tone="neutral" text={`${resolvedPages.length} pages`} />
          </div>
          {resolvedPages.length === 0 ? (
            <div className="p-4 bg-white rounded-md border border-[var(--color-border-light)] as-p3-text secondary-text-color flex flex-col gap-1">
              <p className="font-medium primary-text-color">No pages matched yet</p>
              <p>Add an <strong>Include</strong> rule on the left with a URL pattern to see matching pages appear here.</p>
              <p className="mt-1">Example: include pages where URL <em>contains</em> <code className="font-mono">/blog/</code></p>
            </div>
          ) : (
            <div className="space-y-2">
              {resolvedPages.map((p) => (
                <div key={p.id} className="p-2 bg-white border border-[var(--color-border-light)] rounded-md">
                  <div className="as-p3-text primary-text-color truncate" title={String(p.url || p.id)}>
                    {p.url || p.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DSDrawerShell>
  );
}
