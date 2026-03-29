"use client";

/**
 * Page Set Builder Drawer
 * Shared component in modals/page-set-builder-drawer.tsx.
 */

import { useEffect, useMemo, useState } from "react";
import { PiPlus, PiTrash } from "react-icons/pi";

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
              <h3 className="as-p2-text primary-text-color font-medium">Rules</h3>
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
              <div className="p-3 rounded-md bg-[var(--color-bg-light)] as-p3-text secondary-text-color">
                No rules yet. Add include/exclude rules to build this set.
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
            <div className="p-3 bg-white rounded-md border border-[var(--color-border-light)] as-p3-text secondary-text-color">
              No pages matched. Add include rules first, then optionally exclude rules.
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
