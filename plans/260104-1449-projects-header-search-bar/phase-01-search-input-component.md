# Phase 01: Create SearchInput Component

**Date:** 2026-01-04
**Priority:** High
**Status:** Pending

## Context Links
- [Main Plan](./plan.md)
- [ShadCN Input Docs](https://ui.shadcn.com/docs/components/input)

## Overview

Create a reusable SearchInput component using ShadCN Input + Lucide Search icon.

## Key Insights

- ShadCN provides InputGroup pattern for icon + input combinations
- Existing Input component at `apps/frontend/components/ui/input.tsx`
- Use composition pattern for flexibility

## Requirements

1. Search icon on left side (inline-start)
2. Placeholder text support
3. onChange handler for search functionality
4. Focus/hover states matching design system
5. Keyboard accessibility (focus ring)

## Architecture

```
SearchInput (new component)
├── Container (relative positioning)
├── Search Icon (absolute left)
└── Input (padding-left for icon space)
```

## Related Code Files

- `apps/frontend/components/ui/input.tsx` - Base input component
- `apps/frontend/lib/utils.ts` - cn() utility

## Implementation Steps

1. Create `apps/frontend/components/ui/search-input.tsx`
2. Import Input, Search icon from lucide-react
3. Build wrapper with relative positioning
4. Position icon absolutely on left
5. Add left padding to input for icon space
6. Export SearchInput component

## Code Template

```tsx
import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.ComponentProps<'input'> {
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn('relative', containerClassName)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          className={cn('pl-9', className)}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
```

## Todo List

- [ ] Create search-input.tsx file
- [ ] Test component renders correctly
- [ ] Verify icon positioning
- [ ] Test focus states

## Success Criteria

- [ ] Component renders with search icon
- [ ] Icon positioned correctly on left
- [ ] Input accepts all standard props
- [ ] Focus ring displays properly
- [ ] Placeholder text visible

## Risk Assessment

- **Low:** Simple component, minimal complexity
- Uses existing Input component as base

## Security Considerations

- Input sanitization handled by parent components
- No direct data processing in this component
