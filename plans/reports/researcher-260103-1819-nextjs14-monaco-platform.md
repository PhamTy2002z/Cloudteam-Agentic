# Next.js 14 + Monaco Editor Platform Research

**Date:** 2026-01-03
**Context:** AI Toolkit Sync Platform Frontend
**Scope:** Project structure, Monaco integration, state, UI, WebSocket, responsive design

---

## 1. Project Structure - Next.js 14 App Router

### Folder Organization
```
app/
├── layout.tsx              # Root layout (REQUIRED: must have <html>/<body>)
├── page.tsx                # "/" route
├── (dashboard)/            # Route group (URL-invisible)
│   ├── layout.tsx          # Dashboard shared layout
│   ├── projects/
│   │   ├── page.tsx        # "/projects" list
│   │   └── [id]/
│   │       ├── page.tsx    # "/projects/:id" detail
│   │       ├── loading.tsx # Suspense fallback
│   │       └── error.tsx   # Error boundary
│   ├── editor/
│   │   └── [docId]/
│   │       └── page.tsx    # "/editor/:docId" Monaco view
│   └── settings/
│       └── page.tsx        # "/settings"
├── api/                    # Route handlers
│   └── projects/
│       └── route.ts        # API endpoint
└── _components/            # Shared components (underscore = private)
    ├── monaco-editor.tsx   # Client component
    └── project-card.tsx
```

### Key Conventions
- **Route groups** `(name)` = organizational folders, no URL segment
- **Dynamic routes** `[param]` = URL parameters
- **Private folders** `_name` = excluded from routing
- **Parallel routes** `@slot` = for complex layouts (modals, sidebars)

### File Conventions
- `page.tsx` → publicly accessible route
- `layout.tsx` → shared UI (persists across navigations)
- `loading.tsx` → Suspense boundary
- `error.tsx` → Error boundary
- `route.ts` → API endpoints

---

## 2. Monaco Editor Integration

### Next.js 14 Setup (Client-Side Only)
```tsx
// app/_components/monaco-editor.tsx
'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export function MonacoEditor({
  initialContent,
  onSave
}: {
  initialContent: string
  onSave: (content: string) => void
}) {
  const editorRef = useRef(null)

  const handleMount = (editor, monaco) => {
    editorRef.current = editor

    // Auto-save on Ctrl+S
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave(editor.getValue())
    })
  }

  const handleChange = (value) => {
    // Debounced auto-save (implement debounce logic)
    onSave(value)
  }

  return (
    <Editor
      height="90vh"
      defaultLanguage="markdown"
      defaultValue={initialContent}
      onChange={handleChange}
      onMount={handleMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on'
      }}
    />
  )
}
```

### Usage in Server Component
```tsx
// app/editor/[docId]/page.tsx
import { MonacoEditor } from '@/app/_components/monaco-editor'

export default async function EditorPage({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params
  const doc = await fetchDocument(docId) // Server-side fetch

  return (
    <div className="h-screen">
      <MonacoEditor
        initialContent={doc.content}
        onSave={(content) => {/* client-side save logic */}}
      />
    </div>
  )
}
```

### Auto-Save Strategies
1. **onChange debounce** → save after 2s idle
2. **Keyboard shortcut** → Ctrl+S manual save
3. **onBlur** → save when focus leaves editor
4. **Periodic interval** → save every 30s if dirty

---

## 3. State Management - TanStack Query + Zustand

### Clear Separation Pattern
- **TanStack Query** → Server state (API data, caching, refetch)
- **Zustand** → Client state (UI toggles, modals, form state)

### TanStack Query Setup (Server → Client Hydration)
```tsx
// app/layout.tsx (Server Component)
import { QueryProvider } from '@/lib/query-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}

// lib/query-provider.tsx (Client Component)
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

### Server Component Prefetch + Client Hydration
```tsx
// app/projects/page.tsx (Server Component)
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { ProjectsList } from './_components/projects-list'

export default async function ProjectsPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsList />
    </HydrationBoundary>
  )
}

// _components/projects-list.tsx (Client Component)
'use client'
import { useQuery } from '@tanstack/react-query'

export function ProjectsList() {
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects
  })
  // Data already hydrated from server
}
```

### Zustand for UI State
```tsx
// stores/ui-store.ts
import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  openModal: (modal) => set({ activeModal: modal })
}))
```

### Best Practices
- **Per-request Zustand stores** → avoid SSR state leakage
- **Query key conventions** → `['resource', id, filters]`
- **Server Actions + useMutation** → for data mutations

---

## 4. Shadcn/ui Components

### Installation
```bash
npx shadcn@latest init
npx shadcn@latest add dialog button form input label card
```

### Dashboard Layout Pattern
```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar className="w-64 border-r" />
      <div className="flex-1 flex flex-col">
        <Header className="h-16 border-b" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

### Form in Dialog Pattern
```tsx
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateProjectDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New Project</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" />
            </div>
          </div>
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 5. WebSocket Real-Time Lock Notifications

### Native WebSocket vs Socket.io (2025 Consensus)
**Use native WebSocket** for simple real-time needs:
- Lower overhead, no library dependency
- Built-in browser support
- Sufficient for lock notifications

**Use Socket.io** if you need:
- Auto-reconnection with exponential backoff
- Room-based broadcasting
- Fallback transports (long-polling)

### Native WebSocket Pattern (Recommended)
```tsx
// hooks/use-websocket.ts
'use client'
import { useEffect, useState } from 'react'

export function useWebSocket(url: string) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const ws = new WebSocket(url)

    ws.onopen = () => setStatus('connected')
    ws.onmessage = (event) => setMessage(JSON.parse(event.data))
    ws.onerror = () => setStatus('disconnected')
    ws.onclose = () => setStatus('disconnected')

    return () => ws.close()
  }, [url])

  const send = (data) => ws.send(JSON.stringify(data))

  return { status, message, send }
}

// Usage in component
export function EditorLockStatus({ docId }) {
  const { status, message } = useWebSocket(`wss://api.example.com/locks/${docId}`)

  if (message?.locked) {
    return <div className="bg-yellow-100">Locked by {message.user}</div>
  }
  return null
}
```

---

## 6. Responsive Design - Tailwind Patterns

### Mobile-First Breakpoints
```tsx
<div className="
  grid
  grid-cols-1          {/* mobile: 1 column */}
  sm:grid-cols-2       {/* tablet: 2 columns */}
  lg:grid-cols-3       {/* desktop: 3 columns */}
  gap-4
">
  {projects.map(project => <ProjectCard key={project.id} {...project} />)}
</div>
```

### Responsive Sidebar Pattern
```tsx
// components/sidebar.tsx
export function Sidebar() {
  return (
    <>
      {/* Mobile: overlay */}
      <aside className="
        fixed inset-y-0 left-0 z-50 w-64
        transform transition-transform
        lg:relative lg:translate-x-0
        -translate-x-full data-[open]:translate-x-0
      ">
        <nav className="p-4">...</nav>
      </aside>

      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black/50 lg:hidden" />
    </>
  )
}
```

### Dashboard Grid Layout
```tsx
<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
  {/* Sidebar */}
  <aside className="hidden lg:block">...</aside>

  {/* Main content */}
  <main className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    <Card>...</Card>
    <Card>...</Card>
  </main>
</div>
```

### Utility Patterns
- **Container** → `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Stacked → Horizontal** → `flex flex-col sm:flex-row gap-4`
- **Hide/Show** → `hidden md:block` or `md:hidden`

---

## Recommendations

1. **Project Structure**: Use route groups `(dashboard)` for logical separation without URL bloat
2. **Monaco**: Dynamic import with `ssr: false`, implement debounced auto-save (2s idle)
3. **State**: Prefetch in Server Components → hydrate TanStack Query; Zustand for UI-only state
4. **UI**: Shadcn/ui for consistency; Dialog-in-form pattern for modals
5. **WebSocket**: Start with native WebSocket; migrate to Socket.io only if auto-reconnect needed
6. **Responsive**: Mobile-first grid layouts; collapsible sidebar with overlay on mobile

## Unresolved Questions

1. Lock conflict resolution strategy (manual override vs queue-based)?
2. Offline editing support requirements (LocalStorage persistence)?
3. Multi-user cursor tracking needed (beyond lock notifications)?
4. Monaco theme customization (match app theme or fixed dark/light)?
