# Phase 04: Frontend Features

---
phase: 04
title: Frontend Features
status: done
effort: 8h
parallelization: Can run in PARALLEL with Phase 05
depends_on: [phase-03]
blocks: [phase-06]
---

## Overview

Implement dashboard pages, project cards, Monaco editor, lock status components, and custom hooks.

## File Ownership (Exclusive to This Phase)

```
apps/frontend/
├── app/(dashboard)/
│   ├── layout.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   └── editor/
│       └── [projectId]/
│           └── [docId]/
│               └── page.tsx
├── components/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── project-card.tsx
│   ├── create-project-dialog.tsx
│   ├── lock-status.tsx
│   ├── lock-banner.tsx
│   ├── monaco-editor.tsx
│   ├── markdown-preview.tsx
│   └── file-tree.tsx
└── hooks/
    ├── use-projects.ts
    ├── use-docs.ts
    ├── use-lock.ts
    └── use-websocket.ts
```

## Implementation Steps

### Step 1: Custom Hooks (1h)

**1.1 Create apps/frontend/hooks/use-projects.ts**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Project, type CreateProjectData } from '@/lib/api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => api.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreateProjectData>) => api.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

**1.2 Create apps/frontend/hooks/use-docs.ts**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Doc } from '@/lib/api';

export function useDocs(projectId: string) {
  return useQuery({
    queryKey: ['docs', projectId],
    queryFn: () => api.getDocs(projectId),
    enabled: !!projectId,
  });
}

export function useDoc(projectId: string, fileName: string) {
  return useQuery({
    queryKey: ['docs', projectId, fileName],
    queryFn: () => api.getDoc(projectId, fileName),
    enabled: !!projectId && !!fileName,
  });
}

export function useUpdateDoc(projectId: string, fileName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => api.updateDoc(projectId, fileName, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['docs', projectId, fileName] });
    },
  });
}

export function useSyncDocs(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.syncDocs(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs', projectId] });
    },
  });
}

export function usePushDoc(projectId: string, fileName: string) {
  return useMutation({
    mutationFn: () => api.pushDoc(projectId, fileName),
  });
}
```

**1.3 Create apps/frontend/hooks/use-lock.ts**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Lock } from '@/lib/api';

export function useLock(projectId: string) {
  return useQuery({
    queryKey: ['lock', projectId],
    queryFn: () => api.getLock(projectId),
    enabled: !!projectId,
    refetchInterval: 10000, // Poll every 10 seconds
  });
}

export function useAcquireLock(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lockedBy, reason }: { lockedBy: string; reason?: string }) =>
      api.acquireLock(projectId, lockedBy, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lock', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useReleaseLock(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.releaseLock(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lock', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

**1.4 Create apps/frontend/hooks/use-websocket.ts**

```typescript
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

interface LockEvent {
  type: 'lock:acquired' | 'lock:released';
  projectId: string;
  lockedBy?: string;
  lockedAt?: string;
}

export function useWebSocket(projectId?: string) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      setStatus('connected');
      // Join project room if specified
      if (projectId) {
        ws.send(JSON.stringify({ type: 'join', projectId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data: LockEvent = JSON.parse(event.data);

        // Invalidate relevant queries on lock events
        if (data.type === 'lock:acquired' || data.type === 'lock:released') {
          queryClient.invalidateQueries({ queryKey: ['lock', data.projectId] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onerror = () => {
      setStatus('disconnected');
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
  }, [projectId, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { status, send };
}
```

### Step 2: Layout Components (1h)

**2.1 Create apps/frontend/components/sidebar.tsx**

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, FileText, Settings, Database } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/projects', icon: Home },
  { title: 'Documentation', href: '/docs', icon: FileText },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-slate-850 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">AI Toolkit Sync</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition',
                isActive
                  ? 'bg-slate-700/50 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium">
            TL
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Team Lead</div>
            <div className="text-xs text-slate-500 truncate">team@example.com</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

**2.2 Create apps/frontend/components/header.tsx**

```typescript
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </header>
  );
}
```

### Step 3: Project Components (1.5h)

**3.1 Create apps/frontend/components/project-card.tsx**

```typescript
'use client';

import Link from 'next/link';
import { Settings, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LockStatus } from './lock-status';
import { formatRelativeTime } from '@/lib/utils';
import type { Project } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const lock = project.locks?.[0];
  const isLocked = !!lock;

  // Extract org/repo from URL
  const repoMatch = project.repoUrl.match(/github\.com\/(.+)/);
  const repoName = repoMatch ? repoMatch[1].replace('.git', '') : project.repoUrl;

  return (
    <Card className="p-5 hover:border-slate-600 transition group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-slate-400">{repoName}</p>
          </div>
        </div>
        <LockStatus lock={lock} />
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        {isLocked ? (
          <>
            <span>Locked by {lock.lockedBy}</span>
            <span className="text-slate-600">|</span>
            <span>{formatRelativeTime(lock.lockedAt)}</span>
          </>
        ) : (
          <span>Last synced {formatRelativeTime(project.updatedAt)}</span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
        <Link
          href={isLocked ? '#' : `/editor/${project.id}`}
          className={`flex-1 text-center py-2 text-sm rounded-lg transition font-medium ${
            isLocked
              ? 'text-slate-400 bg-slate-700/30 cursor-not-allowed opacity-50'
              : 'text-white bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLocked ? 'View Only' : 'Open Editor'}
        </Link>
        <Link href={`/projects/${project.id}/settings`}>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
```

**3.2 Create apps/frontend/components/lock-status.tsx**

```typescript
import { Badge } from '@/components/ui/badge';
import type { Lock } from '@/lib/api';

interface LockStatusProps {
  lock?: Lock | null;
}

export function LockStatus({ lock }: LockStatusProps) {
  const isLocked = !!lock;

  return (
    <Badge variant={isLocked ? 'destructive' : 'success'}>
      <span
        className={`w-2 h-2 rounded-full ${
          isLocked ? 'bg-red-500 pulse-dot' : 'bg-green-500'
        }`}
      />
      {isLocked ? 'Locked' : 'Unlocked'}
    </Badge>
  );
}
```

**3.3 Create apps/frontend/components/lock-banner.tsx**

```typescript
'use client';

import { X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import type { Lock as LockType } from '@/lib/api';

interface LockBannerProps {
  lock: LockType;
  onDismiss?: () => void;
}

export function LockBanner({ lock, onDismiss }: LockBannerProps) {
  return (
    <div className="mx-6 mt-4 bg-gradient-to-r from-red-950 to-red-900 border-l-4 border-red-500 rounded-r-lg p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
        <Lock className="w-5 h-5 text-red-400 pulse-dot" />
      </div>
      <div className="flex-1">
        <div className="text-red-200 font-medium">
          Project is locked
        </div>
        <div className="text-red-300/70 text-sm">
          Locked by {lock.lockedBy} {formatRelativeTime(lock.lockedAt)}
          {lock.reason && ` - ${lock.reason}`}
        </div>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="text-red-300 hover:text-white hover:bg-red-800/50"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
```

### Step 4: Monaco Editor (1.5h)

**4.1 Create apps/frontend/components/monaco-editor.tsx**

```typescript
'use client';

import { useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useUIStore } from '@/stores/ui-store';
import { debounce } from '@/lib/utils';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface MonacoEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onAutoSave?: (content: string) => void;
  readOnly?: boolean;
}

export function MonacoEditor({
  initialContent,
  onSave,
  onAutoSave,
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<any>(null);
  const setEditorDirty = useUIStore((s) => s.setEditorDirty);

  // Debounced auto-save (2 second delay)
  const debouncedAutoSave = useCallback(
    debounce((value: string) => {
      onAutoSave?.(value);
    }, 2000),
    [onAutoSave],
  );

  const handleMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor;

      // Ctrl+S to save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const value = editor.getValue();
        onSave(value);
        setEditorDirty(false);
      });
    },
    [onSave, setEditorDirty],
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        setEditorDirty(true);
        debouncedAutoSave(value);
      }
    },
    [setEditorDirty, debouncedAutoSave],
  );

  return (
    <Editor
      height="100%"
      defaultLanguage="markdown"
      defaultValue={initialContent}
      onChange={handleChange}
      onMount={handleMount}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        wordWrap: 'on',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
      }}
    />
  );
}
```

**4.2 Create apps/frontend/components/markdown-preview.tsx**

```typescript
'use client';

import { useMemo } from 'react';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  // Simple markdown to HTML (for demo - use remark/rehype in production)
  const html = useMemo(() => {
    return content
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-slate-100 mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-slate-100 mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-slate-100 mb-4 pb-2 border-b border-slate-700">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-2 py-0.5 rounded text-blue-300 text-sm font-mono">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-slate-300 mb-4">')
      .replace(/^(?!<[h|l])/gm, '<p class="text-slate-300 mb-4">');
  }, [content]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <article
        className="prose prose-invert prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
```

**4.3 Create apps/frontend/components/file-tree.tsx**

```typescript
'use client';

import { File, Folder, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Doc } from '@/lib/api';

interface FileTreeProps {
  docs: Doc[];
  activeDoc?: string;
  onSelect: (fileName: string) => void;
  onRefresh?: () => void;
}

export function FileTree({ docs, activeDoc, onSelect, onRefresh }: FileTreeProps) {
  return (
    <aside className="w-56 border-r border-slate-700 bg-slate-900 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          Explorer
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5 text-sm">
          {/* docs folder */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-slate-300">
            <Folder className="w-4 h-4 text-yellow-500" />
            <span>docs</span>
          </div>

          {/* Files */}
          <div className="pl-4 space-y-0.5">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.fileName)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-left',
                  activeDoc === doc.fileName
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                )}
              >
                <File className="w-4 h-4" />
                <span className="truncate">{doc.fileName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
```

### Step 5: Dashboard Layout (30m)

**5.1 Create apps/frontend/app/(dashboard)/layout.tsx**

```typescript
import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60">{children}</main>
    </div>
  );
}
```

### Step 6: Projects Pages (1.5h)

**6.1 Create apps/frontend/app/(dashboard)/projects/page.tsx**

```typescript
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ProjectCard } from '@/components/project-card';
import { LockBanner } from '@/components/lock-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { useWebSocket } from '@/hooks/use-websocket';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [dismissedLock, setDismissedLock] = useState<string | null>(null);

  // Connect WebSocket for real-time updates
  useWebSocket();

  // Find any locked project for banner
  const lockedProject = projects?.find(
    (p) => p.locks?.length && p.id !== dismissedLock
  );

  return (
    <>
      <Header
        title="Projects"
        description="Manage your documentation sync projects"
        action={{
          label: 'New Project',
          onClick: () => {
            // TODO: Open create dialog
          },
        }}
      />

      {/* Lock banner */}
      {lockedProject?.locks?.[0] && (
        <LockBanner
          lock={lockedProject.locks[0]}
          onDismiss={() => setDismissedLock(lockedProject.id)}
        />
      )}

      {/* Projects grid */}
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            {/* Add new project card */}
            <div className="bg-slate-850/50 border-2 border-dashed border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-blue-500/50 hover:bg-slate-850 transition cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-slate-700 group-hover:bg-blue-500/20 flex items-center justify-center mb-3 transition">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition" />
              </div>
              <h3 className="font-medium text-slate-300 group-hover:text-white transition">
                Add New Project
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Connect a new Git repository
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
```

**6.2 Create apps/frontend/app/(dashboard)/projects/loading.tsx**

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsLoading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

### Step 7: Editor Page (1h)

**7.1 Create apps/frontend/app/(dashboard)/editor/[projectId]/[docId]/page.tsx**

```typescript
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MonacoEditor } from '@/components/monaco-editor';
import { MarkdownPreview } from '@/components/markdown-preview';
import { FileTree } from '@/components/file-tree';
import { useProject } from '@/hooks/use-projects';
import { useDoc, useDocs, useUpdateDoc, usePushDoc } from '@/hooks/use-docs';
import { useLock, useAcquireLock, useReleaseLock } from '@/hooks/use-lock';
import { useWebSocket } from '@/hooks/use-websocket';
import { useUIStore } from '@/stores/ui-store';

export default function EditorPage() {
  const params = useParams<{ projectId: string; docId: string }>();
  const router = useRouter();
  const { projectId, docId } = params;
  const fileName = decodeURIComponent(docId);

  const { data: project } = useProject(projectId);
  const { data: docs } = useDocs(projectId);
  const { data: doc, isLoading } = useDoc(projectId, fileName);
  const { data: lock } = useLock(projectId);
  const updateDoc = useUpdateDoc(projectId, fileName);
  const pushDoc = usePushDoc(projectId, fileName);
  const acquireLock = useAcquireLock(projectId);
  const releaseLock = useReleaseLock(projectId);

  const editorDirty = useUIStore((s) => s.editorDirty);
  const setEditorDirty = useUIStore((s) => s.setEditorDirty);

  // Connect WebSocket
  useWebSocket(projectId);

  // Acquire lock on mount, release on unmount
  useEffect(() => {
    if (!lock) {
      acquireLock.mutate({ lockedBy: 'Tech Lead', reason: `Editing ${fileName}` });
    }

    return () => {
      releaseLock.mutate();
    };
  }, []);

  const handleSave = async (content: string) => {
    await updateDoc.mutateAsync(content);
    setEditorDirty(false);
  };

  const handlePush = async () => {
    await pushDoc.mutateAsync();
  };

  const handleSelectDoc = (newFileName: string) => {
    router.push(`/editor/${projectId}/${encodeURIComponent(newFileName)}`);
  };

  if (isLoading || !doc) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-900 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold">{project?.name}</h1>
            <p className="text-xs text-slate-400">{fileName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
          <span className="text-sm text-slate-300 font-mono">{fileName}</span>
          {editorDirty && (
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Modified" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success">Editing</Badge>

          <Button variant="outline" size="sm" onClick={() => handleSave(doc.content)}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <Button size="sm" onClick={handlePush}>
            <Upload className="w-4 h-4 mr-2" />
            Push
          </Button>

          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree */}
        <FileTree
          docs={docs || []}
          activeDoc={fileName}
          onSelect={handleSelectDoc}
        />

        {/* Editor + Preview split */}
        <div className="flex-1 flex">
          <div className="flex-1 border-r border-slate-700">
            <MonacoEditor
              initialContent={doc.content}
              onSave={handleSave}
              onAutoSave={handleSave}
            />
          </div>
          <div className="w-[45%] flex flex-col bg-slate-900">
            <div className="h-9 bg-slate-850 border-b border-slate-700 flex items-center px-4">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Preview
              </span>
            </div>
            <MarkdownPreview content={doc.content} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Verification Steps

```bash
# Start backend (in separate terminal)
cd apps/backend && pnpm dev

# Start frontend
cd apps/frontend && pnpm dev

# Test flows
# 1. Navigate to http://localhost:3000/projects
# 2. Verify project cards render
# 3. Click "Open Editor" on unlocked project
# 4. Verify Monaco editor loads
# 5. Make changes and press Ctrl+S
```

## Success Criteria

- [ ] Projects page lists all projects with lock status
- [ ] Lock banner shows for locked projects
- [ ] Project cards link to editor
- [ ] Monaco editor loads markdown content
- [ ] Ctrl+S saves content
- [ ] Push button triggers GitHub push
- [ ] File tree allows switching docs
- [ ] WebSocket reconnects on disconnect

---

## Conflict Prevention

This phase owns:
- `app/(dashboard)/` directory
- `components/` feature components (NOT ui/)
- `hooks/` directory

Phase 03 owns:
- `components/ui/` (base components)
- `lib/` (utilities, api)
- `stores/` (Zustand)
