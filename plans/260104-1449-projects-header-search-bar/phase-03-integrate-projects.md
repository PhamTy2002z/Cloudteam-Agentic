# Phase 03: Integrate with Projects Page

**Date:** 2026-01-04
**Priority:** High
**Status:** Pending

## Context Links
- [Main Plan](./plan.md)
- [Phase 02](./phase-02-update-header.md)

## Overview

Update Projects page to use Header with searchBar instead of title/description.

## Key Insights

- Projects page currently passes title="Projects" and description
- Need to add search state management
- Filter projects based on search query

## Requirements

1. Add search state to ProjectsPage
2. Pass searchBar prop to Header
3. Filter projects by search query
4. Real-time filtering as user types

## Architecture

```
ProjectsPage (updated)
├── useState for searchQuery
├── Header with searchBar prop
├── Filtered projects list
└── ProjectCard components
```

## Related Code Files

- `apps/frontend/app/(dashboard)/projects/page.tsx` - Target file
- `apps/frontend/components/header.tsx` - Updated Header

## Implementation Steps

1. Add `searchQuery` state with useState
2. Replace Header props: remove title/description, add searchBar
3. Create filtered projects using useMemo
4. Filter by project name (case-insensitive)
5. Pass filtered projects to grid

## Updated Code

```tsx
export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [dismissedLock, setDismissedLock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const setCreateDialogOpen = useUIStore((s) => s.setCreateDialogOpen);

  useWebSocket();

  const lockedProject = projects?.find(
    (p) => p.locks?.length && p.id !== dismissedLock
  );

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects?.filter((p) =>
      p.name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <>
      <Header
        searchBar={{
          placeholder: 'Search projects...',
          value: searchQuery,
          onChange: setSearchQuery,
        }}
        action={{
          label: 'New Project',
          onClick: () => setCreateDialogOpen(true),
        }}
      />
      {/* Rest of component uses filteredProjects instead of projects */}
    </>
  );
}
```

## Todo List

- [ ] Add searchQuery state
- [ ] Update Header props
- [ ] Implement filtering logic with useMemo
- [ ] Update grid to use filteredProjects
- [ ] Test search functionality

## Success Criteria

- [ ] Search bar visible in header
- [ ] Typing filters projects in real-time
- [ ] Empty search shows all projects
- [ ] Case-insensitive search works
- [ ] "New Project" button still functional

## Risk Assessment

- **Low:** Isolated change to one page
- Filter logic is simple and performant

## Security Considerations

- Search query is local state only
- No server-side query injection risk
- React handles input sanitization

## Next Steps

After completion:
- Consider adding search to other pages
- Add debounce if performance issues arise
- Consider search by description/tags
