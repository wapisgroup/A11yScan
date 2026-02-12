"use client";

import { useState } from "react";
import {
  PiArrowsOutCardinal,
  PiChecks,
  PiDotsThree,
  PiFile,
  PiFolderOpen,
  PiGear,
  PiInfo,
  PiPencilSimple,
  PiPlus,
  PiTrash,
} from "react-icons/pi";

import { WorkspaceLayout } from "@/components/organism/workspace-layout";
import { PrivateRoute } from "@/utils/private-router";
import { PageContainer } from "@/components/molecule/page-container";
import { DSButton } from "@/components/atom/ds-button";
import { DSSurface } from "@/components/organism/ds-surface";
import { DSBadge } from "@/components/atom/ds-badge";
import { DSSectionHeader } from "@/components/molecule/ds-section-header";
import { DSEmptyState } from "@/components/molecule/ds-empty-state";
import { DSTable } from "@/components/organism/ds-table";
import { DSIconButton } from "@/components/atom/ds-icon-button";
import { DSTooltip } from "@/components/atom/ds-tooltip";
import { DSTabs } from "@/components/molecule/ds-tabs";
import { DSPopup } from "@/components/molecule/ds-popup";
import { DSTablePageBlock, DSSimpleTablePageBlock } from "@/components/organism/ds-page-sections";
import { DSShellContainer } from "@/components/organism/ds-shell-container";

type DemoTab = "overview" | "invoices" | "payment";
type DemoPanelTab = "report" | "preview";

export default function DesignSystemPage() {
  const [pageTabs, setPageTabs] = useState<DemoTab>("overview");
  const [panelTabs, setPanelTabs] = useState<DemoPanelTab>("report");
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <PrivateRoute>
      <WorkspaceLayout>
        <PageContainer title="Design System" description="Unified component library and layout patterns" coloredBg>
          <div className="space-y-8">
            <DSSurface tone="muted">
              <DSSectionHeader
                title="Color Direction"
                subtitle="Neutral card surfaces + rich CTA/icon accents (matching Latest Tasks / Getting Started balance)."
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="h-9 w-24 rounded-lg bg-[var(--color-bg-light)] border border-[#DCE3EE]" />
                <span className="h-9 w-24 rounded-lg bg-gradient-to-r from-[#5B5DE6] via-[#4F7DEB] to-[#2BB7D8]" />
                <span className="h-9 w-24 rounded-lg bg-[#DBEAFE]" />
                <span className="h-9 w-24 rounded-lg bg-[#EDE9FE]" />
                <span className="h-9 w-24 rounded-lg bg-[#DCFCE7]" />
              </div>
            </DSSurface>

            <DSShellContainer
              header="https://www.lloydsbank.com/"
              headerActions={
                <div className="flex items-center gap-2">
                  <DSButton variant="outline">Collect pages</DSButton>
                  <DSButton>Start full scan now</DSButton>
                </div>
              }
              metrics={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="as-p2-text primary-text-color">Pages 1</span>
                  <span className="as-p2-text primary-text-color">Scanned 1</span>
                  <DSBadge tone="danger" text="Critical 0" />
                  <DSBadge tone="warning" text="Serious 1" />
                  <DSBadge tone="info" text="Moderate 9" />
                  <DSBadge tone="neutral" text="Minor 0" />
                </div>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <DSSurface className="bg-white">
                  <DSSectionHeader title="Sitemap" />
                  <p className="mt-3 as-p2-text secondary-text-color">
                    Generate a visual sitemap to understand your website structure.
                  </p>
                </DSSurface>
                <DSSurface className="bg-white">
                  <DSSectionHeader title="Latest Tasks" />
                  <p className="mt-3 as-p2-text secondary-text-color">
                    Rich accent progress bars and neutral card body.
                  </p>
                </DSSurface>
                <DSSurface className="bg-white">
                  <DSSectionHeader title="Getting Started" />
                  <p className="mt-3 as-p2-text secondary-text-color">
                    Numbered steps with saturated icon circles.
                  </p>
                </DSSurface>
              </div>
            </DSShellContainer>

            <DSSurface>
              <DSSectionHeader title="Buttons" subtitle="Primary, secondary, ghost, destructive." />
              <div className="mt-4 flex flex-wrap gap-3">
                <DSButton variant="solid">Primary action</DSButton>
                <DSButton variant="outline">Secondary action</DSButton>
                <DSButton variant="ghost">Tertiary action</DSButton>
                <DSButton variant="danger">Delete item</DSButton>
                <DSButton variant="solid" size="sm" leadingIcon={<PiChecks />}>Small</DSButton>
                <DSButton variant="solid" size="lg" trailingIcon={<PiArrowsOutCardinal />}>Large</DSButton>
              </div>
            </DSSurface>

            <DSSurface>
              <DSSectionHeader title="Icon Buttons + Tooltip" subtitle="For row actions and compact toolbars (projects list style)." />
              <div className="mt-4 flex items-center gap-2">
                <DSIconButton label="Edit" icon={<PiPencilSimple size={16} />} variant="brand" />
                <DSIconButton label="Settings" icon={<PiGear size={16} />} variant="neutral" />
                <DSIconButton label="Delete" icon={<PiTrash size={16} />} variant="danger" />
                <DSTooltip text="More actions">
                  <span>
                    <DSIconButton label="More" icon={<PiDotsThree size={16} />} variant="neutral" showTooltip={false} />
                  </span>
                </DSTooltip>
              </div>
            </DSSurface>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DSSurface>
                <DSSectionHeader title="Tabs (Page-level)" subtitle="Billing/subscription-style top tabs." />
                <div className="mt-4">
                  <DSTabs
                    variant="page"
                    value={pageTabs}
                    onChange={setPageTabs}
                    items={[
                      { key: "overview", label: "Overview" },
                      { key: "invoices", label: "Invoices" },
                      { key: "payment", label: "Payment Methods" },
                    ]}
                  />
                </div>
              </DSSurface>

              <DSSurface>
                <DSSectionHeader title="Tabs (Inside container)" subtitle="Use for project-detail/report sections." />
                <div className="mt-4">
                  <DSTabs
                    variant="panel"
                    value={panelTabs}
                    onChange={setPanelTabs}
                    items={[
                      { key: "report", label: "Report", count: 12 },
                      { key: "preview", label: "Preview" },
                    ]}
                  />
                </div>
              </DSSurface>
            </div>

            <DSSurface>
              <DSSectionHeader title="Badges" subtitle="Normalized status + severity chips." />
              <div className="mt-4 flex flex-wrap gap-2">
                <DSBadge tone="neutral" text="Queued" />
                <DSBadge tone="info" text="Running" />
                <DSBadge tone="success" text="Completed" />
                <DSBadge tone="warning" text="Serious" />
                <DSBadge tone="danger" text="Critical" />
              </div>
            </DSSurface>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DSEmptyState
                icon={<PiFolderOpen />}
                title="Table Empty"
                description="No records yet for this filter set."
              />

              <DSEmptyState
                icon={<PiFile />}
                title="Table Empty with Action"
                description="Generate or create your first item to get started."
                action={<DSButton leadingIcon={<PiPlus />}>Add item</DSButton>}
              />
            </div>

            <DSSurface>
              <DSSectionHeader title="Popup" subtitle="Reusable centered popup/modal shell." actions={<DSButton variant="solid" onClick={() => setPopupOpen(true)}>Open popup</DSButton>} />
              <div className="mt-3 as-p2-text secondary-text-color">
                Uses same border/surface language as drawers and cards.
              </div>
            </DSSurface>

            <div className="space-y-6">
              <DSSectionHeader title="Table Patterns" subtitle="Two complete page structures based on Reports and Schedules approaches." />

              <DSTablePageBlock
                title="Pattern A: Description-heavy page (Reports style)"
                description="Use when page needs context, filters, and multi-step actions."
                topActions={
                  <div className="flex gap-2">
                    <DSButton leadingIcon={<PiPlus />}>Generate report</DSButton>
                    <DSButton variant="outline">View scans</DSButton>
                  </div>
                }
                helperCard={
                  <div className="as-p2-text secondary-text-color">
                    Rich page description / helper content goes here.
                  </div>
                }
                filters={
                  <div className="flex flex-wrap gap-2">
                    <DSButton variant="ghost" size="sm">Type: All</DSButton>
                    <DSButton variant="ghost" size="sm">Status: All</DSButton>
                    <DSButton variant="ghost" size="sm">Project: All</DSButton>
                  </div>
                }
              >
                <DSTable
                  headers={["Report", "Status", "Pages", "Generated", "Actions"]}
                  rows={[]}
                  emptyTitle="No reports generated yet"
                  emptyDescription="Generate your first report from any project."
                  emptyAction={<DSButton leadingIcon={<PiPlus />}>Generate report</DSButton>}
                />
              </DSTablePageBlock>

              <DSSimpleTablePageBlock
                title="Pattern B: Utility-first page (Schedules style)"
                subtitle="Use for operational pages with one primary action and direct table focus."
                primaryAction={<DSButton leadingIcon={<PiPlus />}>New schedule</DSButton>}
              >
                <DSTable
                  headers={["Project", "Cadence", "Start date", "Status", "Actions"]}
                  rows={[
                    [
                      <span key="p2">Marketing site</span>,
                      <span key="c2">Weekly</span>,
                      <span key="d2">2026-02-15</span>,
                      <DSBadge key="s2" tone="success" text="Active" />,
                      <div key="a2" className="flex items-center gap-1"><DSIconButton label="Edit" icon={<PiPencilSimple size={14} />} /><DSIconButton label="Delete" icon={<PiTrash size={14} />} variant="danger" /></div>,
                    ],
                    [
                      <span key="p3">Docs portal</span>,
                      <span key="c3">Monthly</span>,
                      <span key="d3">2026-03-01</span>,
                      <DSBadge key="s3" tone="info" text="Paused" />,
                      <div key="a3" className="flex items-center gap-1"><DSIconButton label="Edit" icon={<PiPencilSimple size={14} />} /><DSIconButton label="Delete" icon={<PiTrash size={14} />} variant="danger" /></div>,
                    ],
                  ]}
                />
              </DSSimpleTablePageBlock>
            </div>

            <DSSurface>
              <DSSectionHeader title="Latest Tasks / Getting Started Reference" subtitle="Preferred balance: muted surfaces, colorful progress accents, clean typography." />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-[#D6E0F0] bg-[#F3F6FB]">
                    <div className="flex items-center justify-between as-p2-text primary-text-color">
                      <span>Scan Pages</span>
                      <span className="secondary-text-color">6h ago</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#E5EAF4] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#9A55F7] via-[#5C7BEA] to-[#29B8D8] w-full" />
                    </div>
                    <div className="mt-2 as-p3-text secondary-text-color inline-flex items-center gap-1">
                      <PiChecks className="text-[#22C55E]" /> 1/1 pages · 100%
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-full bg-[#3B82F6] text-white inline-flex items-center justify-center as-p3-text">1</span>
                    <span className="as-p2-text primary-text-color">Collect pages</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-full bg-[#A855F7] text-white inline-flex items-center justify-center as-p3-text">2</span>
                    <span className="as-p2-text primary-text-color">Run accessibility scan</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-full bg-[#22C55E] text-white inline-flex items-center justify-center as-p3-text">3</span>
                    <span className="as-p2-text primary-text-color">Review results</span>
                  </div>
                </div>
              </div>
            </DSSurface>
          </div>
        </PageContainer>

        <DSPopup
          open={popupOpen}
          title="Create schedule"
          description="This is the reusable popup shell."
          onClose={() => setPopupOpen(false)}
          footer={
            <div className="flex items-center justify-end gap-2">
              <DSButton variant="outline" onClick={() => setPopupOpen(false)}>Cancel</DSButton>
              <DSButton onClick={() => setPopupOpen(false)}>Save</DSButton>
            </div>
          }
        >
          <div className="as-p2-text secondary-text-color">
            Popup body can host forms, confirmations, or info blocks.
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[#ECF4FF] text-[#1D4ED8] as-p3-text inline-flex items-center gap-2">
            <PiInfo /> Keep popup content compact and action-focused.
          </div>
        </DSPopup>
      </WorkspaceLayout>
    </PrivateRoute>
  );
}
