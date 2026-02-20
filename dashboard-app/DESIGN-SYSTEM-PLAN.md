# Dashboard App Design System Plan

## Objective

Unify the dashboard app visual language around a single component set, with the right-side drawer style as primary direction.

## New Canonical Components

Location: `app/components/ui`

- `UIButton`
- `UISurface`
- `UIBadge`
- `UIIconButton`
- `UITooltip`
- `UITabs` (`page` + `panel` variants)
- `UIPopup`
- `UISectionHeader`
- `UIEmptyState`
- `UITable`
- `UITablePageBlock` / `UTSimpleTablePageBlock`
- `UIDrawerShell`

## Preview Page

- Route: `/workspace/design-system`
- File: `app/workspace/design-system/page.tsx`

Use this page to review variants before wider migration.

## Audit Summary (current app)

Primary inconsistencies found:

1. Button variants are mixed (`Button` atom + raw `<button>` styles + page-specific classes).
2. Surface/panel styling differs across pages (`rounded-lg`, `rounded-xl`, `rounded-2xl`, different borders/shadows/backgrounds).
3. Status chips/badges are ad-hoc and repeated with different spacing/colors.
4. Drawer layouts are close in style but still duplicate structure and controls.
5. Table/list spacing and headers vary page-by-page.

## First-wave migration completed

- Added shared drawer shell and applied to:
  - `page-report-drawer.tsx`
  - `page-set-builder-drawer.tsx`
- Added design-system route and sidebar entry.
- Updated dashboard quick-actions block to use shared button/surface/header primitives.

## Suggested Next-wave migration order

1. Reports page (`/workspace/reports`) - normalize table, badges, filters, action buttons.
2. Scans page (`/workspace/scans`) - normalize status chips, cards, and empty/loading states.
3. Projects page (`/workspace/projects`) - normalize table and row actions.
4. Schedule page (`/workspace/schedules`) - normalize table rows and status pills.
5. Profile/Billing/Organisation pages - align forms and call-to-action blocks.

## Rules for future UI work

1. Default to `ui/*` primitives for all new features.
2. Avoid page-local one-off button classes unless temporary.
3. Use `UIDrawerShell` for all right-panel workflows.
4. Keep severity/status color semantics in `UIBadge` tones.
5. If a new pattern is needed, add it once to `ui/*` and expose in `/workspace/design-system` first.
