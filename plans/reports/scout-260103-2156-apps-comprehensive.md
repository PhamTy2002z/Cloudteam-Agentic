# Scout Report: Apps Directory - Comprehensive Analysis
**Date:** 2026-01-03 21:56  
**Scope:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/`  
**Focus:** Complete directory structure, technologies, configurations, entry points, code organization

---

## Executive Summary

Monorepo containing 2 production applications:

| App | Framework | Language | Port | Purpose |
|-----|-----------|----------|------|---------|
| **Backend** | NestJS 10.3.0 | TypeScript 5.4.0 | 3001 | REST API + WebSocket |
| **Frontend** | Next.js 14.2.0 | TypeScript 5.4.0 | 3000 | Web UI (App Router) |

**Database:** PostgreSQL + Prisma ORM  
**Real-time:** Socket.io  
**UI:** Shadcn/ui + Tailwind CSS  
**State:** Zustand + React Query  
**Testing:** Jest (backend), Vitest (frontend)

---

## 1. Directory Structure (Complete)

```
apps/
├── backend/                           # NestJS API Server
│   ├── src/
│   │   ├── app.module.ts             # Root module (8 feature modules)
│   │   ├── main.ts                   # Entry point (port 3001)
│   │   ├── common/                   # Shared utilities
│   │   │   ├── filters/
│   │   │   │   └── global-exception.filter.ts
│   │   │   ├── guards/
│   │   │   │   └── api-key.guard.ts
│   │   │   ├── decorators/
│   │   │   │   └── api-key.decorator.ts
│   │   │   └── services/
│   │   │       ├── crypto.service.ts
│   │   │       └── crypto.module.ts
│   │   ├── docs/                     # Document management
│   │   │   ├── docs.controller.ts
│   │   │   ├── docs.service.ts
│   │   │   ├── docs.module.ts
│   │   │   ├── dto/
│   │   │   │   └── update-doc.dto.ts
│   │   │   ├── docs.controller.spec.ts
│   │   │   └── docs.service.spec.ts
│   │   ├── github/                   # GitHub integration
│   │   │   ├── github.service.ts
│   │   │   ├── github.module.ts
│   │   │   └── github.service.spec.ts
│   │   ├── hook/                     # Webhook handlers
│   │   │   ├── hook.controller.ts
│   │   │   ├── hook.service.ts
│   │   │   └── hook.module.ts
│   │   ├── lock/                     # Distributed locking
│   │   │   ├── lock.controller.ts
│   │   │   ├── lock.service.ts
│   │   │   ├── lock.module.ts
│   │   │   ├── dto/
│   │   │   │   ├── acquire-lock.dto.ts
│   │   │   │   └── extend-lock.dto.ts
│   │   │   ├── lock.controller.spec.ts
│   │   │   └── lock.service.spec.ts
│   │   ├── projects/                 # Project management
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── projects.module.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-project.dto.ts
│   │   │   │   └── update-project.dto.ts
│   │   │   ├── projects.controller.spec.ts
│   │   │   └── projects.service.spec.ts
│   │   ├── prisma/                   # Database layer
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   └── websocket/                # Real-time communication
│   │       ├── websocket.gateway.ts
│   │       └── websocket.module.ts
│   ├── prisma/
│   │   └── schema.prisma             # Database schema
│   ├── test/
│   │   └── jest-e2e.json
│   ├── coverage/                     # Test coverage reports
│   ├── dist/                         # Compiled output
│   ├── plans/                        # Planning docs
│   ├── docs/                         # Module documentation
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── node_modules/
│
└── frontend/                          # Next.js Web Application
    ├── app/                          # App Router pages
    │   ├── page.tsx                  # Home page
    │   ├── layout.tsx                # Root layout
    │   ├── globals.css               # Global styles
    │   └── (dashboard)/              # Dashboard layout group
    │       ├── layout.tsx
    │       ├── projects/
    │       │   ├── page.tsx          # Projects list
    │       │   ├── loading.tsx
    │       │   └── [id]/
    │       │       ├── page.tsx      # Project detail
    │       │       └── settings/
    │       │           └── page.tsx  # Project settings
    │       └── editor/
    │           └── [projectId]/
    │               └── [docId]/
    │                   └── page.tsx  # Document editor
    ├── components/                   # React components
    │   ├── ui/                       # Shadcn/ui components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── badge.tsx
    │   │   ├── skeleton.tsx
    │   │   └── dialog.tsx
    │   ├── project-card.tsx
    │   ├── create-project-dialog.tsx
    │   ├── sidebar.tsx
    │   ├── header.tsx
    │   ├── monaco-editor.tsx
    │   ├── file-tree.tsx
    │   ├── markdown-preview.tsx
    │   ├── lock-status.tsx
    │   └── lock-banner.tsx
    ├── hooks/                        # Custom React hooks
    │   ├── use-projects.ts
    │   ├── use-docs.ts
    │   ├── use-lock.ts
    │   └── use-websocket.ts
    ├── lib/                          # Utilities
    │   ├── api.ts                    # HTTP client
    │   ├── query-client.ts           # React Query setup
    │   ├── providers.tsx             # App providers
    │   └── utils.ts                  # Helper functions
    ├── stores/                       # State management
    │   └── ui-store.ts               # Zustand store
    ├── types/                        # TypeScript types
    │   └── index.ts
    ├── __tests__/                    # Component tests
    │   ├── setup.tsx
    │   └── components/
    │       ├── project-card.test.tsx
    │       └── lock-status.test.tsx
    ├── .next/                        # Build output
    ├── plans/                        # Planning docs
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── vitest.config.ts
    ├── postcss.config.js
    ├── components.json
    └── node_modules/
```

---

## 2. Backend (NestJS 10.3.0)

### Technology Stack
```
Framework:      NestJS 10.3.0
Language:       TypeScript 5.4.0
Database:       PostgreSQL + Prisma 5.10.0
Real-time:      Socket.io 4.8.3
Git API:        Octokit 20.0.0
Testing:        Jest 29.7.0 + Supertest 7.1.4
Validation:     class-validator 0.14.1 + class-transformer 0.5.1
```

### Entry Point
**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/backend/src/main.ts`

```typescript
// Bootstraps NestJS application
// Port: 3001 (configurable via PORT env var)
// CORS: Enabled with frontend URL
// API Prefix: /api
// Global Pipes: ValidationPipe (transform, whitelist, forbidNonWhitelisted)
// Global Filters: GlobalExceptionFilter
```

### Core Modules (8 total)

#### 1. Projects Module
**Location:** `apps/backend/src/projects/`
- **Controller:** `projects.controller.ts` - HTTP endpoints
- **Service:** `projects.service.ts` - Business logic
- **DTOs:** `create-project.dto.ts`, `update-project.dto.ts`
- **Tests:** `projects.controller.spec.ts`, `projects.service.spec.ts`
- **Purpose:** Project CRUD operations

#### 2. Docs Module
**Location:** `apps/backend/src/docs/`
- **Controller:** `docs.controller.ts`
- **Service:** `docs.service.ts`
- **DTO:** `update-doc.dto.ts`
- **Tests:** `docs.controller.spec.ts`, `docs.service.spec.ts`
- **Purpose:** Document management

#### 3. Lock Module
**Location:** `apps/backend/src/lock/`
- **Controller:** `lock.controller.ts`
- **Service:** `lock.service.ts`
- **DTOs:** `acquire-lock.dto.ts`, `extend-lock.dto.ts`
- **Tests:** `lock.controller.spec.ts`, `lock.service.spec.ts`
- **Purpose:** Distributed locking for concurrent edits

#### 4. GitHub Module
**Location:** `apps/backend/src/github/`
- **Service:** `github.service.ts`
- **Tests:** `github.service.spec.ts`
- **Purpose:** GitHub API integration (Octokit)

#### 5. Hook Module
**Location:** `apps/backend/src/hook/`
- **Controller:** `hook.controller.ts`
- **Service:** `hook.service.ts`
- **Purpose:** Webhook handlers

#### 6. WebSocket Module
**Location:** `apps/backend/src/websocket/`
- **Gateway:** `websocket.gateway.ts`
- **Purpose:** Real-time communication (Socket.io)

#### 7. Common Module
**Location:** `apps/backend/src/common/`
- **Filters:** `global-exception.filter.ts`
- **Guards:** `api-key.guard.ts`
- **Decorators:** `api-key.decorator.ts`
- **Services:** `crypto.service.ts`, `crypto.module.ts`
- **Purpose:** Shared utilities

#### 8. Prisma Module
**Location:** `apps/backend/src/prisma/`
- **Service:** `prisma.service.ts`
- **Module:** `prisma.module.ts`
- **Purpose:** Database abstraction layer

### Database Schema
**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/backend/prisma/schema.prisma`

**4 Models:**

1. **Project**
   - Fields: id, name, repoUrl, token (encrypted), branch, docsPath, createdAt, updatedAt
   - Relations: docs (one-to-many), locks (one-to-many), apiKeys (one-to-many)

2. **Doc**
   - Fields: id, projectId, fileName, content, hash, version, createdAt, updatedAt
   - Unique: (projectId, fileName)
   - Index: projectId

3. **Lock**
   - Fields: id, projectId, lockedBy, lockedAt, expiresAt, reason
   - Unique: projectId (one lock per project)
   - Indexes: projectId, expiresAt

4. **ApiKey**
   - Fields: id, projectId, key, name, isActive, createdAt
   - Unique: key
   - Indexes: projectId, key

### Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | CommonJS, Node resolution, decorators enabled |
| `nest-cli.json` | NestJS CLI config, deleteOutDir enabled |
| `package.json` | Dependencies, scripts (dev, build, start, lint, test, test:e2e) |

### Code Organization Pattern
- **Modular architecture:** Each feature is self-contained module
- **Service layer:** Business logic in `.service.ts`
- **Controllers:** HTTP endpoints in `.controller.ts`
- **DTOs:** Data validation with class-validator
- **Testing:** Spec files co-located (`*.spec.ts`)
- **Dependency injection:** NestJS DI container

---

## 3. Frontend (Next.js 14.2.0)

### Technology Stack
```
Framework:      Next.js 14.2.0 (App Router)
Language:       TypeScript 5.4.0
UI Library:     React 18.2.0
Styling:        Tailwind CSS 3.4.1
UI Components:  Shadcn/ui (Radix UI)
State:          Zustand 4.5.0
Data Fetching:  React Query 5.28.0
Editor:         Monaco Editor 4.6.0
Testing:        Vitest 4.0.16 + Testing Library 16.3.1
Icons:          Lucide React 0.562.0
```

### Entry Points

**Root Layout:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/layout.tsx`
- Global layout wrapper
- Providers setup (React Query, Zustand)

**Home Page:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/app/page.tsx`

### Page Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home/landing page |
| `/dashboard/projects` | `app/(dashboard)/projects/page.tsx` | Projects list |
| `/dashboard/projects/[id]` | `app/(dashboard)/projects/[id]/page.tsx` | Project detail |
| `/dashboard/projects/[id]/settings` | `app/(dashboard)/projects/[id]/settings/page.tsx` | Project settings |
| `/dashboard/editor/[projectId]/[docId]` | `app/(dashboard)/editor/[projectId]/[docId]/page.tsx` | Document editor |

### Components (19 total)

**Feature Components (12):**
- `project-card.tsx` - Project display card
- `create-project-dialog.tsx` - Project creation modal
- `sidebar.tsx` - Navigation sidebar
- `header.tsx` - Top header bar
- `monaco-editor.tsx` - Code editor wrapper
- `file-tree.tsx` - File browser
- `markdown-preview.tsx` - Markdown renderer
- `lock-status.tsx` - Lock status indicator
- `lock-banner.tsx` - Lock notification banner

**UI Components (7 - Shadcn/ui):**
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `label.tsx`
- `badge.tsx`
- `skeleton.tsx`
- `dialog.tsx`

### Custom Hooks (4)

**File:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/frontend/hooks/`

- `use-projects.ts` - Project data fetching & mutations
- `use-docs.ts` - Document operations
- `use-lock.ts` - Lock management
- `use-websocket.ts` - WebSocket connection

### Utilities & Libraries (4)

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

## 4. Key Configuration Files

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

## 9. Modified Files (Current Session)

Based on git status:
- `apps/backend/src/docs/docs.service.ts` - Modified
- `apps/backend/src/hook/hook.service.ts` - Modified
- `apps/backend/src/lock/lock.service.ts` - Modified
- `apps/frontend/app/(dashboard)/editor/[projectId]/[docId]/page.tsx` - Modified
- `apps/frontend/app/(dashboard)/projects/[id]/page.tsx` - Modified
- `apps/frontend/app/(dashboard)/projects/[id]/settings/page.tsx` - Modified
- `apps/frontend/components/project-card.tsx` - Modified
- `pnpm-lock.yaml` - Modified

---

## Unresolved Questions

None. Scout report complete.
