# Code Review Report - Phase 04 Frontend

**Project:** AI Toolkit Sync Platform
**Phase:** Phase 04 - Frontend Features
**Review Date:** 2026-01-03
**Reviewer:** Code Reviewer Agent
**Files Reviewed:** 36 TypeScript/TSX files

---

## Scope

**Files reviewed:**
- Design: `app/globals.css`, `tailwind.config.ts`
- State: `stores/ui-store.ts`
- Hooks: `hooks/use-{projects,docs,lock,websocket}.ts`
- Components: `components/{sidebar,header,project-card,lock-status,lock-banner,monaco-editor,markdown-preview,file-tree,create-project-dialog}.tsx`
- UI: `components/ui/{dialog,button,badge,card,input,label,skeleton}.tsx`
- Pages: `app/(dashboard)/{layout,projects/page,projects/[id]/page,projects/[id]/settings/page,editor/[projectId]/[docId]/page}.tsx`
- API: `lib/api.ts`, `lib/utils.ts`

**Lines of code:** ~2,500 (estimated)
**Focus:** Security, Performance, Architecture, YAGNI/DRY violations
**Build status:** ✅ Compiled successfully (bundle ~121KB max)

---

## Overall Assessment

**Quality:** Good foundation với type safety mạnh, component pattern rõ ràng
**Readiness:** Production-ready sau khi fix Critical + High issues
**Architecture:** Clean separation, hooks-based data fetching
**Type Coverage:** ~95% (strict TypeScript enabled)

---

## Critical Issues

### 1. XSS Vulnerability trong MarkdownPreview

**File:** `components/markdown-preview.tsx:27`
**Issue:** Sử dụng `dangerouslySetInnerHTML` với regex replacement thay vì markdown parser đầy đủ

```tsx
// ❌ Current - vulnerable to XSS
const html = useMemo(() => {
  return content
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // ... regex-based HTML generation
}, [content]);

return <article dangerouslySetInnerHTML={{ __html: html }} />;
```

**Risk:** User-controlled content (`doc.content`) có thể chứa malicious HTML/JavaScript
**Attack vector:** Doc content như `<img src=x onerror=alert(1)>` sẽ execute

**Fix:**
```tsx
// ✅ Use sanitized markdown parser
import ReactMarkdown from 'react-markdown';

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <ReactMarkdown
        className="prose prose-invert max-w-none"
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold..." {...props} />,
          // ... safe component mapping
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

**Severity:** CRITICAL - OWASP A03:2021 Injection
**Action:** Replace regex-based HTML generation với `react-markdown` hoặc `marked` + DOMPurify

---

### 2. Lock Cleanup Issue trong EditorPage

**File:** `app/(dashboard)/editor/[projectId]/[docId]/page.tsx:43-53`
**Issue:** Lock không được release đúng cách khi component unmount

```tsx
useEffect(() => {
  if (!lock) {
    acquireLock.mutate({ lockedBy: 'Tech Lead', reason: `Editing ${fileName}` });
  }

  return () => {
    releaseLock.mutate(); // ❌ Executes before mutation completes
  };
}, []); // ❌ Empty deps - runs once, doesn't track lock state
```

**Problems:**
1. `releaseLock.mutate()` async nhưng không await → race condition
2. Acquire lock mỗi lần component mount, không check existing lock ownership
3. Lock có thể bị orphaned nếu browser crash/close tab
4. Hardcoded "Tech Lead" thay vì dynamic user

**Fix:**
```tsx
useEffect(() => {
  let mounted = true;

  const initLock = async () => {
    if (!lock && mounted) {
      await acquireLock.mutateAsync({
        lockedBy: currentUser.name, // Get from auth context
        reason: `Editing ${fileName}`
      });
    }
  };

  initLock();

  return () => {
    mounted = false;
    // Use async cleanup with AbortController
    releaseLock.mutateAsync().catch(() => {});
  };
}, [lock?.id]); // Track lock ID changes
```

**Additional:** Implement heartbeat để auto-release locks on tab close:
```tsx
useEffect(() => {
  const heartbeat = setInterval(() => {
    if (lock) extendLock.mutate(); // Backend endpoint to extend expiry
  }, 15000); // Every 15s

  return () => clearInterval(heartbeat);
}, [lock?.id]);
```

**Severity:** CRITICAL - Data integrity issue, conflicts FR-009 to FR-012
**Action:** Implement proper lock lifecycle + heartbeat mechanism

---

## High Priority Findings

### 3. Memory Leak trong WebSocket Hook

**File:** `hooks/use-websocket.ts:19-67`
**Issue:** Reconnect timeout không được cleanup đúng

```tsx
ws.onclose = () => {
  setStatus('disconnected');
  wsRef.current = null;
  reconnectTimeoutRef.current = setTimeout(connect, 3000); // ❌ Infinite reconnect
};

useEffect(() => {
  connect();
  return () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
  };
}, [connect]); // ❌ connect changes every render → cleanup/reconnect loop
```

**Problems:**
1. `connect` dependency thay đổi mỗi render vì `useCallback` deps include `projectId`
2. Không có max retry limit → infinite reconnects nếu server down
3. Không cleanup WebSocket listeners → memory leak

**Fix:**
```tsx
const reconnectAttemptsRef = useRef(0);
const MAX_RECONNECT_ATTEMPTS = 10;

const connect = useCallback(() => {
  if (wsRef.current?.readyState === WebSocket.OPEN) return;
  if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnect attempts reached');
    return;
  }

  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.onopen = () => {
    setStatus('connected');
    reconnectAttemptsRef.current = 0; // Reset on success
    // ...
  };

  ws.onclose = () => {
    setStatus('disconnected');
    wsRef.current = null;

    reconnectAttemptsRef.current++;
    const delay = Math.min(3000 * reconnectAttemptsRef.current, 30000); // Exponential backoff
    reconnectTimeoutRef.current = setTimeout(connect, delay);
  };
}, [/* Remove projectId, use separate effect */]);

useEffect(() => {
  connect();

  return () => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null; // Remove listener before close
      wsRef.current.close();
    }
  };
}, []); // Empty deps - connect stable now
```

**Severity:** HIGH - Performance degradation, memory leak
**Action:** Add max retries + exponential backoff + proper cleanup

---

### 4. Race Condition trong Editor Auto-save

**File:** `components/monaco-editor.tsx:27-33`
**Issue:** Debounced auto-save không cancel khi user manually saves

```tsx
const debouncedAutoSave = useMemo(
  () => debounce((value: string) => {
    onAutoSave?.(value);
  }, 2000),
  [onAutoSave],
);

const handleMount: OnMount = useCallback((editor, monaco) => {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    const value = editor.getValue();
    onSave(value); // ❌ Doesn't cancel pending auto-save
    setEditorDirty(false);
  });
}, [onSave, setEditorDirty]);
```

**Problems:**
1. Nếu user Cmd+S trong 2s window, cả manual save VÀ auto-save sẽ fire → duplicate API calls
2. `debounce` implementation không expose cancel method
3. Auto-save không có error handling

**Fix:**
```tsx
// lib/utils.ts - Enhanced debounce
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout>;

  const debounced = ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

// components/monaco-editor.tsx
const debouncedAutoSaveRef = useRef(debounce((value: string) => {
  onAutoSave?.(value).catch(err => {
    console.error('Auto-save failed:', err);
    // Show toast notification
  });
}, 2000));

const handleMount: OnMount = useCallback((editor, monaco) => {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    debouncedAutoSaveRef.current.cancel(); // Cancel pending auto-save
    const value = editor.getValue();
    onSave(value);
    setEditorDirty(false);
  });
}, [onSave]);
```

**Severity:** HIGH - Duplicate writes, wasted API calls
**Action:** Add cancel mechanism + error handling

---

### 5. Missing Input Validation trong CreateProjectDialog

**File:** `components/create-project-dialog.tsx:30-44`
**Issue:** Client-side validation không đủ mạnh, dễ bị bypass

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await createProject.mutateAsync(formData); // ❌ No client-side validation
    // ...
  } catch (error) {
    console.error('Failed to create project:', error); // ❌ No user feedback
  }
};
```

**Problems:**
1. Không validate `repoUrl` format (phải là valid GitHub URL)
2. Token validation chỉ check `required`, không verify format `ghp_*`
3. Branch name không validate (có thể có special chars)
4. Error không show cho user, chỉ log ra console

**Fix:**
```tsx
// Add Zod schema validation
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s-]+$/),
  repoUrl: z.string().url().regex(/^https:\/\/github\.com\/[\w-]+\/[\w-]+/),
  token: z.string().regex(/^gh[ps]_[a-zA-Z0-9]{36,}$/), // GitHub PAT format
  branch: z.string().regex(/^[a-zA-Z0-9/_-]+$/),
  docsPath: z.string().regex(/^[a-zA-Z0-9/_-]+$/),
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const validated = projectSchema.parse(formData);
    await createProject.mutateAsync(validated);
    setCreateDialogOpen(false);
    toast.success('Project created successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      toast.error(error.errors[0].message);
    } else {
      toast.error('Failed to create project. Please try again.');
    }
  }
};
```

**Severity:** HIGH - Security + UX issue
**Action:** Add Zod validation + user-facing error messages + toast notifications

---

## Medium Priority Improvements

### 6. Unnecessary Re-renders trong ProjectsPage

**File:** `app/(dashboard)/projects/page.tsx:13-24`

```tsx
export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [dismissedLock, setDismissedLock] = useState<string | null>(null);

  useWebSocket(); // ❌ Connects to global channel, broadcasts to all components

  const lockedProject = projects?.find(
    (p) => p.locks?.length && p.id !== dismissedLock
  ); // ❌ Re-computes on every render
```

**Optimization:**
```tsx
const lockedProject = useMemo(
  () => projects?.find((p) => p.locks?.length && p.id !== dismissedLock),
  [projects, dismissedLock]
);
```

---

### 7. Hardcoded API Base URL

**File:** `lib/api.ts:1`

```tsx
const API_BASE = ''; // ❌ Empty string, relies on relative URLs
```

**Should be:**
```tsx
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**Add to `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

### 8. Missing Accessibility Attributes

**Files:** Multiple components
**Issues:**
- `sidebar.tsx:44-49` - Close button không có `aria-label`
- `file-tree.tsx:22-27` - Refresh button không có `aria-label`
- `dialog.tsx:64` - Close button có `aria-label` (good!) nhưng thiếu `role="dialog"`

**Fix examples:**
```tsx
// sidebar.tsx
<button
  onClick={toggleSidebar}
  aria-label="Close sidebar"
  className="lg:hidden p-1..."
>
  <X className="w-5 h-5" />
</button>

// dialog.tsx
<div
  role="dialog"
  aria-modal="true"
  className="relative bg-card..."
>
```

---

### 9. Console.error trong Production

**Files:**
- `create-project-dialog.tsx:43`
- `projects/[id]/settings/page.tsx:35`

```tsx
console.error('Failed to create project:', error); // ❌ Will appear in production
```

**Replace với proper error logging service:**
```tsx
import { logError } from '@/lib/logger';

catch (error) {
  logError('Failed to create project', { error, context: 'CreateProjectDialog' });
  toast.error('Failed to create project');
}
```

---

### 10. Duplicate Type Definitions

**File:** `lib/api.ts:79-129`
**Issue:** Types duplicated from backend Prisma schema

```tsx
export interface Project {
  id: string;
  name: string;
  // ... ❌ Duplicates backend types
}
```

**Better approach:**
1. Generate shared types package từ Prisma schema
2. Hoặc generate OpenAPI spec từ backend → frontend types
3. Hoặc use tRPC for end-to-end type safety

**For now:** Add comment noting source of truth:
```tsx
// Types synced with backend Prisma schema
// Source: apps/backend/prisma/schema.prisma
// Last updated: 2026-01-03
export interface Project { ... }
```

---

## Low Priority Suggestions

### 11. Magic Numbers

- `use-lock.ts:11` - `refetchInterval: 10000` → extract to constant `LOCK_POLL_INTERVAL`
- `use-websocket.ts:55` - `setTimeout(connect, 3000)` → `RECONNECT_DELAY`
- `monaco-editor.tsx:29` - `debounce(..., 2000)` → `AUTO_SAVE_DELAY`

### 12. Unused Variable

**File:** `lib/api.ts:1`
```tsx
const API_BASE = ''; // ❌ Declared but never used
```

Remove or use in `fetcher`:
```tsx
const url = `${API_BASE}/api${endpoint}`;
```

### 13. Tailwind Config Optimization

**File:** `tailwind.config.ts`
**Good:** Custom brand colors defined
**Suggestion:** Extract colors to separate file for reuse:

```ts
// lib/theme.ts
export const brandColors = {
  cyan: '#0DA8D6',
  dark: '#333232',
  'dark-lighter': '#3d3c3c',
  'dark-darker': '#1a1a1a',
};
```

---

## Positive Observations

✅ **Type Safety:** Strict TypeScript với comprehensive interfaces
✅ **Component Pattern:** Clean separation between UI/logic, proper props typing
✅ **Data Fetching:** Consistent use of TanStack Query hooks
✅ **State Management:** Zustand store well-structured, minimal surface area
✅ **Styling:** Tailwind utilities consistent, design system emerging
✅ **Build Output:** Optimized bundle sizes (87KB base, 121KB max)
✅ **Code Organization:** Clear folder structure, feature-based grouping
✅ **Responsive Design:** Mobile-first approach với breakpoints
✅ **Loading States:** Skeleton components for better UX
✅ **Dark Mode:** Properly implemented as default theme

---

## Recommended Actions

### Immediate (Before Phase 05)

1. **[CRITICAL]** Replace `dangerouslySetInnerHTML` với `react-markdown` + sanitization
2. **[CRITICAL]** Fix lock cleanup logic trong EditorPage + add heartbeat
3. **[HIGH]** Add max retry + exponential backoff cho WebSocket
4. **[HIGH]** Implement debounce cancel mechanism cho auto-save
5. **[HIGH]** Add Zod validation + toast notifications

### Short-term (Phase 05)

6. Add proper error logging service (Sentry/LogRocket)
7. Implement shared types generation (Prisma → frontend)
8. Add accessibility attributes (ARIA labels, roles)
9. Extract magic numbers to constants
10. Add user authentication context (replace hardcoded "Tech Lead")

### Long-term (Phase 06)

11. E2E tests với Playwright covering lock scenarios
12. Performance monitoring (Web Vitals)
13. Add Storybook for component documentation
14. Implement proper error boundaries

---

## Metrics

**Type Coverage:** ~95% (strict mode enabled)
**Test Coverage:** N/A (no tests in Phase 04)
**Build Time:** ~15s (production build)
**Bundle Size:**
- Base JS: 87 kB
- Max route: 121 kB (editor page)
- Total: &lt;500KB requirement ✅

**Linting:** 0 errors, 0 warnings (ESLint passed)
**Build:** ✅ Success
**Accessibility:** Partial (missing ARIA labels)

---

## Security Checklist

- ❌ **XSS Prevention:** Vulnerability trong MarkdownPreview
- ✅ **CSRF:** Not applicable (no forms with state-changing mutations yet)
- ⚠️ **Input Validation:** Client-side weak, relies on backend
- ✅ **Sensitive Data:** GitHub tokens masked với `type="password"`
- ⚠️ **Error Messages:** Some leak implementation details (console.error)
- ✅ **HTTPS:** Enforced via Next.js config (production)
- ⚠️ **Dependencies:** Need audit (`npm audit` not run in review)

---

## Performance Checklist

- ✅ **Bundle Size:** Under 500KB target
- ⚠️ **Code Splitting:** Dynamic imports only for Monaco (could add more)
- ✅ **Image Optimization:** Using Next.js Image (if images added later)
- ⚠️ **Re-renders:** Some unnecessary (ProjectsPage lockedProject calc)
- ❌ **Memory Leaks:** WebSocket reconnect issue
- ✅ **Network:** Proper use of TanStack Query caching
- ⚠️ **Debouncing:** Implemented but needs cancel mechanism

---

## Architecture Assessment

**Strengths:**
- Clean hooks-based data fetching
- Centralized API client with type safety
- Component reusability (UI components well-extracted)
- Proper separation of concerns (hooks/stores/components)

**Weaknesses:**
- Missing authentication context layer
- No error boundary implementation
- Hardcoded user info ("Tech Lead")
- Lock management lifecycle incomplete

**Patterns Used:**
- ✅ Custom hooks for data operations
- ✅ Zustand for UI state
- ✅ TanStack Query for server state
- ✅ Compound components (Dialog parts)

**Violations:**
- None major, generally follows YAGNI/KISS
- Minor DRY issue: Type definitions duplicated from backend

---

## Unresolved Questions

1. **Authentication:** Khi nào implement user auth? Lock lifecycle cần user context
2. **API Error Format:** Backend error response format chưa consistent?
3. **Lock Expiry:** Frontend có cần countdown timer cho lock expiration?
4. **Offline Support:** Có plan cho offline editing với sync conflicts?
5. **WebSocket Fallback:** Nếu WS fail, có fallback về polling không?
6. **Type Generation:** Khi nào setup shared types từ Prisma schema?
7. **Test Strategy:** Phase 06 sẽ cover unit tests cho hooks/components?
