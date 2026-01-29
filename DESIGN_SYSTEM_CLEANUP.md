# Design System Cleanup - Remaining Work

## Text Utility Classes to Replace

Replace ALL instances of these patterns:

### Text Sizes (replace with design system classes):
- `text-xs` → `as-p3-text`
- `text-sm` → `as-p2-text`
- `text-base` → `as-p1-text`
- `text-lg` → `as-h4-text` or `as-h5-text`
- `text-xl` → `as-h3-text`
- `text-2xl` → `as-h2-text`
- `text-3xl` → `as-h1-text`

### Font Weights (remove - included in text classes):
- `font-bold` → (already in as-h*-text classes)
- `font-semibold` → (already in as-h*-text classes)
- `font-medium` → (use as-p*-text classes)
- `font-normal` → (use as-p*-text classes)

### Text Colors (replace with design system):
- `text-gray-900`, `text-slate-900` → `primary-text-color`
- `text-gray-700`, `text-slate-700` → `primary-text-color`
- `text-gray-600`, `text-slate-600` → `secondary-text-color`
- `text-gray-500`, `text-slate-500` → `secondary-text-color`
- `text-gray-400`, `text-slate-400` → `table-heading-text-color`
- `text-gray-300`, `text-slate-300` → `table-heading-text-color`

### Brand Colors:
- `text-[#649DAD]` → `brand-color`
- `bg-[#649DAD]` → `bg-brand`
- `hover:bg-[#4a7b8a]` → `hover:bg-brand-hover`
- `border-[#649DAD]` → `border-brand`

### Status Colors (use CSS variables):
- `text-red-600`, `text-red-700` → `text-[var(--color-error)]`
- `text-green-600`, `text-green-700` → `text-[var(--color-success)]`
- `text-orange-600` → `text-[var(--color-warning)]`
- `text-blue-600` → `text-[var(--color-info)]`

## Files Requiring Updates (Priority Order)

### HIGH PRIORITY (User-Facing):
1. ✅ `app/components/atom/dashboard-card.tsx`
2. ✅ `app/components/organism/dashboard-violation-overview.tsx`
3. ✅ `app/components/organism/dashboard-problem-pages.tsx`
4. ⏳ `app/components/modals/CreateReportModal.tsx` (partially done)
5. ⏳ `app/workspace/scans/page.tsx`
6. ⏳ `app/workspace/reports/page.tsx`
7. ⏳ `app/workspace/projects/page.tsx`

### MEDIUM PRIORITY:
8. `app/components/modals/ProjectModal.tsx`
9. `app/components/modals/AddPageModal.tsx`
10. `app/components/modals/project-page-set-modal.tsx`
11. `app/components/modals/UploadSitemapModal.tsx`
12. `app/components/modals/NoPagesScanModal.tsx`
13. `app/components/tabs/project-detail-tab-overview.tsx`
14. `app/components/atom/accordion.tsx`
15. `app/components/atom/separator.tsx`
16. `app/components/atom/issue-list.tsx`
17. `app/components/atom/project-info-line.tsx`
18. `app/components/providers/window-provider.tsx`

### LOW PRIORITY (Admin/Settings):
19. `app/workspace/billing/page.tsx`
20. `app/workspace/profile/page.tsx`
21. `app/workspace/sitemap/[id]/page.tsx`
22. `app/auth/register/page.tsx`

## Pattern to Follow

### Before:
```tsx
<h2 className="text-lg font-bold text-gray-900">Title</h2>
<p className="text-sm text-gray-600">Description</p>
<span className="text-xs text-gray-500">Label</span>
```

### After:
```tsx
<h2 className="as-h4-text primary-text-color">Title</h2>
<p className="as-p2-text secondary-text-color">Description</p>
<span className="as-p3-text secondary-text-color">Label</span>
```

## Automated Search & Replace Commands

Use VS Code Find & Replace (Regex mode):

1. **Find:** `text-(xs|sm|base|lg|xl|2xl|3xl)`
   **Context:** Review each match and replace appropriately

2. **Find:** `font-(bold|semibold|medium)`
   **Context:** Remove if used with heading/paragraph classes

3. **Find:** `text-gray-([0-9]{3})|text-slate-([0-9]{3})`
   **Context:** Replace with design system color classes

4. **Find:** `text-\[#649DAD\]|bg-\[#649DAD\]`
   **Replace:** `brand-color` or `bg-brand`

## Next Steps

1. Complete CreateReportModal cleanup
2. Update scans page (high traffic)
3. Update reports page
4. Update projects page
5. Continue with modals
6. Finally update admin/settings pages

## Notes

- Maintain consistent spacing (gap-small, gap-medium, gap-large)
- Use spacing variables: p-[var(--spacing-m)], py-[var(--spacing-s)]
- Never use hardcoded pixel sizes for text
- All colors should come from CSS variables or design system classes
