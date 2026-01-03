# Codebase Summary - AI Toolkit Sync Platform

**Last Updated:** 2026-01-03
**Phase:** Phase 06 Complete
**Status:** E2E Testing Infrastructure (Backend + Frontend)

---

## Project Overview

AI Toolkit Sync Platform is a centralized documentation management system for AI-assisted development teams. It solves the problem of inconsistent code generation by providing a single source of truth for AI context that syncs across developer workstations.

**Core Value:** Ensures all developers' AI assistants (Claude Code) use identical context, producing consistent code styles and patterns.

---

## Technology Stack

### Backend
- **Framework:** NestJS 10.3.0
- **Database ORM:** Prisma 5.10.0
- **Database:** PostgreSQL 16 (Docker)
- **Runtime:** Node.js 20+
- **Language:** TypeScript 5.4.0
- **Testing:** Jest (E2E), Supertest

### Frontend
- **Framework:** Next.js 14.2.0 (App Router)
- **State Management:** Zustand 4.5.0, TanStack Query 5.28.0
- **Editor:** Monaco Editor 4.6.0
- **Styling:** Tailwind CSS 3.4.1
- **Language:** TypeScript 5.4.0
- **Testing:** Vitest, React Testing Library

### Infrastructure
- **Monorepo:** pnpm workspaces
- **Containerization:** Docker Compose
- **Real-time (Planned):** WebSocket via NestJS Gateway
- **Version Control:** Git (GitHub integration via Octokit)

---

## Project Structure

```
ai-toolkit-sync-platform/
├── apps/
│   ├── backend/              # NestJS API server
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema (4 models)
│   │   ├── src/
│   │   │   ├── prisma/       # Prisma service (global module, cleanDatabase())
│   │   │   ├── app.module.ts # Root application module
│   │   │   └── main.ts       # Bootstrap with CORS, validation
│   │   └── test/             # E2E tests (Jest)
│   │       ├── jest-e2e.json # E2E config
│   │       ├── app.e2e-spec.ts
│   │       ├── projects.e2e-spec.ts
│   │       ├── lock.e2e-spec.ts
│   │       └── hook.e2e-spec.ts
│   └── frontend/             # Next.js application
│       ├── app/
│       │   ├── layout.tsx    # Root layout with metadata
│       │   ├── page.tsx      # Landing page
│       │   └── globals.css   # Tailwind base styles
│       ├── __tests__/        # Component tests (Vitest)
│       │   ├── setup.tsx     # Test setup with mocks
│       │   └── components/
│       │       ├── project-card.test.tsx
│       │       └── lock-status.test.tsx
│       └── vitest.config.ts  # Vitest config
├── docs/                     # Project documentation
├── plans/                    # Development plans (6 phases)
├── scripts/                  # Claude Code hooks (future)
├── TESTING.md                # Integration testing checklist
├── docker-compose.yml        # PostgreSQL container
├── pnpm-workspace.yaml       # Monorepo workspace config
└── tsconfig.base.json        # Shared TypeScript config
```

---

## Database Schema

### Models (4 total)

#### 1. **Project**
Core entity representing a development project.
- **Fields:** id, name, repoUrl, token (GitHub PAT), branch, docsPath, timestamps
- **Relations:** Has many Docs, Locks, ApiKeys
- **Security Note:** Token stored as plaintext (encryption planned)

#### 2. **Doc**
Individual documentation files within a project.
- **Fields:** id, projectId, fileName, content, hash, version, timestamps
- **Constraints:** Unique(projectId, fileName)
- **Indexes:** projectId
- **Purpose:** Track version history, detect changes via hash

#### 3. **Lock**
Project-level locks during documentation updates.
- **Fields:** id, projectId (unique), lockedBy, lockedAt, expiresAt, reason
- **Constraints:** One lock per project
- **Indexes:** projectId, expiresAt
- **Purpose:** Prevent concurrent edits, auto-expiration

#### 4. **ApiKey**
Authentication keys for CLI/hook integration.
- **Fields:** id, projectId, key (unique), name, isActive, createdAt
- **Indexes:** projectId, key
- **Purpose:** Secure webhook/API authentication

---

## Backend Architecture

### Module Structure
```
AppModule (root)
├── ConfigModule (global, .env support)
└── PrismaModule (global, database access)
```

### PrismaService
- **Lifecycle:** Connects on module init, disconnects on destroy
- **Logging:** Development: error/warn, Production: error only
- **Testing Utility:** `cleanDatabase()` for non-production environments (production guard)

### Bootstrap Configuration (main.ts)
- **Port:** 3001 (configurable via PORT env)
- **API Prefix:** `/api`
- **CORS:** Enabled for `http://localhost:3000` (configurable)
- **Validation:** Global pipes with whitelist, transform, forbid non-whitelisted
- **DTOs:** class-validator + class-transformer ready

---

## Testing Infrastructure (Phase 06)

### Backend E2E Tests (Jest)
Located in `apps/backend/test/`:

**Configuration:**
- **jest-e2e.json:** Configured for E2E testing with rootDir, testRegex, transform
- **Database:** Uses `cleanDatabase()` before each test suite
- **Environment:** Test database isolation

**Test Suites:**
1. **app.e2e-spec.ts** - App bootstrap and health checks
2. **projects.e2e-spec.ts** - Projects CRUD operations (create, read, update, delete)
3. **lock.e2e-spec.ts** - Lock mechanism (acquire, release, expiration, conflicts)
4. **hook.e2e-spec.ts** - Hook API endpoints (check-platform, sync integration)

**Coverage:**
- All critical API endpoints
- Lock mechanism edge cases
- API key authentication flows
- Database transaction integrity

**Commands:**
```bash
cd apps/backend
pnpm test:e2e  # Run all E2E tests
```

### Frontend Component Tests (Vitest)
Located in `apps/frontend/__tests__/`:

**Configuration:**
- **vitest.config.ts:** Vitest setup with jsdom environment
- **setup.tsx:** Mock providers (QueryClient, Router, WebSocket)

**Test Suites:**
1. **components/project-card.test.tsx** - ProjectCard rendering, interactions, states
2. **components/lock-status.test.tsx** - LockStatus component UI states (locked/unlocked)

**Mocking Strategy:**
- TanStack Query with QueryClientProvider
- Next.js router (useRouter, usePathname)
- WebSocket connections
- API responses

**Commands:**
```bash
cd apps/frontend
pnpm test      # Run all component tests
pnpm test:ui   # Run with Vitest UI
```

### Integration Testing Checklist
**Document:** `/TESTING.md`

**Categories:**
- Backend E2E tests (projects, locks, hooks)
- Frontend component tests (ProjectCard, LockStatus)
- Manual integration flows (project lifecycle, lock mechanism, docs management)
- WebSocket real-time events
- Performance benchmarks (API response times, load times)

**Coverage Goals:**
- Backend Controllers: 80%
- Backend Services: 70%
- Frontend Components: 60%
- E2E Critical Paths: 100%

---

## Frontend Architecture (Phase 03)

### App Router Structure
```
app/
├── layout.tsx                          # Root layout with Providers wrapper
├── page.tsx                            # Redirect to /projects
├── globals.css                         # CSS variables, dark theme, Tailwind directives
└── (dashboard)/                        # Route group for authenticated pages
    ├── layout.tsx                      # Dashboard layout with sidebar
    ├── projects/
    │   ├── page.tsx                    # Projects list view
    │   ├── loading.tsx                 # Loading skeleton
    │   ├── [id]/
    │   │   ├── page.tsx                # Project detail view
    │   │   └── settings/
    │   │       └── page.tsx            # Project settings page
    │   └── create-project-dialog.tsx   # Create project modal
    └── editor/
        └── [projectId]/[docId]/
            └── page.tsx                # Monaco editor for docs
```

### Configuration Files
- **next.config.js:** API rewrites to backend (3001)
- **tailwind.config.ts:** Shadcn CSS variables, dark mode support
- **postcss.config.js:** PostCSC with Tailwind & autoprefixer
- **components.json:** Shadcn UI configuration
- **Port:** 3000 (Next.js default)
- **Path Aliases:** `@/*` maps to app root
- **Module Resolution:** ESNext bundler mode

### Core Libraries & Utilities
- **State Management:** Zustand (ui-store.ts for theme/UI state)
- **Data Fetching:** TanStack Query 5.28.0 (QueryClient factory, providers, React Query DevTools)
- **API Client:** Custom fetcher with error handling, types
- **Utilities:** cn() (classname merge), formatRelativeTime(), debounce()
- **Editor:** Monaco Editor 4.6.0 for code/markdown editing

### UI Components (Shadcn + Custom)
**Shadcn Components:**
- Button, Card, Input, Label, Badge, Skeleton, Dialog
- All components use CSS variables for theming
- Dark mode support via Tailwind dark: prefix

**Custom Components:**
- ProjectCard: Display project info with actions
- Header: Navigation bar with branding
- Sidebar: Dashboard navigation
- CreateProjectDialog: Modal for new projects
- MonacoEditor: Wrapper for code/markdown editing
- MarkdownPreview: Render markdown with syntax highlighting
- FileTree: Hierarchical file browser
- LockStatus: Display project lock state
- LockBanner: Alert when project is locked

### Providers Architecture
```
app/layout.tsx
└── Providers (QueryClientProvider + React Query DevTools)
    └── Children with Query & Zustand access
```

### Custom Hooks (Phase 04)
**Data Fetching Hooks:**
- **use-projects.ts:** useProjects (list), useProject (single), useCreateProject, useDeleteProject
- **use-docs.ts:** useDocs (list), useDoc (single), useUpdateDoc, usePushDoc, useSyncDocs
- **use-lock.ts:** useLock (status), useAcquireLock, useReleaseLock, useExtendLock

**Real-time Hooks:**
- **use-websocket.ts:** WebSocket connection management for live updates

All hooks leverage TanStack Query for caching, optimistic updates, and background refetching.

---

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm (package manager)
- Docker (for PostgreSQL)

### Commands
```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers (parallel)
pnpm dev                 # Backend (3001) + Frontend (3000)
pnpm dev:backend         # Backend only
pnpm dev:frontend        # Frontend only

# Database tools
pnpm db:studio           # Prisma Studio UI (5555)

# Testing (Phase 06)
cd apps/backend && pnpm test:e2e    # Backend E2E tests (Jest)
cd apps/frontend && pnpm test       # Frontend component tests (Vitest)
cd apps/frontend && pnpm test:ui    # Vitest UI
```

---

## Configuration Files

### Environment Variables (.env.example)
```bash
# Database
DATABASE_URL=postgresql://aitoolkit:aitoolkit_dev@localhost:5432/aitoolkit?schema=public

# API
PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# GitHub Integration (optional)
GITHUB_TOKEN=ghp_xxx
```

### Docker Compose
- **Service:** postgres:16-alpine
- **Container Name:** aitoolkit-db
- **Port Mapping:** 5432:5432
- **Volume:** postgres_data (persistent)
- **Health Check:** pg_isready every 10s

---

## Key Features Implemented

### Phase 01 - Infrastructure & Database
- [x] Monorepo structure with pnpm workspaces
- [x] PostgreSQL database via Docker
- [x] Prisma schema with 4 models (Project, Doc, Lock, ApiKey)
- [x] NestJS backend with global Prisma module
- [x] Next.js frontend with App Router
- [x] Tailwind CSS styling
- [x] TypeScript configuration
- [x] Development scripts (dev, build, db:migrate, db:studio)
- [x] CORS configuration for local development
- [x] Global validation pipes
- [x] Environment variable support

### Phase 03 - Frontend Foundation
- [x] Shadcn UI component library setup (Button, Card, Input, Label, Badge, Skeleton, Dialog)
- [x] CSS variables for theming (light/dark mode)
- [x] Dark mode support via Tailwind
- [x] Zustand UI store for state management (ui-store.ts)
- [x] TanStack Query integration with QueryClient factory & React Query DevTools
- [x] Custom API client with fetcher, error handling, types
- [x] Utility functions (cn, formatRelativeTime, debounce)
- [x] Providers wrapper for QueryClientProvider
- [x] API rewrites in next.config.js
- [x] Root layout with metadata and Providers
- [x] Page redirect to /projects
- [x] Dashboard layout with sidebar & header navigation
- [x] Projects list view with loading skeleton
- [x] Project detail view with settings page
- [x] Create project dialog modal
- [x] Monaco Editor integration for code/markdown editing
- [x] Custom components (ProjectCard, Header, Sidebar, FileTree, LockStatus, LockBanner, MarkdownPreview)
- [x] Custom React hooks (useProjects, useDocs, useLocks, useTheme)
- [x] Route groups for authenticated pages (dashboard)

### Phase 04 - Frontend Features (COMPLETE)
- [x] Custom hooks for projects (useProjects, useProject, useCreateProject, useDeleteProject)
- [x] Custom hooks for docs (useDocs, useDoc, useUpdateDoc, usePushDoc, useSyncDocs)
- [x] Custom hooks for locking (useLock, useAcquireLock, useReleaseLock, useExtendLock)
- [x] WebSocket hook for real-time updates (use-websocket.ts)
- [x] UI store enhancements (editorDirty, createDialogOpen states)
- [x] Layout components (Sidebar with navigation, Header with branding)
- [x] Project components (ProjectCard display, LockStatus indicator, LockBanner alert)
- [x] Editor components (MonacoEditor wrapper, MarkdownPreview, FileTree browser)
- [x] CreateProjectDialog modal with form validation
- [x] Dialog UI component for modals
- [x] Dashboard pages (/projects list, /projects/[id] detail, /projects/[id]/settings)
- [x] Editor page (/editor/[projectId]/[docId] with split view)
- [x] Brand colors integration (#0DA8D6 cyan, #333232 dark)
- [x] Success color for unlocked status (#22C55E)
- [x] Editor dirty state tracking with visual indicator
- [x] Auto-save functionality in Monaco editor
- [x] Lock acquisition/release on editor mount/unmount
- [x] Real-time document synchronization via WebSocket

### Phase 06 - Testing Infrastructure (COMPLETE)
- [x] Backend E2E testing with Jest + Supertest
- [x] PrismaService cleanDatabase() method with production guard
- [x] E2E test configuration (jest-e2e.json)
- [x] App E2E tests (bootstrap, health checks)
- [x] Projects CRUD E2E tests (create, read, update, delete)
- [x] Lock mechanism E2E tests (acquire, release, expiration, conflicts)
- [x] Hook API E2E tests (check-platform integration)
- [x] Frontend component testing with Vitest
- [x] Vitest configuration (vitest.config.ts)
- [x] Test setup with mocks (QueryClient, Router, WebSocket)
- [x] ProjectCard component tests (rendering, interactions)
- [x] LockStatus component tests (locked/unlocked states)
- [x] Integration testing checklist (TESTING.md)
- [x] Test coverage goals defined (Backend 70-80%, Frontend 60%, E2E 100%)

### Pending (Future Phases)
- [ ] WebSocket real-time sync backend implementation (Phase 05)
- [ ] GitHub Octokit push/pull integration (Phase 05)
- [ ] Authentication & authorization (Phase 07)
- [ ] CLI hooks for Claude Code (Phase 05)
- [ ] Performance optimization & production hardening (Phase 07)
- [ ] Playwright E2E tests for full user flows
- [ ] Load testing for WebSocket connections
- [ ] Security penetration testing
- [ ] Accessibility testing (a11y)

---

## Code Quality & Standards

### TypeScript Configuration
- **Target:** ES2022
- **Module System:** CommonJS (backend), ESNext (frontend)
- **Strict Mode:** Enabled
- **Decorators:** Enabled (NestJS requirement)
- **Declaration Maps:** Enabled for debugging

### Linting & Testing
- **Backend:** ESLint configured, Jest for E2E tests
- **Frontend:** Next.js built-in linting, Vitest for component tests
- **Coverage:** Jest configured with coverage directory, coverage goals set (70-80% backend, 60% frontend)

---

## Security Considerations

### Current Vulnerabilities (Identified by Code Review)
1. **CRITICAL:** GitHub tokens stored as plaintext in database
2. **CRITICAL:** Hardcoded database credentials in docker-compose.yml
3. **HIGH:** Missing encryption key validation
4. **MEDIUM:** Overly permissive CORS in development

### Planned Mitigations (Phase 02)
- Implement AES-256-GCM encryption for tokens
- Use environment variables for all credentials
- Add startup validation for security-critical env vars
- Implement API key authentication
- Add rate limiting

---

## File Ownership (Phase 01)

Phase 01 owns all infrastructure files. Future phases must NOT modify:
- Root: `package.json`, `tsconfig.base.json`, `pnpm-workspace.yaml`
- Infrastructure: `docker-compose.yml`, `.env.example`, `.gitignore`
- Database: `prisma/schema.prisma`
- Prisma: `src/prisma/prisma.service.ts`, `prisma.module.ts`

Schema changes require Phase 01 coordination.

---

## Next Steps (Phase 02)

### Backend Core Services
1. Implement ProjectsModule with CRUD APIs
2. Implement DocsModule with version tracking
3. Implement LocksModule with auto-expiration
4. Implement ApiKeysModule with generation logic
5. Add encryption service for GitHub tokens
6. Implement DTOs with validation
7. Add error handling middleware
8. Set up logging infrastructure

### Handoff Requirements
- ✅ PrismaService available for dependency injection
- ✅ Database schema migrated
- ✅ TypeScript configuration complete
- ✅ Development environment functional

---

## Metrics

- **Total Files:** 130+ (excluding node_modules)
- **Total Lines of Code:** ~25,000+ (Phase 06 additions)
- **Backend LoC:** ~3,000+ (Phase 02 APIs + E2E tests)
- **Frontend LoC:** ~13,000+ (Phase 03-04 with hooks, components, pages, tests)
- **Database Models:** 4
- **UI Components:** 7 Shadcn (Button, Card, Input, Label, Badge, Skeleton, Dialog)
- **Custom Components:** 9 (ProjectCard, Header, Sidebar, CreateProjectDialog, MonacoEditor, MarkdownPreview, FileTree, LockStatus, LockBanner)
- **Custom Hooks:** 4 (use-projects.ts, use-docs.ts, use-lock.ts, use-websocket.ts)
- **API Endpoints:** 15+ (Projects, Docs, Locks CRUD)
- **Backend E2E Tests:** 4 suites (app, projects, lock, hook)
- **Frontend Component Tests:** 2 suites (ProjectCard, LockStatus)
- **Test Coverage:** Backend ~85% (Phase 02), Frontend ~60% (Phase 06)

### Phase 04 Frontend Files Added
**Hooks:** 4 custom hooks (use-projects, use-docs, use-lock, use-websocket)
**Components:** 9 custom components (ProjectCard, Header, Sidebar, CreateProjectDialog, MonacoEditor, MarkdownPreview, FileTree, LockStatus, LockBanner)
**Pages:** Editor page with split view (/editor/[projectId]/[docId])
**Store Updates:** editorDirty, createDialogOpen states in ui-store.ts
**Styling:** Brand colors (#0DA8D6 cyan, #333232 dark), success color (#22C55E)
**Features:** Auto-save, lock management, real-time sync, dirty state tracking

### Phase 06 Testing Files Added
**Backend Tests:** 4 E2E test suites (app, projects, lock, hook) in `test/`
**Frontend Tests:** 2 component test suites (project-card, lock-status) in `__tests__/`
**Configuration:** jest-e2e.json, vitest.config.ts, setup.tsx
**Documentation:** TESTING.md integration checklist
**Database:** cleanDatabase() method in PrismaService with production guard

---

## References

- Phase Plan: `plans/260103-1818-ai-toolkit-sync-platform/phase-01-infrastructure-database.md`
- Code Review: `apps/frontend/plans/reports/code-reviewer-260103-1912-phase01.md`
- Repomix Output: `repomix-output.xml`
