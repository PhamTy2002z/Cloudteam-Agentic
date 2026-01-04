# Phase 03: Component Consistency

**Priority:** P2 (Medium)
**Status:** Complete
**Effort:** 2h
**Dependencies:** Phase 01, Phase 02
**Completed:** 2026-01-04

## Context

Ensure components use proper variants and consistent patterns. Replace inline styling with component variants, add card hover elevation system, enforce typography standards.

**Research:**
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/plans/260104-1317-dashboard-ui-ux-refactor/research/researcher-01-current-ui-analysis.md` (lines 149-159)
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/plans/260104-1317-dashboard-ui-ux-refactor/research/researcher-02-design-recommendations.md` (lines 166-235)
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/docs/design-guidelines.md` (lines 149-168)

## Overview

**Current Issues:**
- Button using inline classes (`bg-brand-cyan`) instead of variants
- Card hover states manually implemented
- No elevation system for interactive cards
- Typography weights not consistently enforced

**Solution:**
- Use Button component variants (default, outline, ghost)
- Implement card elevation system (3 levels)
- Add proper hover/active states
- Enforce font weights per design system

## Requirements

### 1. Button Variant Usage
Replace inline button styling with proper variants:
```tsx
// Instead of:
className="text-white bg-brand-cyan hover:bg-brand-cyan/90"

// Use:
<Button variant="default">Open Project</Button>
```

### 2. Card Elevation System
Add 3 elevation levels:
```css
/* Level 1: Default */
.card { border: 1px solid hsl(var(--border)); }

/* Level 2: Hover */
.card:hover {
  border-color: hsl(var(--border) / 0.6);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}

/* Level 3: Active/Modal */
.card-elevated {
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
```

### 3. Typography Enforcement
Verify font weights match design system:
- h3 (card titles): font-semibold (600)
- body: font-normal (400)
- labels: font-medium (500)

## Related Code Files

1. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/project-card.tsx`
   - Lines 52-60: Replace inline button with Button component
   - Line 25: Add hover elevation classes

2. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/ui/button.tsx`
   - Verify variants: default, outline, ghost, secondary
   - Verify sizes: sm, default, lg, icon

3. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/page.tsx`
   - Line 60-73: "Add New Project" card hover state

4. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/globals.css`
   - Add card elevation utilities

## Implementation Steps

### Step 1: Add Card Elevation Utilities (20min)
```css
/* In globals.css after line 114 */

/* Card Elevation System */
@layer utilities {
  .card-hover-lift {
    @apply transition-all duration-200;
  }

  .card-hover-lift:hover {
    @apply -translate-y-0.5 shadow-lg;
    border-color: hsl(var(--border) / 0.6);
  }

  .card-elevated {
    @apply shadow-xl;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
```

### Step 2: Refactor ProjectCard Button (30min)
```tsx
// In project-card.tsx, replace lines 52-60

// Before:
<span
  className={`flex-1 text-center py-2 text-sm rounded-lg transition font-medium ${
    isLocked
      ? 'text-muted-foreground bg-secondary cursor-not-allowed opacity-50'
      : 'text-white bg-brand-cyan hover:bg-brand-cyan/90'
  }`}
>
  {isLocked ? 'View Only' : 'Open Project'}
</span>

// After:
<Button
  variant={isLocked ? 'secondary' : 'default'}
  disabled={isLocked}
  className="flex-1"
  size="sm"
>
  {isLocked ? 'View Only' : 'Open Project'}
</Button>
```

### Step 3: Add Card Hover Elevation (20min)
```tsx
// In project-card.tsx line 25
// Before:
<Card className="p-6 hover:border-primary/50 transition group cursor-pointer bg-card">

// After:
<Card className="p-6 card-hover-lift group cursor-pointer bg-card hover:border-primary/50">
```

### Step 4: Refactor "Add New Project" Card (25min)
```tsx
// In projects/page.tsx lines 60-73
// Simplify hover states using card-hover-lift

<button
  onClick={() => setCreateDialogOpen(true)}
  className="bg-card/50 border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[200px] card-hover-lift hover:border-primary/50 hover:bg-card cursor-pointer group"
>
  <div className="w-12 h-12 rounded-full bg-secondary group-hover:bg-primary/20 flex items-center justify-center mb-3 transition-colors">
    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
  </div>
  <h3 className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
    Add New Project
  </h3>
  <p className="text-sm text-muted-foreground mt-1">
    Connect a new Git repository
  </p>
</button>
```

### Step 5: Verify Button Component (15min)
Read `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/ui/button.tsx`:
- Confirm `default` variant uses `bg-primary`
- Confirm `secondary` variant for disabled state
- Verify size variants work correctly

### Step 6: Typography Audit (10min)
```bash
# Check font weight consistency
grep -r "font-semibold\|font-medium\|font-bold" apps/frontend/app/(dashboard)/
grep -r "font-semibold\|font-medium\|font-bold" apps/frontend/components/project-card.tsx
```

Verify:
- Card titles: `font-semibold` (h3, 18px, 600)
- Labels/badges: `font-medium` (12px, 500)
- Body text: `font-normal` (14px, 400)

## Todo List

- [ ] Add card elevation utilities to globals.css
- [ ] Test card-hover-lift class
- [ ] Replace ProjectCard button with Button component
- [ ] Add disabled state handling to Button
- [ ] Apply card-hover-lift to ProjectCard
- [ ] Refactor "Add New Project" card hover states
- [ ] Read and verify button.tsx variants
- [ ] Audit typography font weights
- [ ] Fix any inconsistent font weights
- [ ] Test button click handlers still work
- [ ] Test hover states on all cards
- [ ] Verify disabled button appearance
- [ ] Check Settings button (icon variant)
- [ ] Test card elevation on hover
- [ ] Verify no performance issues with transitions

## Success Criteria

- [ ] All buttons use proper variants (no inline bg-primary)
- [ ] Card hover states use card-hover-lift utility
- [ ] Elevation system implemented (3 levels)
- [ ] Typography weights match design system
- [ ] Button click handlers work correctly
- [ ] Hover transitions smooth (200ms)
- [ ] Disabled states visually clear
- [ ] No layout shifts on hover
- [ ] Performance: 60fps on hover animations
- [ ] Accessibility: focus states visible

## Risk Assessment

**Medium Risk:**
- Button refactor may affect click handlers
  - **Mitigation:** Test all button interactions
  - Verify preventDefault/stopPropagation still work

- Card hover elevation may cause layout shifts
  - **Mitigation:** Use transform instead of margin
  - Test with many cards (50+)

**Testing Required:**
- Click "Open Project" button
- Click Settings icon button
- Click "Add New Project" card
- Hover over cards (check elevation)
- Test disabled button state (locked projects)
- Verify focus states (keyboard navigation)
- Performance test with 50+ cards

## Notes

- Use `transform: translateY(-2px)` for hover lift (no layout shift)
- Button component should handle disabled state styling
- Keep transition duration at 200ms (design system standard)
- Shadow values: lg (12px blur), xl (24px blur)
- Verify z-index doesn't conflict with modals/dropdowns
- Settings button uses `variant="ghost" size="icon"`
