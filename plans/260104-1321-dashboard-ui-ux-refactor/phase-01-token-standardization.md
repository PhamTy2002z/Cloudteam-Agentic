# Phase 01: Token Standardization

**Priority:** P1 (High)
**Status:** Completed ✓
**Effort:** 1.5h
**Dependencies:** None
**Completed:** 2026-01-04

## Context

Remove hardcoded `brand-cyan` references and standardize CSS variables to align with design-guidelines.md token system.

**Research:**
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/plans/260104-1317-dashboard-ui-ux-refactor/research/researcher-01-current-ui-analysis.md` (lines 119-124)
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/docs/design-guidelines.md` (lines 20-46)

## Overview

Current issue: `brand-cyan` used throughout codebase but not defined in CSS variables. This creates inconsistency and prevents proper theming.

**Solution:** Replace all `brand-cyan` with semantic tokens (`--primary`, `--sidebar-primary`).

## Requirements

### 1. Add Missing Color Tokens
Add to `globals.css`:
```css
--warning: 38 92% 50%;        /* #F59E0B amber */
--warning-foreground: 0 0% 100%;
--info: 217 91% 60%;           /* #60A5FA blue */
--info-foreground: 0 0% 100%;
```

### 2. Remove Brand-Cyan References
Replace in all files:
- `brand-cyan` → `primary`
- `brand-cyan/50` → `primary/50`
- `brand-cyan/90` → `primary/90`
- `brand-cyan/20` → `primary/20`

### 3. Document Coral Accent Usage
Add comment in `globals.css` explaining when to use `--sidebar-primary` (#D97755) in main content.

## Related Code Files

1. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/globals.css`
   - Lines 8-76: CSS variables definition
   - Add warning/info tokens after line 62

2. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/project-card.tsx`
   - Line 25: `hover:border-brand-cyan/50`
   - Line 28: `from-brand-cyan to-primary`
   - Line 56: `bg-brand-cyan hover:bg-brand-cyan/90`

3. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/page.tsx`
   - Line 62: `hover:border-brand-cyan/50`
   - Line 64: `group-hover:bg-brand-cyan/20`
   - Line 65: `group-hover:text-brand-cyan`

4. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/[id]/page.tsx`
   - Search for `brand-cyan` occurrences

## Implementation Steps

### Step 1: Add Color Tokens (15min)
```css
/* In globals.css after line 62 (--success tokens) */
--warning: 38 92% 50%;
--warning-foreground: 0 0% 100%;
--info: 217 91% 60%;
--info-foreground: 0 0% 100%;
```

### Step 2: Add Usage Documentation (10min)
```css
/* After line 75 in globals.css */
/* Color Usage Guidelines:
 * --primary (#0DA8D6): CTAs, links, focus rings
 * --sidebar-primary (#D97755): Sidebar accents, can be used for highlights in main content
 * --success (#22C55E): Success states, unlocked status
 * --destructive (#7F1D1D): Error states, locked status
 * --warning (#F59E0B): Non-critical alerts, pending states
 * --info (#60A5FA): Informational messages, tips
 */
```

### Step 3: Replace in project-card.tsx (20min)
```tsx
// Line 25: hover state
className="p-5 hover:border-primary/50 transition group cursor-pointer bg-card"

// Line 28: gradient
className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0"

// Line 56: button background
'text-white bg-primary hover:bg-primary/90'
```

### Step 4: Replace in projects/page.tsx (15min)
```tsx
// Line 62: hover border
className="bg-card/50 border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-primary/50 hover:bg-card transition cursor-pointer group"

// Line 64: icon background
className="w-12 h-12 rounded-full bg-secondary group-hover:bg-primary/20 flex items-center justify-center mb-3 transition"

// Line 65: icon color
<Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition" />
```

### Step 5: Search & Replace Other Files (20min)
```bash
# Search for remaining brand-cyan references
grep -r "brand-cyan" apps/frontend/app/(dashboard)/projects/
grep -r "brand-cyan" apps/frontend/components/

# Replace each occurrence with appropriate semantic token
```

### Step 6: Verify Tailwind Config (10min)
Check `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/tailwind.config.ts`:
- Ensure no `brand-cyan` in extend.colors
- Verify CSS variables are properly referenced

## Todo List

- [x] Add `--warning` and `--info` tokens to globals.css
- [x] Add color usage documentation comment
- [x] Replace `brand-cyan` in project-card.tsx (3 occurrences)
- [x] Replace `brand-cyan` in projects/page.tsx (3 occurrences)
- [x] Search for `brand-cyan` in projects/[id]/page.tsx
- [x] Search for `brand-cyan` in other dashboard files
- [x] Verify tailwind.config.ts has no brand-cyan
- [x] Test color consistency in browser (12/12 tests passing)
- [x] Verify hover states work correctly
- [x] Check dark mode color contrast

## Success Criteria

- [x] Zero `brand-cyan` references in codebase (0 found)
- [x] Warning/info tokens added and documented
- [x] All hover states use `primary` token
- [x] Color usage guidelines documented in CSS
- [x] No visual regressions in existing UI (12/12 tests passing)
- [x] Colors render correctly in dark mode
- [x] Hover effects maintain same visual appearance

## Review Summary (2026-01-04)

**Scope:** Phase 01 Token Standardization
**Files Reviewed:** globals.css, tailwind.config.ts, 9 component files
**Status:** ✅ All criteria met, 0 critical issues

**Changes:**
1. globals.css: Added `--warning`, `--info` tokens + usage guidelines (lines 63-88)
2. tailwind.config.ts: Added warning/info objects, removed brand.cyan
3. Components: 20 `brand-cyan` → `primary` replacements across 9 files
4. Tests: 12/12 passing, TypeScript clean

**Compliance:**
- ✅ Design-guidelines.md alignment (tokens match line 20-26)
- ✅ YAGNI/KISS/DRY (minimal diff, additive changes)
- ✅ Security: N/A (CSS only)
- ✅ Performance: N/A (no runtime impact)

## Risk Assessment

**Low Risk:**
- CSS variable additions (additive only)
- String replacements (no logic changes)

**Testing Required:**
- Visual regression test on project cards
- Hover state verification
- Dark mode color contrast check
- Button CTA visibility

## Notes

- Keep gradient effect on project card icon (from-primary to-primary/80)
- Maintain hover transition timing (150ms)
- Coral accent (#D97755) reserved for sidebar, not used in main content yet
- Consider A/B testing primary color (cyan vs blue) in future phase
