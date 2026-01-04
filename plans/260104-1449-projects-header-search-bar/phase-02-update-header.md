# Phase 02: Update Header Component

**Date:** 2026-01-04
**Priority:** High
**Status:** Pending

## Context Links
- [Main Plan](./plan.md)
- [Phase 01](./phase-01-search-input-component.md)

## Overview

Modify Header component to support search bar variant instead of title/description.

## Key Insights

- Current Header: title + description + action button
- New Header: search bar + action button
- Need backward compatibility for other pages using Header

## Requirements

1. Add optional `searchBar` prop to Header
2. When searchBar provided, hide title/description
3. Render SearchInput component
4. Pass search handlers from parent
5. Maintain existing layout structure

## Architecture

```
Header (updated)
├── Left Section
│   ├── [If searchBar] SearchInput
│   └── [Else] Title + Description
└── Right Section
    └── Action Button
```

## Related Code Files

- `apps/frontend/components/header.tsx` - Target file
- `apps/frontend/components/ui/search-input.tsx` - New component

## Implementation Steps

1. Import SearchInput component
2. Add searchBar prop to HeaderProps interface
3. Conditionally render SearchInput or title/description
4. Pass placeholder, value, onChange to SearchInput
5. Test both variants work correctly

## Updated Interface

```tsx
interface HeaderProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  searchBar?: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
  };
}
```

## Updated Component

```tsx
export function Header({ title, description, action, searchBar }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-brand-dark/80 backdrop-blur sticky top-0 z-10">
      <div className="flex-1 max-w-md">
        {searchBar ? (
          <SearchInput
            placeholder={searchBar.placeholder || 'Search...'}
            value={searchBar.value}
            onChange={(e) => searchBar.onChange?.(e.target.value)}
            className="w-full"
          />
        ) : (
          <>
            {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </header>
  );
}
```

## Todo List

- [ ] Update HeaderProps interface
- [ ] Import SearchInput
- [ ] Add conditional rendering logic
- [ ] Test title/description variant still works
- [ ] Test searchBar variant

## Success Criteria

- [ ] SearchInput renders when searchBar prop provided
- [ ] Title/description hidden when searchBar active
- [ ] Existing pages using Header unchanged
- [ ] Action button works in both variants

## Risk Assessment

- **Medium:** Breaking change potential for existing Header usage
- Mitigation: Make all props optional, test existing pages

## Security Considerations

- Search input value controlled by parent
- No XSS risk as React handles escaping
