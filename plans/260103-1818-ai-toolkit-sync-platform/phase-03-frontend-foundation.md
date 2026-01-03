# Phase 03: Frontend Foundation

---
phase: 03
title: Frontend Foundation
status: done
effort: 8h
parallelization: Can run in PARALLEL with Phase 02
depends_on: [phase-01]
blocks: [phase-04, phase-06]
---

## Overview

Set up Next.js 14 App Router, Shadcn/ui components, TanStack Query, Zustand stores, and base layout.

## File Ownership (Exclusive to This Phase)

```
apps/frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── providers.tsx
│   ├── query-client.ts
│   ├── api.ts
│   └── utils.ts
├── components/ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── badge.tsx
│   └── skeleton.tsx
├── stores/
│   └── ui-store.ts
├── types/
│   └── index.ts
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── components.json
```

## Implementation Steps

### Step 1: Next.js Configuration (30m)

**1.1 Create apps/frontend/next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

**1.2 Create apps/frontend/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          850: '#1E293B',
          950: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

**1.3 Create apps/frontend/postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Step 2: Global Styles (30m)

**2.1 Create apps/frontend/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 7%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 7%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar for dark theme */
.dark ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.dark ::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark ::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Pulse animation for lock status */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}
```

### Step 3: Utility Functions (30m)

**3.1 Create apps/frontend/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

**3.2 Create apps/frontend/lib/api.ts**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetcher<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Type-safe API methods
export const api = {
  // Projects
  getProjects: () => fetcher<Project[]>('/projects'),
  getProject: (id: string) => fetcher<Project>(`/projects/${id}`),
  createProject: (data: CreateProjectData) =>
    fetcher<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<CreateProjectData>) =>
    fetcher<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    fetcher<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Docs
  getDocs: (projectId: string) => fetcher<Doc[]>(`/projects/${projectId}/docs`),
  getDoc: (projectId: string, fileName: string) =>
    fetcher<Doc>(`/projects/${projectId}/docs/${fileName}`),
  updateDoc: (projectId: string, fileName: string, content: string) =>
    fetcher<Doc>(`/projects/${projectId}/docs/${fileName}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  syncDocs: (projectId: string) =>
    fetcher<Doc[]>(`/projects/${projectId}/docs/sync`, { method: 'POST' }),
  pushDoc: (projectId: string, fileName: string) =>
    fetcher<{ success: boolean }>(`/projects/${projectId}/docs/${fileName}/push`, {
      method: 'POST',
    }),

  // Lock
  getLock: (projectId: string) => fetcher<Lock | null>(`/projects/${projectId}/lock`),
  acquireLock: (projectId: string, lockedBy: string, reason?: string) =>
    fetcher<Lock>(`/projects/${projectId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ lockedBy, reason }),
    }),
  releaseLock: (projectId: string) =>
    fetcher<{ released: boolean }>(`/projects/${projectId}/lock`, {
      method: 'DELETE',
    }),

  // API Keys
  generateApiKey: (projectId: string, name: string) =>
    fetcher<ApiKey>(`/projects/${projectId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
};

// Types (shared with backend)
export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  docsPath: string;
  createdAt: string;
  updatedAt: string;
  locks?: Lock[];
  docs?: Doc[];
  apiKeys?: ApiKey[];
  _count?: { docs: number; apiKeys: number };
}

export interface Doc {
  id: string;
  projectId: string;
  fileName: string;
  content: string;
  hash: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lock {
  id: string;
  projectId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt?: string;
  reason?: string;
}

export interface ApiKey {
  id: string;
  projectId: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProjectData {
  name: string;
  repoUrl: string;
  token: string;
  branch?: string;
  docsPath?: string;
}
```

### Step 4: Query Client & Providers (45m)

**4.1 Create apps/frontend/lib/query-client.ts**

```typescript
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: reuse client
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
```

**4.2 Create apps/frontend/lib/providers.tsx**

```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from './query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Step 5: Zustand UI Store (30m)

**5.1 Create apps/frontend/stores/ui-store.ts**

```typescript
import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modals
  activeModal: string | null;
  openModal: (modal: string) => void;
  closeModal: () => void;

  // Editor
  editorDirty: boolean;
  setEditorDirty: (dirty: boolean) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Modals
  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  // Editor
  editorDirty: false,
  setEditorDirty: (dirty) => set({ editorDirty: dirty }),

  // Theme
  theme: 'dark',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}));
```

### Step 6: Type Definitions (15m)

**6.1 Create apps/frontend/types/index.ts**

```typescript
// Re-export API types
export type {
  Project,
  Doc,
  Lock,
  ApiKey,
  CreateProjectData,
} from '@/lib/api';

// UI-specific types
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
}
```

### Step 7: Shadcn/ui Components (2h)

**7.1 Create apps/frontend/components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**7.2 Create apps/frontend/components/ui/button.tsx**

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-500 text-white hover:bg-blue-600',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-slate-600 bg-transparent text-slate-300 hover:bg-slate-700 hover:text-white',
        secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
        ghost: 'hover:bg-slate-800 hover:text-white',
        link: 'text-blue-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**7.3 Create apps/frontend/components/ui/card.tsx**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-slate-700 bg-slate-850 text-slate-100',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-400', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

**7.4 Create apps/frontend/components/ui/input.tsx**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
```

**7.5 Create apps/frontend/components/ui/label.tsx**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium text-slate-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = 'Label';

export { Label };
```

**7.6 Create apps/frontend/components/ui/badge.tsx**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-slate-200',
        success: 'bg-green-500/10 text-green-400',
        destructive: 'bg-red-500/10 text-red-400',
        warning: 'bg-amber-500/10 text-amber-400',
        outline: 'border border-slate-600 text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

**7.7 Create apps/frontend/components/ui/skeleton.tsx**

```typescript
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-700', className)}
      {...props}
    />
  );
}

export { Skeleton };
```

### Step 8: Root Layout & Home Page (45m)

**8.1 Create apps/frontend/app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import { Providers } from '@/lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Toolkit Sync Platform',
  description: 'Centralized documentation management for AI-assisted development teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**8.2 Create apps/frontend/app/page.tsx**

```typescript
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard
  redirect('/projects');
}
```

---

## Verification Steps

```bash
# Install dependencies
cd apps/frontend && pnpm install

# Add required dependencies for shadcn/ui
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot

# Start development server
pnpm dev
```

## Success Criteria

- [ ] `pnpm dev` starts Next.js without errors
- [ ] http://localhost:3000 redirects to /projects
- [ ] Dark theme applied correctly
- [ ] TanStack Query DevTools visible
- [ ] No TypeScript errors
- [ ] Tailwind classes compiled

## Handoff to Phase 04

**Phase 04 depends on:**
- `lib/api.ts` for data fetching
- `lib/providers.tsx` for query context
- `stores/ui-store.ts` for UI state
- `components/ui/*` for base components

---

## Conflict Prevention

This phase owns ALL foundation files. Phase 04 will add:
- `app/(dashboard)/` route group (new directory)
- `components/` feature components (new files, not in ui/)
- `hooks/` custom hooks (new directory)

Phase 03 must NOT touch those directories.
