# Projects Header Search Bar Update

**Date:** 2026-01-04
**Priority:** Medium
**Status:** Planning

## Overview

Replace the current header title/description ("Projects" / "Manage your documentation sync projects") with a search bar component using ShadCN + TailwindCSS.

## Current State

- Header component: `apps/frontend/components/header.tsx`
- Projects page: `apps/frontend/app/(dashboard)/projects/page.tsx`
- Current header shows: title + description + action button

## Target State

- Remove title "Projects" and description text
- Add search bar with search icon (using ShadCN Input + Lucide icons)
- Keep "New Project" button on the right side
- Maintain sticky header behavior and backdrop blur

## Phases

| Phase | Description | Status | Link |
|-------|-------------|--------|------|
| 01 | Create SearchInput component | Pending | [phase-01-search-input-component.md](./phase-01-search-input-component.md) |
| 02 | Update Header component | Pending | [phase-02-update-header.md](./phase-02-update-header.md) |
| 03 | Integrate with Projects page | Pending | [phase-03-integrate-projects.md](./phase-03-integrate-projects.md) |

## Design Specifications

### Search Bar Design
- **Height:** 40px (h-10)
- **Width:** 320px (w-80) or flexible
- **Background:** `bg-secondary/50` with `hover:bg-secondary`
- **Border:** `border-border` with `focus:border-primary`
- **Border radius:** `rounded-lg`
- **Icon:** Search icon (Lucide) positioned left, `text-muted-foreground`
- **Placeholder:** "Search projects..." in `text-muted-foreground`
- **Font:** System font, 14px (text-sm)

### Header Layout
- Flex container with `justify-between`
- Search bar on left
- Action button on right
- Height: 64px (h-16)
- Sticky positioning with backdrop blur

## Files to Modify

1. `apps/frontend/components/ui/search-input.tsx` (new)
2. `apps/frontend/components/header.tsx`
3. `apps/frontend/app/(dashboard)/projects/page.tsx`

## Success Criteria

- [ ] Search bar renders correctly in header
- [ ] Search icon visible on left side
- [ ] Placeholder text displays properly
- [ ] Focus states work correctly
- [ ] Responsive on mobile/tablet
- [ ] "New Project" button remains functional
