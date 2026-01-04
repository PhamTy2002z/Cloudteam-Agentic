# System Architecture - AI Toolkit Sync Platform

**Last Updated:** 2026-01-03
**Phase:** Phase 06 Complete (Testing & Deployment Infrastructure)
**Architecture Style:** Monolithic (Backend + Frontend) with Monorepo Structure
**Status:** Production-Ready with Comprehensive Testing Infrastructure

---

## Overview

AI Toolkit Sync Platform uses a modern full-stack TypeScript architecture with clear separation between backend (NestJS), frontend (Next.js), and database (PostgreSQL). The system is designed for horizontal scalability, real-time synchronization, and secure GitHub integration.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Browser   │  │  CLI Hooks  │  │  VS Code    │            │
│  │   (React)   │  │   (Bash)    │  │  Extension  │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          │ HTTPS/WSS       │ HTTPS (API Key) │ HTTPS
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────────────┐
│                      Application Layer                          │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Next.js Frontend (Port 3000)            │      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │      │
│  │  │ App Router  │  │   Zustand   │  │    Monaco    │ │      │
│  │  │   (Pages)   │  │   (State)   │  │   Editor     │ │      │
│  │  └─────────────┘  └─────────────┘  └──────────────┘ │      │
│  │  ┌─────────────────────────────────────────────────┐ │      │
│  │  │         TanStack Query (API Client)             │ │      │
│  │  └─────────────────────────────────────────────────┘ │      │
│  └────────────────────┬─────────────────────────────────┘      │
│                       │ REST API + WebSocket                    │
│  ┌────────────────────▼─────────────────────────────────┐      │
│  │              NestJS Backend (Port 3001)              │      │
│  │  ┌─────────────────────────────────────────────────┐ │      │
│  │  │          API Layer (Controllers)                │ │      │
│  │  │  /api/projects  /api/docs  /api/locks           │ │      │
│  │  └────────────────────┬────────────────────────────┘ │      │
│  │  ┌────────────────────▼────────────────────────────┐ │      │
│  │  │        Business Logic (Services)                │ │      │
│  │  │  ProjectsService  DocsService  LocksService     │ │      │
│  │  └────────┬─────────────────────────┬──────────────┘ │      │
│  │           │                         │                 │      │
│  │  ┌────────▼──────┐       ┌─────────▼────────┐       │      │
│  │  │ PrismaService │       │  GitHubService   │       │      │
│  │  │  (Database)   │       │   (Octokit)      │       │      │
│  │  └────────┬──────┘       └─────────┬────────┘       │      │
│  └───────────┼──────────────────────────┼────────────────┘      │
└──────────────┼──────────────────────────┼───────────────────────┘
               │                          │
┌──────────────▼──────────┐   ┌───────────▼────────────┐
│   Data Layer            │   │  External Services     │
│  ┌──────────────────┐   │   │  ┌──────────────────┐  │
│  │  PostgreSQL 16   │   │   │  │  GitHub API      │  │
│  │  (Port 5432)     │   │   │  │  (git commits)   │  │
│  └──────────────────┘   │   │  └──────────────────┘  │
│  ┌──────────────────┐   │   │  ┌──────────────────┐  │
│  │  Redis (Cache)   │   │   │  │  Email Service   │  │
│  │  (Future)        │   │   │  │  (Future)        │  │
│  └──────────────────┘   │   │  └──────────────────┘  │
└─────────────────────────┘   └────────────────────────┘
```

---

## Component Architecture

### Frontend (Next.js 14 - App Router)

#### Directory Structure
```
apps/frontend/
├── app/                    # App Router (file-based routing)
│   ├── (dashboard)/        # Route group for authenticated pages
│   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   ├── projects/       # Projects management
│   │   │   ├── page.tsx    # Projects list view
│   │   │   ├── loading.tsx # Loading skeleton
│   │   │   ├── [id]/       # Dynamic project routes
│   │   │   │   ├── page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── create-project-dialog.tsx
│   │   └── editor/         # Monaco editor for docs
│   │       └── [projectId]/[docId]/page.tsx
│   ├── layout.tsx          # Root layout (global UI, Providers)
│   ├── page.tsx            # Home page (redirect to /projects)
│   └── globals.css         # Global styles (Tailwind, CSS variables)
├── components/
│   ├── ui/                 # Shadcn UI components (Button, Card, Input, Label, Badge, Skeleton, Dialog)
│   ├── header.tsx          # Navigation bar with branding
│   ├── sidebar.tsx         # Dashboard navigation
│   ├── project-card.tsx    # Project display component
│   ├── create-project-dialog.tsx  # New project modal
│   ├── monaco-editor.tsx   # Code/markdown editor wrapper
│   ├── markdown-preview.tsx # Markdown renderer
│   ├── file-tree.tsx       # Hierarchical file browser
│   ├── lock-status.tsx     # Project lock indicator
│   └── lock-banner.tsx     # Lock alert banner
├── hooks/                  # Custom React hooks
│   ├── useProjects.ts      # Projects data fetching
│   ├── useDocs.ts          # Docs data fetching
│   ├── useLocks.ts         # Lock state management
│   └── useTheme.ts         # Theme switching
├── lib/
│   ├── api.ts              # TanStack Query hooks & API client
│   ├── query-client.ts     # QueryClient factory
│   ├── providers.tsx       # Provider wrapper component
│   └── utils.ts            # Shared utilities (cn, formatRelativeTime, debounce)
├── stores/                 # Zustand state stores
│   └── ui-store.ts         # Theme & UI state (dark mode toggle)
├── types/                  # TypeScript type definitions
│   └── index.ts            # Shared types (Project, Doc, Lock, ApiKey)
├── next.config.js          # API rewrites to backend (3001)
├── tailwind.config.ts      # Tailwind CSS config with Shadcn variables
├── postcss.config.js       # PostCSS with Tailwind & autoprefixer
├── components.json         # Shadcn UI configuration
└── tsconfig.json           # TypeScript configuration
```

#### Key Technologies
- **Routing:** App Router (file-based, server components by default)
- **State Management:** Zustand (client state) + TanStack Query (server state)
- **Styling:** Tailwind CSS + CSS Modules + CSS Variables
- **Code Editor:** Monaco Editor (VS Code engine)
- **Real-time:** WebSocket client (socket.io-client, planned Phase 05)
- **UI Components:** Shadcn/ui (7 components: Button, Card, Input, Label, Badge, Skeleton, Dialog)
- **Data Fetching:** TanStack React Query 5.28.0 with React Query DevTools

#### Data Flow
1. User interaction triggers event (button click, form submit)
2. Component calls TanStack Query mutation/query hook
3. API client sends HTTPS request to backend (via next.config.js rewrite)
4. Backend processes request, returns JSON response
5. TanStack Query updates cache & invalidates related queries
6. Zustand store updates (if needed for global UI state)
7. React re-renders affected components
8. React Query DevTools available for debugging (dev mode)

#### Component Hierarchy
```
RootLayout (Providers wrapper)
├── QueryClientProvider (TanStack Query)
├── Zustand Store (UI state)
└── Children
    ├── DashboardLayout (sidebar, header)
    │   ├── Sidebar (navigation)
    │   ├── Header (branding, theme toggle)
    │   └── Main Content
    │       ├── ProjectsList (ProjectCard components)
    │       ├── ProjectDetail (with LockBanner, LockStatus)
    │       ├── ProjectSettings
    │       └── MonacoEditor (with FileTree, MarkdownPreview)
    └── Home (redirect)
```

---

### Backend (NestJS 10)

#### Module Architecture
```
apps/backend/src/
├── main.ts                 # Bootstrap (CORS, validation, port)
├── app.module.ts           # Root module
├── prisma/                 # Database module (global)
│   ├── prisma.service.ts   # Prisma client wrapper
│   └── prisma.module.ts    # Global module export
├── projects/               # Projects feature module
│   ├── dto/
│   │   ├── create-project.dto.ts
│   │   └── update-project.dto.ts
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   └── projects.module.ts
├── docs/                   # Documents feature module
│   ├── dto/
│   ├── docs.controller.ts
│   ├── docs.service.ts
│   └── docs.module.ts
├── locks/                  # Locks feature module
│   ├── dto/
│   ├── locks.controller.ts
│   ├── locks.service.ts
│   └── locks.module.ts
├── api-keys/               # API Keys feature module
│   ├── dto/
│   ├── api-keys.controller.ts
│   ├── api-keys.service.ts
│   └── api-keys.module.ts
├── github/                 # GitHub integration module
│   ├── github.service.ts   # Octokit wrapper
│   └── github.module.ts
├── encryption/             # Encryption service module
│   ├── encryption.service.ts
│   └── encryption.module.ts
├── websocket/              # WebSocket gateway
│   ├── websocket.gateway.ts
│   └── websocket.module.ts
└── common/                 # Shared utilities
    ├── decorators/
    ├── filters/
    ├── guards/
    ├── interceptors/
    └── pipes/
```

#### Dependency Injection Flow
```
AppModule (root)
├── ConfigModule (global) ──→ All modules access env vars
├── PrismaModule (global) ──→ All services inject PrismaService
├── EncryptionModule ──────→ ProjectsService injects EncryptionService
├── ProjectsModule
│   └── ProjectsService ──→ Injects PrismaService, EncryptionService
├── DocsModule
│   └── DocsService ──────→ Injects PrismaService, GitHubService
├── LocksModule
│   └── LocksService ─────→ Injects PrismaService, WebSocketGateway
└── WebSocketModule
    └── WebSocketGateway ─→ Broadcasts events to connected clients
```

#### Request Lifecycle
1. **Request arrives** → NestJS receives HTTP request
2. **Middleware** → CORS check, request logging
3. **Guards** → ApiKeyGuard validates API key from headers
4. **Interceptors** → Transform request (e.g., trim whitespace)
5. **Pipes** → ValidationPipe validates DTO with class-validator
6. **Controller** → Route handler method executes
7. **Service** → Business logic, database operations
8. **Interceptors** → Transform response (e.g., serialize DTOs)
9. **Filters** → Catch exceptions, format error responses
10. **Response sent** → JSON response to client

---

## Database Architecture (PostgreSQL + Prisma)

### Entity-Relationship Diagram
```
┌────────────────────┐
│      Project       │
├────────────────────┤
│ id (PK)            │──┐
│ name               │  │
│ repoUrl            │  │
│ token (encrypted)  │  │
│ branch             │  │
│ docsPath           │  │
│ createdAt          │  │
│ updatedAt          │  │
└────────────────────┘  │
         │              │
         │ 1            │
         │              │
         │              │
    ┌────┴────┐         │
    │         │         │
    │ *       │ *       │ *
    │         │         │
┌───▼─────┐ ┌─▼──────┐ ┌─▼─────────┐
│   Doc   │ │  Lock  │ │  ApiKey   │
├─────────┤ ├────────┤ ├───────────┤
│ id (PK) │ │ id (PK)│ │ id (PK)   │
│ projId  │ │ projId │ │ projId    │
│ fileName│ │ locked │ │ key       │
│ content │ │ lockedAt│ │ name      │
│ hash    │ │ expires│ │ isActive  │
│ version │ │ reason │ │ createdAt │
│ created │ └────────┘ └───────────┘
│ updated │
└─────────┘
```

### Schema Design Principles
1. **Normalization:** 3NF (Third Normal Form) to avoid redundancy
2. **Indexes:** Foreign keys, frequently queried fields (projectId, key)
3. **Constraints:** Unique constraints (projectId + fileName for Docs)
4. **Cascading Deletes:** ON DELETE CASCADE for child records
5. **Timestamps:** createdAt, updatedAt for audit trails

### Data Integrity
- **Referential Integrity:** Foreign key constraints enforced by PostgreSQL
- **Unique Constraints:** `@@unique([projectId, fileName])` prevents duplicate docs
- **Single Lock Rule:** `projectId @unique` in Lock model ensures one lock per project
- **Validation:** class-validator in DTOs + Prisma schema validation

---

## API Architecture

### REST API Endpoints (Planned - Phase 02)

#### Projects API
```
GET    /api/projects           # List all projects (paginated)
POST   /api/projects           # Create new project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project (cascade)
```

#### Documents API
```
GET    /api/projects/:id/docs         # List docs for project
POST   /api/projects/:id/docs         # Create new doc
GET    /api/projects/:id/docs/:docId  # Get doc content
PUT    /api/projects/:id/docs/:docId  # Update doc (version++)
DELETE /api/projects/:id/docs/:docId  # Delete doc
GET    /api/projects/:id/docs/latest  # Get latest versions (for CLI)
```

#### Locks API
```
GET    /api/projects/:id/lock    # Get current lock status
POST   /api/projects/:id/lock    # Acquire lock (returns 409 if locked)
DELETE /api/projects/:id/lock    # Release lock
PUT    /api/projects/:id/lock    # Extend lock expiration
```

#### API Keys API
```
GET    /api/projects/:id/api-keys     # List keys for project
POST   /api/projects/:id/api-keys     # Generate new key
DELETE /api/projects/:id/api-keys/:keyId  # Revoke key
PUT    /api/projects/:id/api-keys/:keyId  # Toggle isActive
```

### Request/Response Format

#### Request (Example: Create Project)
```http
POST /api/projects
Content-Type: application/json
X-API-Key: your-api-key-here

{
  "name": "My Project",
  "repoUrl": "https://github.com/user/repo",
  "token": "ghp_xxx",
  "branch": "main",
  "docsPath": "docs"
}
```

#### Response (Success)
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "ckvx12abc",
  "name": "My Project",
  "repoUrl": "https://github.com/user/repo",
  "branch": "main",
  "docsPath": "docs",
  "createdAt": "2026-01-03T10:30:00Z",
  "updatedAt": "2026-01-03T10:30:00Z"
}
```
*Note: `token` field is encrypted and never returned in responses*

#### Response (Error)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "statusCode": 400,
  "message": ["name must be a string", "repoUrl must be a URL"],
  "timestamp": "2026-01-03T10:31:00Z"
}
```

---

## Real-time Architecture (WebSocket - Phase 05)

### WebSocket Events

#### Server → Client Events
```typescript
// Document updated
{
  event: 'doc:updated',
  data: {
    projectId: 'ckvx12abc',
    docId: 'doc123',
    fileName: 'code-standards.md',
    hash: 'sha256:abc123',
    version: 5
  }
}

// Lock acquired
{
  event: 'lock:acquired',
  data: {
    projectId: 'ckvx12abc',
    lockedBy: 'user@example.com',
    expiresAt: '2026-01-03T11:00:00Z'
  }
}

// Lock released
{
  event: 'lock:released',
  data: {
    projectId: 'ckvx12abc'
  }
}
```

#### Client → Server Events
```typescript
// Subscribe to project updates
socket.emit('subscribe', { projectId: 'ckvx12abc' });

// Unsubscribe from project
socket.emit('unsubscribe', { projectId: 'ckvx12abc' });

// Heartbeat
socket.emit('ping');
```

### Connection Flow
1. Client connects to `ws://localhost:3001`
2. Server authenticates via API key (sent in handshake)
3. Client subscribes to project(s) via `subscribe` event
4. Server adds client to project-specific room
5. When doc updated, server broadcasts to all clients in room
6. Clients receive event, update local state (Zustand store)
7. React components re-render with new data

---

## Security Architecture

### Authentication & Authorization
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ Include X-API-Key header
       ▼
┌─────────────────────┐
│  ApiKeyGuard        │
│  (NestJS Guard)     │
├─────────────────────┤
│ 1. Extract API key  │
│ 2. Query database   │
│ 3. Validate isActive│
│ 4. Attach project   │
│    to request       │
└──────┬──────────────┘
       │ If valid
       ▼
┌─────────────────────┐
│  Controller         │
│  (Route Handler)    │
└─────────────────────┘
```

### Data Encryption (Phase 02)
```typescript
// Encryption Flow (GitHub Token)
Plaintext Token (ghp_xxx)
    │
    ▼
┌───────────────────────────┐
│ EncryptionService         │
│ AES-256-GCM               │
│ Key: process.env.         │
│      ENCRYPTION_KEY       │
└───────────┬───────────────┘
            │
            ▼
Encrypted Token (base64)
    │
    ▼
┌───────────────────────────┐
│ PostgreSQL Database       │
│ Project.token field       │
└───────────────────────────┘

// Decryption Flow (When using GitHub API)
Database Read
    │
    ▼
Encrypted Token (base64)
    │
    ▼
┌───────────────────────────┐
│ EncryptionService.decrypt │
│ AES-256-GCM               │
└───────────┬───────────────┘
            │
            ▼
Plaintext Token (ghp_xxx)
    │
    ▼
┌───────────────────────────┐
│ GitHubService (Octokit)   │
│ Use for GitHub API calls  │
└───────────────────────────┘
```

### Security Layers
1. **Transport Security:** HTTPS only in production (TLS 1.3)
2. **Authentication:** API key validation via database
3. **Authorization:** Project-based access control
4. **Input Validation:** class-validator on all DTOs
5. **SQL Injection Prevention:** Prisma parameterized queries
6. **XSS Prevention:** React automatic escaping
7. **CSRF Protection:** SameSite cookies (future auth)
8. **Rate Limiting:** 100 requests/minute per API key (Phase 02)

---

## Deployment Architecture (Future)

### Development Environment
```
Developer Machine
├── Docker Desktop
│   └── PostgreSQL Container (port 5432)
├── Terminal 1: pnpm dev:backend (port 3001)
└── Terminal 2: pnpm dev:frontend (port 3000)
```

### Production Environment (Proposed)
```
┌─────────────────────────────────────────────────────┐
│                 Cloudflare CDN                      │
│  (Static assets, DDoS protection, SSL)              │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│              Load Balancer (NGINX)                  │
│  (Round-robin, health checks)                       │
└────────┬───────────────────────┬────────────────────┘
         │                       │
    ┌────▼─────┐           ┌─────▼────┐
    │  Backend │           │  Backend │
    │ Instance │           │ Instance │
    │   (1)    │           │   (2)    │
    └────┬─────┘           └─────┬────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │  PostgreSQL Primary   │
         │  (RDS/Managed DB)     │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │  PostgreSQL Replica   │
         │  (Read-only queries)  │
         └───────────────────────┘
```

---

## Performance Optimization

### Backend Optimizations
1. **Database Indexing:** All foreign keys and frequently queried fields
2. **Connection Pooling:** Prisma connection pool (default 10 connections)
3. **Caching:** Redis for frequently accessed docs (future)
4. **Pagination:** Default 20 items per page, max 100
5. **Lazy Loading:** Only load relations when needed (Prisma include)

### Frontend Optimizations
1. **Code Splitting:** Next.js automatic route-based splitting
2. **Image Optimization:** `next/image` with WebP format
3. **Bundle Analysis:** `@next/bundle-analyzer` for size tracking
4. **Lazy Loading:** Dynamic imports for Monaco Editor
5. **Caching:** TanStack Query with stale-while-revalidate strategy

---

## Monitoring & Observability (Future)

### Logging
- **Backend:** Winston logger (structured JSON logs)
- **Frontend:** Sentry for error tracking
- **Database:** Prisma query logs in development

### Metrics
- **Performance:** Response time, throughput (requests/sec)
- **Business:** Projects created, docs updated, locks acquired
- **Infrastructure:** CPU usage, memory usage, database connections

### Alerts
- API response time \>500ms (p95)
- Database connection pool exhausted
- Lock expiration failures
- GitHub API rate limit approaching

---

## Technology Decisions

### Why NestJS?
- Modular architecture scales well
- Built-in dependency injection
- TypeScript-first with decorators
- Excellent WebSocket support
- Large ecosystem (Prisma, TypeORM, etc.)

### Why Next.js?
- Server-side rendering for SEO
- App Router for modern React patterns
- Built-in API routes (not used, we use NestJS)
- Excellent developer experience
- Vercel deployment integration

### Why PostgreSQL?
- Strong ACID guarantees
- Robust indexing (B-tree, GiST, GIN)
- JSON support for flexible schemas
- Excellent Prisma support
- Widely adopted, easy to hire for

### Why Prisma?
- Type-safe database access
- Automatic migrations
- Great developer experience
- Multi-database support (future)
- Built-in connection pooling

---

## Scalability Considerations

### Horizontal Scaling
- Backend: Stateless design allows multiple instances
- Database: Read replicas for analytics queries
- WebSocket: Redis pub/sub for multi-instance sync

### Vertical Scaling
- Database: Increase connection pool size
- Backend: Increase Node.js memory limit
- Redis: Increase max memory for caching

---

## Unresolved Questions

1. **Redis Integration:** When to introduce caching layer? (Phase 03 or Phase 05?)
2. **Database Backup Strategy:** Daily snapshots or continuous WAL archiving?
3. **Multi-tenancy:** Separate databases per tenant or row-level security?
4. **CDN Strategy:** Self-hosted or Cloudflare Workers for edge caching?
