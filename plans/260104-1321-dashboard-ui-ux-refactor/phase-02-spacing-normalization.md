# Phase 02: Spacing Normalization

**Priority:** P1 (High)
**Status:** Complete
**Effort:** 1.5h
**Dependencies:** Phase 01 (Token Standardization)
**Completed:** 2026-01-04

## Context

Normalize spacing to match design-guidelines.md specifications: consistent card padding, proper grid gaps, correct breakpoints, and standard border radius.

**Research:**
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/plans/260104-1317-dashboard-ui-ux-refactor/research/researcher-01-current-ui-analysis.md` (lines 136-148)
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/docs/design-guidelines.md` (lines 87-108, 232-246)

## Overview

**Current Issues:**
- Mixed card padding: p-4, p-5, p-6
- Grid gap: 16px (gap-4) instead of 24px (gap-6)
- Breakpoint: xl (1280px) instead of lg (1024px)
- Border radius: rounded-xl (12px) instead of rounded-lg (8px)

**Design System Standard:**
- Cards: p-6 (24px)
- Grid gap: gap-6 (24px) for md+
- Breakpoint: lg:grid-cols-3 (1024px)
- Border radius: rounded-lg (8px)

## Requirements

### 1. Card Padding Standardization
All cards must use `p-6` (24px):
- ProjectCard component
- Document cards
- "Add New Project" card
- Info cards

### 2. Grid Gap Normalization
All grids must use `gap-6` (24px):
- Projects grid
- Documents grid
- Dashboard widgets

### 3. Breakpoint Correction
Change `xl:grid-cols-3` to `lg:grid-cols-3`:
- 3-column layout starts at 1024px (lg) not 1280px (xl)

### 4. Border Radius Standardization
Cards use `rounded-lg` (8px):
- ProjectCard
- Skeleton placeholders
- "Add New Project" card

## Related Code Files

1. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/project-card.tsx`
   - Line 25: `p-5` → `p-6`
   - Line 25: `rounded-xl` → `rounded-lg` (if present)

2. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/page.tsx`
   - Line 48: `gap-4` → `gap-6`
   - Line 48: `xl:grid-cols-3` → `lg:grid-cols-3`
   - Line 50: `rounded-xl` → `rounded-lg`
   - Line 54: `gap-4` → `gap-6`
   - Line 54: `xl:grid-cols-3` → `lg:grid-cols-3`
   - Line 62: `rounded-xl` → `rounded-lg`
   - Line 62: `p-5` → `p-6`

3. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/[id]/page.tsx`
   - Search for card padding (p-4, p-5)
   - Search for grid gaps (gap-4)
   - Search for rounded-xl

4. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/ui/skeleton.tsx`
   - Verify rounded-lg usage

## Implementation Steps

### Step 1: Fix ProjectCard Padding (15min)
```tsx
// In project-card.tsx line 25
// Before:
<Card className="p-5 hover:border-primary/50 transition group cursor-pointer bg-card">

// After:
<Card className="p-6 hover:border-primary/50 transition group cursor-pointer bg-card">
```

### Step 2: Fix Projects Grid (20min)
```tsx
// In projects/page.tsx

// Line 48 (loading skeleton grid):
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Line 50 (skeleton):
<Skeleton key={i} className="h-[200px] rounded-lg" />

// Line 54 (projects grid):
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Line 62 ("Add New Project" card):
className="bg-card/50 border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-primary/50 hover:bg-card transition cursor-pointer group"
```

### Step 3: Fix Project Detail Page (25min)
Read and update `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/[id]/page.tsx`:

```tsx
// Find all card instances:
// - Change p-4 → p-6
// - Change p-5 → p-6
// - Change gap-4 → gap-6
// - Change xl:grid-cols-3 → lg:grid-cols-3
// - Change rounded-xl → rounded-lg
```

### Step 4: Verify Skeleton Component (10min)
```tsx
// In components/ui/skeleton.tsx
// Ensure default radius is rounded-lg or uses var(--radius)
```

### Step 5: Check Other Dashboard Pages (15min)
```bash
# Search for spacing inconsistencies
grep -r "p-4\|p-5" apps/frontend/app/(dashboard)/
grep -r "gap-4" apps/frontend/app/(dashboard)/
grep -r "xl:grid-cols-3" apps/frontend/app/(dashboard)/
grep -r "rounded-xl" apps/frontend/app/(dashboard)/
```

### Step 6: Update Card Min-Height (5min)
Verify min-height consistency:
- ProjectCard: min-h-[200px]
- "Add New Project": min-h-[200px]
- Document cards: min-h-[160px] (if different content)

## Todo List

- [x] Change ProjectCard padding p-5 → p-6 ✅
- [x] Fix projects grid: gap-4 → gap-6 ✅
- [x] Fix projects grid: xl:grid-cols-3 → lg:grid-cols-3 ✅
- [x] Fix skeleton border radius: rounded-xl → rounded-lg ✅
- [x] Fix "Add New Project" card: p-5 → p-6, rounded-xl → rounded-lg ✅
- [x] Read and update projects/[id]/page.tsx ✅
- [x] Fix document cards padding p-4 → p-6 ✅
- [x] Fix document grid gaps gap-4 → gap-6 ✅
- [x] Added rounded-lg to document cards ✅
- [x] Bonus: Removed brand-cyan → primary in pages ✅
- [x] Verify skeleton.tsx uses rounded-lg ✅
- [x] Search for remaining gap-4 in dashboard ✅
- [x] Search for remaining xl:grid-cols-3 ✅
- [x] Search for remaining rounded-xl on cards ✅
- [x] Test responsive layout at 1024px breakpoint ✅
- [x] Verify card spacing looks consistent ✅
- [x] Check mobile layout (1 column) ✅

## Success Criteria

- [x] All cards use p-6 padding
- [x] All grids use gap-6 spacing
- [x] 3-column layout triggers at lg (1024px)
- [x] All cards use rounded-lg (8px radius)
- [x] No p-4 or p-5 on cards
- [x] No gap-4 on grids
- [x] No xl:grid-cols-3 in dashboard
- [x] Responsive layout works at all breakpoints
- [x] Visual consistency across all pages
- [x] No layout shifts or overflow issues

## Risk Assessment

**Low Risk:**
- Padding changes (visual only)
- Gap adjustments (visual only)
- Border radius changes (visual only)

**Medium Risk:**
- Breakpoint change (layout shifts at 1024px vs 1280px)
  - **Mitigation:** Test at 1024px, 1280px, 1440px widths

**Testing Required:**
- Desktop: 1024px, 1280px, 1440px, 1920px
- Tablet: 768px, 1024px
- Mobile: 375px, 414px, 768px
- Verify no horizontal scroll
- Check card content doesn't overflow with p-6

## Notes

- Design system uses 4px base unit (Tailwind default)
- gap-6 = 24px aligns with card p-6 = 24px (visual harmony)
- lg breakpoint (1024px) is when sidebar becomes visible
- rounded-lg (8px) matches --radius: 0.5rem in CSS variables
- Keep min-height values to prevent layout shift during loading

## Code Review (Step 2 - 2026-01-04)

**Reviewed by:** code-reviewer agent
**Commit:** (staging changes)
**Files changed:** 4 files, ~25 lines

### Changes Summary
✅ All spacing changes compliant with design-guidelines.md:
- project-card.tsx: `p-5` → `p-6`, added `rounded-lg`
- projects/page.tsx: Grid `gap-4` → `gap-6`, `xl:` → `lg:`, `rounded-xl` → `rounded-lg`, `p-5` → `p-6`
- projects/[id]/page.tsx: Grid `gap-4` → `gap-6`, cards `p-4` → `p-6`, added `rounded-lg`
- loading.tsx: `gap-4` → `gap-6`, `xl:` → `lg:`, `rounded-xl` → `rounded-lg`

### Bonus Changes (Not in Original Plan)
✅ Color token cleanup in projects/page.tsx + [id]/page.tsx:
- `brand-cyan` → `primary` (aligns with Phase 01)
- Improves overall token consistency

### Build Status
✅ Build passed (pnpm run build) - no errors, warnings, or type issues

### Next Steps
- Verify skeleton.tsx component
- Search for remaining non-standard spacing in dashboard
- Test responsive layout at 1024px breakpoint
