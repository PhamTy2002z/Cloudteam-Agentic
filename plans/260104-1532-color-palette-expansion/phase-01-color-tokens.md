# Phase 01: Color Token Definition

**Date**: 2026-01-04
**Priority**: High
**Status**: Pending

## Context

- Plan: [plan.md](./plan.md)
- Design Guidelines: [docs/design-guidelines.md](../../docs/design-guidelines.md)
- CSS Variables: `apps/frontend/app/globals.css`

## Overview

Định nghĩa color tokens mới cho white và green, mở rộng semantic color system.

## Key Insights

1. Hiện tại cam `#D97755` được dùng cho MỌI interactive elements
2. Xanh lá `#22C55E` chỉ dùng cho "Unlocked" badge
3. Thiếu neutral/white variant cho secondary actions
4. Cần semantic separation: primary vs secondary vs success

## Requirements

### New Color Tokens

```css
/* White/Neutral variants */
--neutral: 0 0% 95%;           /* #F2F2F2 - white text color */
--neutral-foreground: 0 0% 10%; /* #1A1A1A - dark text on white */

/* Green/Success expansion */
--success: 142 71% 45%;         /* #22C55E - existing */
--success-foreground: 142 71% 95%; /* Light green text */
--success-muted: 142 71% 45% / 0.15; /* Subtle green bg */

/* Button semantic colors */
--btn-primary: 18 65% 59%;      /* #D97755 - cam, CHỈ cho primary CTA */
--btn-secondary: 0 0% 95%;      /* White outline buttons */
--btn-success: 142 71% 45%;     /* Green for positive actions */
```

### Color Usage Matrix

| Semantic | Color | Hex | Use Cases |
|----------|-------|-----|-----------|
| Primary CTA | Coral | `#D97755` | "New Project", "Save" (khi có changes) |
| Secondary | White | `#F2F2F2` | "Open", "Settings", "Sync", outline buttons |
| Success | Green | `#22C55E` | "Unlocked", "Push" (success), confirmations |
| Neutral | Gray | `#999999` | Disabled, muted actions |
| Destructive | Red | `#EF4444` | "Danger Zone", delete actions |

## Architecture

### File Changes

1. `apps/frontend/app/globals.css` - Add new CSS variables
2. `apps/frontend/tailwind.config.ts` - Extend theme colors
3. `docs/design-guidelines.md` - Update color documentation

## Implementation Steps

- [ ] Add `--neutral`, `--neutral-foreground` tokens to globals.css
- [ ] Add `--success-muted` token for subtle backgrounds
- [ ] Extend Tailwind config with new color aliases
- [ ] Create utility classes: `btn-secondary`, `btn-success`
- [ ] Update design-guidelines.md with new palette

## Code Changes

### globals.css additions

```css
:root {
  /* Existing... */

  /* NEW: Neutral/White tokens */
  --neutral: 0 0% 95%;
  --neutral-foreground: 0 0% 15%;

  /* NEW: Success expansion */
  --success-muted: 142 71% 45%;
}

.dark {
  /* Existing... */

  /* NEW: Dark mode neutral */
  --neutral: 0 0% 90%;
  --neutral-foreground: 0 0% 10%;
}
```

### tailwind.config.ts additions

```ts
colors: {
  neutral: {
    DEFAULT: "hsl(var(--neutral))",
    foreground: "hsl(var(--neutral-foreground))",
  },
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
    muted: "hsl(var(--success-muted) / 0.15)",
  },
}
```

## Success Criteria

- [ ] New tokens defined in CSS
- [ ] Tailwind config extended
- [ ] No breaking changes to existing components
- [ ] Documentation updated

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing styles | Medium | Use additive approach, don't modify existing tokens |
| Inconsistent usage | Low | Clear documentation + usage matrix |

## Next Steps

→ Phase 02: Button Hierarchy Refactor
