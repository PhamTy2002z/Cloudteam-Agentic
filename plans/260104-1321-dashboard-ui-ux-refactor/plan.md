---
title: "Dashboard UI/UX Refactor"
description: "Refactor dashboard to align with design-guidelines.md"
status: pending
priority: P2
effort: 6h
branch: main
tags: [frontend, ui-ux, refactor]
created: 2026-01-04
---

# Dashboard UI/UX Refactor

## Context

Refactor dashboard UI/UX to align with `/Users/typham/Documents/GitHub/Cloudteam-Agentic/docs/design-guidelines.md`.

**Research reports:**
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/plans/260104-1317-dashboard-ui-ux-refactor/research/researcher-01-current-ui-analysis.md`
- `/Users/typham/Documents/GitHub/Cloudteam-Agentic/plans/260104-1317-dashboard-ui-ux-refactor/research/researcher-02-design-recommendations.md`

**Constraint:** Do NOT modify sidebar (already implemented).

## Key Issues

### Color System
- Hardcoded `brand-cyan` instead of `--primary` token
- Coral accent `--sidebar-primary` (#D97755) unused in main content
- Missing warning/info color tokens

### Spacing
- Inconsistent padding: p-4, p-5, p-6 mixed
- Grid gap: `gap-4` (16px) should be `gap-6` (24px)
- Breakpoint: `xl:grid-cols-3` should be `lg:grid-cols-3`

### Border Radius
- Cards using `rounded-xl` (12px) instead of `rounded-lg` (8px)

### Components
- Button using inline classes instead of variants
- No card hover elevation system
- Missing empty state components
- No toast notifications

## Files to Refactor

1. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/globals.css`
2. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/project-card.tsx`
3. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/page.tsx`
4. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/[id]/page.tsx`
5. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/ui/button.tsx`
6. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/ui/input.tsx`
7. `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/components/ui/skeleton.tsx`

## Implementation Phases

### Phase 01: Token Standardization (1.5h) ✅ COMPLETE
- Remove `brand-cyan` hardcoded references
- Add warning/info color tokens
- Standardize CSS variables
- **File:** `phase-01-token-standardization.md`
- **Completed:** 2026-01-04

### Phase 02: Spacing Normalization (1.5h) ✅ COMPLETE
- Fix padding: all cards to `p-6`
- Fix grid gaps: `gap-4` to `gap-6`
- Fix breakpoints: `xl:grid-cols-3` to `lg:grid-cols-3`
- Fix border radius: `rounded-xl` to `rounded-lg`
- **File:** `phase-02-spacing-normalization.md`
- **Completed:** 2026-01-04

### Phase 03: Component Consistency (2h) ✅ COMPLETE
- Button: use proper variants
- Card: add hover states with elevation
- Typography: enforce font weights
- **File:** `phase-03-component-consistency.md`
- **Completed:** 2026-01-04

### Phase 04: UX Enhancements (1h) ✅ COMPLETE
- Empty state components
- Toast notifications (sonner)
- Micro-interactions (hover lift, transitions)
- **File:** `phase-04-ux-enhancements.md`
- **Completed:** 2026-01-04

## Success Criteria

- [x] All `brand-cyan` references replaced with semantic tokens
- [x] Consistent spacing: cards `p-6`, grids `gap-6`
- [x] Breakpoints use `lg:grid-cols-3` (1024px)
- [x] Border radius: cards `rounded-lg` (8px)
- [x] Button variants used properly
- [x] Card hover states with elevation
- [x] Empty states implemented
- [x] Toast system integrated
- [ ] No visual regressions
- [ ] Design guidelines compliance verified

## Risk Assessment

**Low Risk:**
- Token standardization (CSS variables)
- Spacing adjustments (visual only)
- Border radius changes

**Medium Risk:**
- Button variant refactor (may affect click handlers)
- Card hover states (performance on large lists)
- **Primary color change** (cyan → coral) - significant visual change

**Mitigation:**
- Test all interactive elements after refactor
- Verify performance with 50+ project cards
- Check mobile responsiveness at each phase
- Visual review after color change

---

## Validation Summary

**Validated:** 2026-01-04
**Questions asked:** 7

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Primary CTA color | **Coral (#D97755)** - đổi từ cyan, thống nhất với sidebar |
| Coral accent usage | **Toàn bộ main content** - không chỉ sidebar |
| Toast library | **Sonner** - lightweight, accessible |
| Empty state design | **Icon-based** - dùng Lucide icons |
| Grid breakpoint | **lg:grid-cols-3** (1024px) |
| Card hover effect | **Lift effect** - translateY(-2px) + shadow |

### Action Items (Plan Updates Required)

- [ ] **Phase 01**: Update `--primary` từ cyan (#0DA8D6) sang coral (#D97755)
- [ ] **Phase 01**: Remove `--sidebar-primary` distinction (now same as primary)
- [ ] **Phase 03**: Implement card-hover-lift với translateY(-2px)
- [ ] **Phase 04**: Use Sonner for toast notifications
- [ ] **Phase 04**: EmptyState component với Lucide icons

### Impact Assessment

**High Impact Change:** Primary color từ cyan → coral
- Tất cả buttons, links, hover states sẽ dùng coral
- Brand identity thống nhất với sidebar
- Cần update design-guidelines.md sau khi implement
