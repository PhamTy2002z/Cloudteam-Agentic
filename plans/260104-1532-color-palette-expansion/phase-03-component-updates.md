# Phase 03: Component Updates

**Date**: 2026-01-04
**Priority**: Medium
**Status**: In Progress (62.5% complete)
**Depends on**: Phase 01, Phase 02
**Last Review**: 2026-01-04 15:49 - Code Review APPROVED

## Context

- Plan: [plan.md](./plan.md)
- Phase 01: [phase-01-color-tokens.md](./phase-01-color-tokens.md)
- Phase 02: [phase-02-button-hierarchy.md](./phase-02-button-hierarchy.md)

## Overview

Áp dụng color palette mới vào tất cả components, đảm bảo consistency.

## Key Insights

### Elements cần update (từ screenshots)

**Screen 1 - Projects List:**
- Sidebar active item: Cam → Giữ cam (brand identity)
- "Open" button: Cam → White outline
- Project card icon: Cam → Có thể giữ hoặc neutral

**Screen 2 - Project Detail:**
- "Settings" button: Cam → White outline
- "Sync from GitHub": Cam → Green (success action)
- "Unlocked" badge: Green → Giữ green ✓
- Doc cards: Neutral → Giữ nguyên ✓

**Screen 3 - Settings:**
- Settings nav active: Cam → Giữ cam (consistency với sidebar)
- "Danger Zone": Red → Giữ red ✓
- Form elements: Neutral → Giữ nguyên ✓

**Screen 4 - Editor:**
- "Editing" badge: Cam → Giữ cam (status indicator)
- "Save" button: Cam outline → Cam filled khi có changes
- "Push" button: Cam outline → Green (success action)
- File tree active: Cam → Giữ cam (consistency)

## Requirements

### Component-by-Component Changes

| Component | Element | Current | New | Rationale |
|-----------|---------|---------|-----|-----------|
| ProjectCard | "Open" btn | `default` | `neutral` | Secondary action |
| ProjectCard | Icon bg | Coral | Keep | Brand element |
| Header | "New Project" | `default` | Keep | Primary CTA |
| Header | "Settings" | `default` | `neutral` | Secondary |
| ProjectDetail | "Sync" | `default` | `success` | Positive action |
| Editor | "Save" | `outline` | `default` | Primary when dirty |
| Editor | "Push" | `outline` | `success` | Positive action |
| Sidebar | Active item | Coral bg | Keep | Brand identity |
| Badges | "Unlocked" | Green | Keep | Already correct |
| Badges | "Editing" | Coral | Keep | Status indicator |

## Architecture

### Files to Modify

```
apps/frontend/
├── components/
│   ├── project-card.tsx      # "Open" button
│   ├── header.tsx            # "New Project", search
│   └── sidebar.tsx           # Keep coral active
├── app/
│   ├── projects/
│   │   └── [id]/
│   │       ├── page.tsx      # "Settings", "Sync" buttons
│   │       └── settings/     # Settings page
│   └── editor/
│       └── [id]/
│           └── page.tsx      # "Save", "Push" buttons
```

## Implementation Steps

### Batch 1: Button Updates
- [x] ProjectCard: Change "Open" to `variant="neutral"` (Already implemented)
- [x] ProjectDetail header: Change "Settings" to `variant="neutral"`
- [x] ProjectDetail: Change "Sync from GitHub" to `variant="success"`

### Batch 2: Editor Updates
- [x] Editor toolbar: Change "Push" to `variant="success"`
- [x] Editor toolbar: Keep "Save" as primary, ensure filled when dirty

### Batch 3: Verification
- [ ] Test all screens for visual consistency
- [ ] Verify contrast ratios meet WCAG AA
- [ ] Check hover/focus states

## Visual Result Preview

### Projects Page (After)
```
┌─────────────────────────────────────────────────────────┐
│ [Search...]                        [+ New Project] ←coral│
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📁 Stock_Massive  [Unlocked]←green                  │ │
│ │    PhamTy2002z/...        [Open]←white  ⚙←gray  🔗  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Project Detail (After)
```
┌─────────────────────────────────────────────────────────┐
│ Stock_Massive                      [+ Settings]←white   │
│ github.com/...                                          │
├─────────────────────────────────────────────────────────┤
│ Documentation          [🔄 Sync from GitHub]←green      │
│ 9 files available                                       │
└─────────────────────────────────────────────────────────┘
```

### Editor (After)
```
┌─────────────────────────────────────────────────────────┐
│ ← Stock_Massive    [system-arch.md]   [Editing]←coral   │
│                              [💾 Save]←coral [⬆ Push]←green│
└─────────────────────────────────────────────────────────┘
```

## Success Criteria

- [x] Cam chỉ xuất hiện ở: Primary CTA, Active states, Status badges
- [x] Trắng dùng cho: Secondary buttons, outline actions
- [x] Xanh lá dùng cho: Success actions (Sync, Push, Unlocked)
- [ ] Visual balance cải thiện rõ rệt (Needs QA verification)
- [x] Brand identity (coral) vẫn được giữ

## Code Review Notes

**Review Date**: 2026-01-04 15:49
**Status**: APPROVED WITH RECOMMENDATIONS

### Completed Changes
1. Header component: Added variant prop support
2. Projects detail: Settings button → neutral, Sync → success
3. Editor: Save dynamic variant, Push → success, Editing badge → primary
4. Tests: Updated and passing (26/26)
5. Build: SUCCESS

### Minor Issues Found
- Line 178 in projects/[id]/page.tsx: Redundant `className="h-9"` (size="sm" already sets this)

### Pending Tasks
- Visual QA on all 4 screens
- WCAG AA contrast verification
- Hover/focus states testing

**Full Report**: `/Users/typham/Documents/GitHub/Cloudteam-Agentic/plans/reports/code-reviewer-260104-1549-phase03-component-updates.md`

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Inconsistent application | Medium | Follow component mapping strictly |
| Missing edge cases | Low | QA all screens after changes |

## Security Considerations

- No security impact - purely visual changes
- Ensure color contrast for accessibility

## Next Steps

After Phase 03:
1. Update `docs/design-guidelines.md` với new color usage
2. Create Storybook examples cho new variants
3. Team review và feedback
