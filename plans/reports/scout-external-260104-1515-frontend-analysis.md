# Frontend Analysis Report

**ID:** a3f6194 | **Date:** 2026-01-04 15:15  
**Directory:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend`

---

## 1. Directory Structure Overview

```
apps/frontend/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard route group
│   │   ├── editor/[projectId]/[docId]/  # Doc editor page
│   │   ├── projects/       # Projects listing & detail
│   │   │   ├── [id]/       # Project detail
│   │   │   │   └── settings/  # Project settings
│   │   │   └── page.tsx    # Projects list
│   │   └── layout.tsx      # Dashboard layout (sidebar)
│   ├── globals.css         # Global styles + CSS variables
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing/redirect page
├── components/             # React components
│   ├── ui/                 # ShadCN UI primitives
│   └── *.tsx               # Feature components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities & API client
├── stores/                 # Zustand state stores
├── types/                  # TypeScript type definitions
└── __tests__/              # Vitest test files
```

## 2. Key Files and Purposes

### Core Configuration
| File | Purpose |
|------|---------|
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/package.json` | Dependencies, scripts |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/tailwind.config.ts` | Tailwind CSS config with custom theme |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/next.config.js` | Next.js configuration |

### App Router Pages
| File | Purpose |
|------|---------|
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/layout.tsx` | Root layout, Providers wrapper |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/layout.tsx` | Dashboard layout with Sidebar |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/page.tsx` | Projects list page |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/[id]/page.tsx` | Project detail page |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/projects/[id]/settings/page.tsx` | Project settings |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/(dashboard)/editor/[projectId]/[docId]/page.tsx` | Document editor |

### Library/Utilities
| File | Purpose |
|------|---------|
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/lib/api.ts` | API client, type definitions |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/lib/providers.tsx` | React Query provider setup |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/lib/query-client.ts` | Query client configuration |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/lib/utils.ts` | Utility functions (cn, etc.) |

### Custom Hooks
| File | Purpose |
|------|---------|
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/hooks/use-projects.ts` | Project CRUD operations |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/hooks/use-docs.ts` | Document operations |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/hooks/use-lock.ts` | Lock management |
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/hooks/use-websocket.ts` | Real-time WebSocket connection |

### State Management
| File | Purpose |
|------|---------|
| `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/stores/ui-store.ts` | UI state (editor dirty, dialogs) |

## 3. Technologies/Frameworks

| Category | Technology | Version |
|----------|------------|---------|
| Framework | **Next.js** (App Router) | 14.2.0 |
| UI Library | **React** | ^18.2.0 |
| Language | **TypeScript** | ^5.4.0 |
| Styling | **Tailwind CSS** | ^3.4.1 |
| UI Components | **Radix UI** (via ShadCN) | Various |
| State Management | **Zustand** | ^4.5.0 |
| Data Fetching | **TanStack React Query** | ^5.28.0 |
| Real-time | **Socket.io-client** | ^4.8.3 |
| Code Editor | **Monaco Editor** | ^4.6.0 |
| Icons | **Lucide React** | ^0.562.0 |
| Notifications | **Sonner** | ^2.0.7 |
| Testing | **Vitest** + Testing Library | ^4.0.16 |

## 4. Component Hierarchy

```
RootLayout (app/layout.tsx)
└── Providers (QueryClientProvider)
    └── DashboardLayout (app/(dashboard)/layout.tsx)
        ├── AppSidebar
        │   └── SidebarMenu (navigation)
        ├── SidebarInset (main content)
        │   └── [Page Content]
        ├── CreateProjectDialog
        └── Toaster (notifications)
```

### UI Components (`/components/ui/`)
- `button.tsx` - Button variants (CVA)
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialogs (Radix)
- `input.tsx` - Form inputs
- `sidebar.tsx` - Collapsible sidebar (ShadCN)
- `skeleton.tsx` - Loading skeletons
- `tooltip.tsx` - Tooltips (Radix)
- `search-input.tsx` - Search input component
- `badge.tsx`, `label.tsx`, `separator.tsx`, `sheet.tsx`, `collapsible.tsx`

### Feature Components (`/components/`)
- `sidebar.tsx` - App navigation sidebar
- `header.tsx` - Page header with search/actions
- `project-card.tsx` - Project card display
- `project-list-item.tsx` - Project list row
- `create-project-dialog.tsx` - New project form
- `empty-state.tsx` - Empty state placeholder
- `monaco-editor.tsx` - Code editor wrapper
- `markdown-preview.tsx` - MD preview pane
- `file-tree.tsx` - Document file tree
- `lock-status.tsx` / `lock-banner.tsx` - Lock indicators

## 5. Pages/Routes Structure

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing/redirect |
| `/projects` | `app/(dashboard)/projects/page.tsx` | Projects list |
| `/projects/[id]` | `app/(dashboard)/projects/[id]/page.tsx` | Project detail |
| `/projects/[id]/settings` | `app/(dashboard)/projects/[id]/settings/page.tsx` | Project settings |
| `/editor/[projectId]/[docId]` | `app/(dashboard)/editor/[projectId]/[docId]/page.tsx` | Document editor |

**Route Groups:** `(dashboard)` groups all authenticated pages with shared sidebar layout.

## 6. State Management Approach

### Server State: TanStack React Query
- Handles API data fetching, caching, invalidation
- Custom hooks wrap query/mutation logic
- Query keys: `['projects']`, `['projects', id]`, `['docs', projectId]`, `['lock', projectId]`

### Client State: Zustand
- Lightweight store for UI state
- Current state: `editorDirty`, `createDialogOpen`

### Real-time: Socket.io
- WebSocket connection for live updates
- Events: `lock:acquired`, `lock:released`, `doc:updated`
- Auto-invalidates React Query cache on events

## 7. Key Dependencies

### Production
```json
{
  "next": "14.2.0",
  "react": "^18.2.0",
  "@tanstack/react-query": "^5.28.0",
  "zustand": "^4.5.0",
  "socket.io-client": "^4.8.3",
  "@monaco-editor/react": "^4.6.0",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-tooltip": "^1.2.8",
  "lucide-react": "^0.562.0",
  "sonner": "^2.0.7",
  "tailwind-merge": "^3.4.0",
  "class-variance-authority": "^0.7.1"
}
```

### Development
```json
{
  "typescript": "^5.4.0",
  "tailwindcss": "^3.4.1",
  "vitest": "^4.0.16",
  "@testing-library/react": "^16.3.1"
}
```

## 8. Styling Approach

### Tailwind CSS + CSS Variables
- **Dark mode:** Class-based (`dark` class on `<html>`)
- **Design tokens:** CSS custom properties in `globals.css`
- **Color system:** HSL-based semantic colors (primary, secondary, muted, etc.)
- **Brand colors:** Coral/orange accent (`#D97755`), warm dark background (`#1A1917`)

### Key CSS Variables
```css
--primary: 18 65% 59%;        /* Coral accent */
--background: 24 10% 10%;     /* Warm dark */
--sidebar-primary: 18 65% 59%; /* Unified with primary */
--success: 142 71% 45%;       /* Green */
--destructive: 0 62% 30%;     /* Red */
```

### Utility Classes
- `card-hover-lift` - Hover elevation effect
- `button-press` - Active press animation
- `card-entrance` - Slide-up animation
- Custom scrollbar styling for dark theme

### Component Styling
- **CVA (class-variance-authority):** Button variants
- **tailwind-merge:** Class merging utility
- **clsx:** Conditional classes

---

## Summary

Next.js 14 App Router frontend with:
- **ShadCN/Radix UI** component library
- **TanStack Query** for server state + **Zustand** for client state
- **Socket.io** real-time updates
- **Monaco Editor** for document editing
- **Tailwind CSS** with custom dark theme (coral accents)
- **Vitest** testing setup

**Architecture Pattern:** Feature-based organization with shared UI primitives, custom hooks for data operations, centralized API client.
