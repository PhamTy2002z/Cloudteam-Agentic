# Phase 02: Button Hierarchy Refactor

**Date**: 2026-01-04
**Priority**: High
**Status**: Pending
**Depends on**: Phase 01

## Context

- Plan: [plan.md](./plan.md)
- Phase 01: [phase-01-color-tokens.md](./phase-01-color-tokens.md)
- Button component: `apps/frontend/components/ui/button.tsx`

## Overview

Refactor button variants để phân biệt rõ primary (cam) vs secondary (trắng) vs success (xanh lá).

## Key Insights

Từ screenshots, các buttons hiện dùng cam:

| Screen | Button | Current | Proposed |
|--------|--------|---------|----------|
| Projects | "+ New Project" | Coral filled | **Keep coral** (primary CTA) |
| Projects | "Open" | Coral filled | **White outline** (secondary) |
| Projects | Settings icon | Coral hover | **Gray hover** (neutral) |
| Project Detail | "+ Settings" | Coral filled | **White outline** (secondary) |
| Project Detail | "Sync from GitHub" | Coral filled | **Green filled** (success action) |
| Editor | "Editing" badge | Coral | **Keep coral** (status) |
| Editor | "Save" | Coral outline | **Coral filled** (primary when dirty) |
| Editor | "Push" | Coral outline | **Green filled** (success action) |

## Requirements

### Button Variant Updates

```tsx
// Current variants
variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"

// Add new variants
variant: "success" | "neutral"
```

### New Variant Definitions

```css
/* Success variant - Green */
.btn-success {
  background: hsl(var(--success));
  color: white;
}
.btn-success:hover {
  background: hsl(142 71% 40%); /* Darker green */
}

/* Neutral variant - White outline */
.btn-neutral {
  background: transparent;
  border: 1px solid hsl(var(--neutral));
  color: hsl(var(--neutral));
}
.btn-neutral:hover {
  background: hsl(var(--neutral) / 0.1);
}
```

## Architecture

### Component Mapping

| Component | File | Changes |
|-----------|------|---------|
| Button | `components/ui/button.tsx` | Add `success`, `neutral` variants |
| ProjectCard | `components/project-card.tsx` | "Open" → neutral variant |
| Header | `components/header.tsx` | "Sync" → success variant |
| EditorToolbar | `app/editor/` | "Push" → success variant |

## Implementation Steps

- [ ] Add `success` variant to button.tsx
- [ ] Add `neutral` variant to button.tsx
- [ ] Update ProjectCard "Open" button → `variant="neutral"`
- [ ] Update "Sync from GitHub" → `variant="success"`
- [ ] Update "Push" button → `variant="success"`
- [ ] Update Settings buttons → `variant="neutral"`
- [ ] Keep "New Project", "Save" as `variant="default"` (coral)

## Code Changes

### button.tsx variant additions

```tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // Existing...
        default: "bg-primary text-primary-foreground hover:bg-primary/90",

        // NEW variants
        success:
          "bg-success text-white hover:bg-success/90 " +
          "focus-visible:ring-success",
        neutral:
          "border border-neutral text-neutral bg-transparent " +
          "hover:bg-neutral/10 focus-visible:ring-neutral",
      },
    },
  }
)
```

## Visual Comparison

### Before (All Coral)
```
[+ New Project]  [Open]  [Settings]  [Sync from GitHub]
     coral        coral    coral          coral
```

### After (Semantic Colors)
```
[+ New Project]  [Open]  [Settings]  [Sync from GitHub]
     coral       white     gray          green
   (primary)  (secondary) (neutral)    (success)
```

## Success Criteria

- [ ] Primary CTA buttons remain coral
- [ ] Secondary actions use white/neutral
- [ ] Success actions (Sync, Push) use green
- [ ] Visual hierarchy clear at first glance
- [ ] No accessibility regressions (contrast ratios)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| User confusion | Medium | Gradual rollout, consistent patterns |
| Contrast issues | High | Test all variants against dark bg |

## Next Steps

→ Phase 03: Component Updates
