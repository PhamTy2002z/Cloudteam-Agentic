# Scout Report: Apps Directory Structure & Technologies
**Date:** 2026-01-03 21:55  
**Scope:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/`  
**Focus:** Directory structure, technologies, configurations, entry points, code organization patterns

---

## Executive Summary

Monorepo with 2 main applications:
- **Backend:** NestJS 10.3.0 + PostgreSQL + Prisma + Socket.io
- **Frontend:** Next.js 14.2.0 + React 18 + Tailwind CSS + Shadcn/ui

Both use TypeScript 5.4.0. Modular architecture with clear separation of concerns.

---

## 1. Directory Structure

```
apps/
├── backend/                    # NestJS API Server (Port 3001)
│   ├── src/
│   │   ├── app.module.ts      # Root module (imports 8 feature modules)
│   │   ├── main.ts            # Entry point
│   │   ├── common/            # Shared utilities (filters, guards, decorators, crypto)
│   │   ├── docs/              # Document management module
│   │   ├── github/            # GitHub integration (Octokit)
│   │   ├── hook/              # Webhook handlers
│   │   ├── lock/              # Distributed lock management
│   │   ├── projects/          # Project CRUD operations
│   │   ├── prisma/            # Database abstraction layer
│   │   └── websocket/         # Real-time communication (Socket.io)
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (4 models: Project, Doc, Lock, ApiKey)
│   ├── test/                  # E2E tests
│   ├── coverage/              # Test coverage reports
│   ├── dist/                  # Compiled output
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
└── frontend/                   # Next.js Web Application (Port 3000)
    ├── app/                   # App Router pages
    │   ├── page.tsx           # Home page
    │   └── (dashboard)/       # Dashboard layout group
    │       ├── projects/      # Projects listing
    │       ├── editor/        # Document editor
    │       └── settings/      # Project settings
    ├── components/            # React components (12 files)
    │   ├── ui/                # Shadcn/ui components (7 files)
    │   ├── project-card.tsx
    │   ├── sidebar.tsx
    │   ├── header.tsx
    │   ├── monaco-editor.tsx
    │   ├── file-tree.tsx
    │   ├── lock-status.tsx
    │   ├── lock-banner.tsx
    │   ├── markdown-preview.tsx
    │   └── create-project-dialog.tsx
    ├── hooks/                 # Custom React hooks (4 files)
    ├── lib/                   # Utilities (4 files)
    ├── stores/                # State management (1 file: ui-store.ts)
    ├── types/                 # TypeScript types (1 file)
    ├── __tests__/             # Component tests (3 files)
    ├── .next/                 # Build output
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── vitest.config.ts
    ├── postcss.config.js
    └── components.json
```

---

## 2. Backend (NestJS)

### Technology Stack
| Component | Version | Purpose |
|-----------|---------|---------|
| NestJS | 10.3.0 | Framework |
| TypeScript | 5.4.0 | Language |
| PostgreSQL | - | Database |
| Prisma | 5.10.0 | ORM |
| Socket.io | 4.8.3 | Real-time |
| Octokit | 20.0.0 | GitHub API |
| Jest | 29.7.0 | Testing |
| Supertest | 7.1.4 | HTTP testing |

### Entry Point
**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/backend/src/main.ts`

```typescript
// Bootstraps on port 3001 (configurable via PORT env)
// Enables CORS with frontend URL
// Sets global API prefix /api
// Applies global validation pipe & exception filter
```

### Core Modules (8 total)

| Module | Location | Purpose | Key Files |
|--------|----------|---------|-----------|
| **Projects** | `src/projects/` | Project CRUD | controller, service, DTOs, specs |
| **Docs** | `src/docs/` | Document management | controller, service, DTO, specs |
| **Lock** | `src/lock/` | Distributed locking | controller, service, DTOs, specs |
| **GitHub** | `src/github/` | GitHub integration | service, specs |
| **Hook** | `src/hook/` | Webhook handlers | controller, service |
| **WebSocket** | `src/websocket/` | Real-time comms | gateway |
| **Common** | `src/common/` | Shared utilities | filters, guards, decorators, crypto |
| **Prisma** | `src/prisma/` | Database layer | service, module |

### Database Schema
**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/backend/prisma/schema.prisma`

**4 Models:**
- **Project** - Core entity (id, name, repoUrl, token, branch, docsPath, timestamps)
- **Doc** - Document files (id, projectId, fileName, content, hash, version, timestamps)
- **Lock** - Distributed locks (id, projectId, lockedBy, lockedAt, expiresAt, reason)
- **ApiKey** - API authentication (id, projectId, key, name, isActive, createdAt)

### Configuration Files
- **tsconfig.json** - CommonJS, Node resolution, decorators enabled
- **nest-cli.json** - NestJS CLI config, deleteOutDir enabled
- **package.json** - Scripts: dev, build, start, lint, test, test:watch, test:e2e

### Code Organization Pattern
- **Modular architecture:** Each feature is self-contained module
- **Service layer:** Business logic in `.service.ts`
- **Controllers:** HTTP endpoints in `.controller.ts`
- **DTOs:** Data validation with class-validator
- **Testing:** Spec files co-located (`*.spec.ts`)
- **Dependency injection:** NestJS DI container

---

## 3. Frontend (Next.js 14)

### Technology Stack
| Component | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2.0 | Framework (App Router) |
| React | 18.2.0 | UI library |
| TypeScript | 5.4.0 | Language |
| Tailwind CSS | 3.4.1 | Styling |
| Shadcn/ui | - | UI components (Radix UI) |
| Zustand | 4.5.0 | State management |
| React Query | 5.28.0 | Data fetching |
| Monaco Editor | 4.6.0 | Code editor |
| Vitest | 4.0.16 | Unit testing |
| Testing Library | 16.3.1 | Component testing |

### Entry Points

**Root Layout:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/layout.tsx`
- Global layout wrapper
- Providers setup (React Query, Zustand)

**Home Page:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/page.tsx`

### Page Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home/landing |
| `/dashboard/projects` | `app/(dashboard)/projects/page.tsx` | Projects list |
| `/dashboard/projects/[id]` | `app/(dashboard)/projects/[id]/page.tsx` | Project detail |
| `/dashboard/projects/[id]/settings` | `app/(dashboard)/projects/[id]/settings/page.tsx` | Project settings |
| `/dashboard/editor/[projectId]/[docId]` | `app/(dashboard)/editor/[projectId]/[docId]/page.tsx` | Document editor |

### Components (12 feature + 7 UI)

**Feature Components:**
- `project-card.tsx` - Project display card
- `create-project-dialog.tsx` - Project creation modal
- `sidebar.tsx` - Navigation sidebar
- `header.tsx` - Top header bar
- `monaco-editor.tsx` - Code editor wrapper
- `file-tree.tsx` - File browser
- `markdown-preview.tsx` - Markdown renderer
- `lock-status.tsx` - Lock status indicator
- `lock-banner.tsx` - Lock notification banner

**UI Components (Shadcn/ui):**
- `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`, `skeleton.tsx`, `dialog.tsx`

### Custom Hooks (4 files)

**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/hooks/`

- `use-projects.ts` - Project data fetching & mutations
- `use-docs.ts` - Document operations
- `use-lock.ts` - Lock management
- `use-websocket.ts` - WebSocket connection

### Utilities & Libraries (4 files)

**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/lib/`

- `api.ts` - HTTP client for backend communication
- `query-client.ts` - React Query setup
- `providers.tsx` - App-level providers
- `utils.ts` - Helper functions

### State Management

**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/stores/ui-store.ts`
- Zustand store for UI state

### Types

**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/types/index.ts`
- TypeScript type definitions

### Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | ESNext, bundler resolution, Next.js plugin |
| `tailwind.config.ts` | Dark mode, custom colors (brand cyan, dark variants) |
| `next.config.js` | API rewrites to backend (localhost:3001) |
| `vitest.config.ts` | Unit test configuration |
| `postcss.config.js` | PostCSS setup |
| `components.json` | Shadcn/ui configuration |

### Testing

**Test Directory:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/__tests__/`

- `setup.tsx` - Test environment setup
- `components/project-card.test.tsx` - Project card tests
- `components/lock-status.test.tsx` - Lock status tests

### Code Organization Pattern
- **App Router:** File-based routing with layout groups
- **Component composition:** Reusable UI components
- **Custom hooks:** Data fetching logic
- **Utility functions:** Shared logic in `lib/`
- **State management:** Zustand for UI state
- **Type safety:** TypeScript throughout
- **Testing:** Vitest with React Testing Library

---

## 4. Key Configuration Files Summary

### Backend
| File | Path | Purpose |
|------|------|---------|
| package.json | `apps/backend/package.json` | Dependencies, scripts |
| tsconfig.json | `apps/backend/tsconfig.json` | TypeScript (CommonJS, decorators) |
| nest-cli.json | `apps/backend/nest-cli.json` | NestJS CLI config |
| schema.prisma | `apps/backend/prisma/schema.prisma` | Database schema |

### Frontend
| File | Path | Purpose |
|------|------|---------|
| package.json | `apps/frontend/package.json` | Dependencies, scripts |
| tsconfig.json | `apps/frontend/tsconfig.json` | TypeScript (ESNext, Next.js) |
| next.config.js | `apps/frontend/next.config.js` | Next.js config (API rewrites) |
| tailwind.config.ts | `apps/frontend/tailwind.config.ts` | Tailwind CSS theming |
| vitest.config.ts | `apps/frontend/vitest.config.ts` | Unit test config |
| components.json | `apps/frontend/components.json` | Shadcn/ui setup |

---

## 5. Technology Summary

### Backend Stack
- **Runtime:** Node.js
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Real-time:** Socket.io
- **Testing:** Jest + Supertest
- **API:** REST + WebSocket

### Frontend Stack
- **Runtime:** Browser (Node.js for build)
- **Framework:** Next.js 14 (React 18)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui (Radix UI)
- **State:** Zustand
- **Data Fetching:** React Query
- **Testing:** Vitest + React Testing Library
- **Editor:** Monaco Editor

---

## 6. Entry Points & Main Modules

### Backend Entry Point
- **File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/backend/src/main.ts`
- **Port:** 3001 (default)
- **API Prefix:** `/api`

### Frontend Entry Point
- **File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/layout.tsx`
- **Port:** 3000 (default)
- **Router:** App Router (Next.js 14)

### Main Modules
**Backend:** ProjectsModule, DocsModule, LockModule, GitHubModule, HookModule, WebSocketModule, PrismaModule, CryptoModule

**Frontend:** Pages (app/), Components, Hooks, Stores, Types, Lib utilities

---

## 7. File Count Summary

| Category | Count |
|----------|-------|
| Backend TypeScript files | 35+ |
| Frontend TypeScript/TSX files | 45+ |
| Configuration files | 8 |
| Test files | 8+ |
| UI Components | 9 |
| Custom Hooks | 4 |
| **Total Source Files** | **~100+** |

---

## 8. Code Organization Patterns

### Backend Patterns
- **Modular architecture:** Each feature (projects, docs, lock) is self-contained module
- **Service layer:** Business logic separated in `.service.ts` files
- **Controllers:** HTTP endpoints in `.controller.ts` files
- **DTOs:** Data validation with class-validator
- **Testing:** Spec files co-located with source (`*.spec.ts`)
- **Dependency injection:** NestJS DI container

### Frontend Patterns
- **App Router:** File-based routing with layout groups
- **Component composition:** Reusable UI components in `components/`
- **Custom hooks:** Data fetching logic in `hooks/`
- **Utility functions:** Shared logic in `lib/`
- **State management:** Zustand for UI state
- **Type safety:** TypeScript throughout
- **Testing:** Vitest with React Testing Library

---

## Unresolved Questions

None. Scout report complete.
