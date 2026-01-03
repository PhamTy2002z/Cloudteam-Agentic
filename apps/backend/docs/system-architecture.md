# System Architecture Documentation

## Architecture Overview

AI Toolkit Sync Platform là một **full-stack web application** cho phép teams quản lý và đồng bộ documentation giữa local editor và GitHub repositories với real-time collaboration features.

### Architecture Style

**Three-Tier Layered Architecture**:
1. **Presentation Layer**: Next.js 14 frontend (Phase 03-04)
2. **Business Logic Layer**: NestJS backend REST API (Phase 02)
3. **Data Layer**: PostgreSQL database với Prisma ORM (Phase 01)

**Communication Pattern**: RESTful HTTP/JSON APIs

## System Context Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        External Systems                          │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐             │
│  │   GitHub   │    │  Browser   │    │   CLI      │             │
│  │    API     │    │   Client   │    │   Tool     │             │
│  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘             │
└────────┼─────────────────┼─────────────────┼────────────────────┘
         │                 │                 │
         │ REST API        │ HTTPS           │ REST API + WS
         │                 │                 │
┌────────▼─────────────────▼─────────────────▼────────────────────┐
│                  AI Toolkit Sync Platform                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐        │
│  │            Frontend (Next.js 14)                    │        │
│  │  - Monaco Editor Integration                        │        │
│  │  - Real-time Lock UI                                │        │
│  │  - Project Management                               │        │
│  └────────────────────┬────────────────────────────────┘        │
│                       │ REST + WebSocket                         │
│  ┌────────────────────▼────────────────────────────────┐        │
│  │         Backend (NestJS 10)                         │        │
│  │  - REST API Controllers                             │        │
│  │  - Business Services                                │        │
│  │  - WebSocket Gateway (Phase 05)                     │        │
│  │  - GitHub Integration                               │        │
│  └────────────────────┬────────────────────────────────┘        │
│                       │ Prisma ORM                               │
│  ┌────────────────────▼────────────────────────────────┐        │
│  │         Database (PostgreSQL 14+)                   │        │
│  │  - Projects, Docs, Locks, ApiKeys                   │        │
│  │  - ACID transactions                                │        │
│  └─────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Backend Architecture (Phase 02)

```
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Application                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  HTTP Entry Point                        │   │
│  │  - CORS Middleware                                       │   │
│  │  - Global Validation Pipe                               │   │
│  │  - Global Exception Filter                              │   │
│  │  - Rate Limiter (TODO: Configure)                       │   │
│  └──────────────────┬───────────────────────────────────────┘   │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐   │
│  │              Controller Layer                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  Projects    │  │     Docs     │  │     Lock     │   │   │
│  │  │ Controller   │  │  Controller  │  │  Controller  │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │   │
│  └─────────┼──────────────────┼──────────────────┼───────────┘   │
│            │                  │                  │               │
│  ┌─────────▼──────────────────▼──────────────────▼───────────┐   │
│  │                  Service Layer                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │  Projects    │  │     Docs     │  │     Lock     │   │   │
│  │  │   Service    │  │   Service    │  │   Service    │   │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │   │
│  │         │                  │                  │           │   │
│  │         └────────┬─────────┴──────────────────┘           │   │
│  └──────────────────┼──────────────────────────────────────────┘
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐   │
│  │              Common Services                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │    Crypto    │  │    GitHub    │  │    Prisma    │   │   │
│  │  │   Service    │  │   Service    │  │   Service    │   │   │
│  │  └──────────────┘  └──────────────┘  └──────┬───────┘   │   │
│  └─────────────────────────────────────────────┼───────────────┘
│                                                 │               │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │
                                        ┌─────────▼─────────┐
                                        │   PostgreSQL      │
                                        │    Database       │
                                        └───────────────────┘
```

### Module Dependency Graph

```
AppModule
├── ConfigModule (Global)
│   └── Provides: ConfigService
│
├── PrismaModule
│   └── Provides: PrismaService
│       └── Used by: ALL service modules
│
├── CryptoModule
│   └── Provides: CryptoService
│       └── Used by: ProjectsService
│
├── GitHubModule
│   └── Provides: GitHubService
│       └── Used by: DocsService
│
├── ProjectsModule
│   ├── Imports: PrismaModule, CryptoModule
│   ├── Provides: ProjectsService
│   └── Exports: ProjectsService
│
├── DocsModule
│   ├── Imports: PrismaModule, GitHubModule
│   ├── Provides: DocsService
│   └── Exports: DocsService
│
└── LockModule
    ├── Imports: PrismaModule
    ├── Provides: LockService
    └── Exports: LockService
```

## Data Architecture

### Database Schema (Prisma)

```
┌────────────────────────────────────────────────────────────────┐
│                         Project                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id: String (CUID, PK)                                    │  │
│  │ name: String                                             │  │
│  │ repoUrl: String                                          │  │
│  │ token: String (Encrypted AES-256-GCM)                    │  │
│  │ branch: String (default: "main")                         │  │
│  │ docsPath: String (default: "docs")                       │  │
│  │ createdAt: DateTime                                      │  │
│  │ updatedAt: DateTime                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                     │
│         ┌────────────────┼────────────────┐                   │
│         │                │                │                   │
│    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐             │
│    │   Doc    │    │   Lock   │    │  ApiKey  │             │
│    │ (1:N)    │    │ (1:1)    │    │ (1:N)    │             │
│    └──────────┘    └──────────┘    └──────────┘             │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│           Doc            │
├──────────────────────────┤
│ id: String (CUID, PK)    │
│ projectId: String (FK)   │
│ fileName: String         │
│ content: Text            │
│ hash: String (SHA-256)   │
│ version: Int             │
│ createdAt: DateTime      │
│ updatedAt: DateTime      │
├──────────────────────────┤
│ UNIQUE(projectId, fileName) │
│ INDEX(projectId)         │
└──────────────────────────┘

┌──────────────────────────┐
│          Lock            │
├──────────────────────────┤
│ id: String (CUID, PK)    │
│ projectId: String (FK, UNIQUE) │
│ lockedBy: String         │
│ lockedAt: DateTime       │
│ expiresAt: DateTime?     │
│ reason: String?          │
├──────────────────────────┤
│ INDEX(projectId)         │
│ INDEX(expiresAt)         │
└──────────────────────────┘

┌──────────────────────────┐
│         ApiKey           │
├──────────────────────────┤
│ id: String (CUID, PK)    │
│ projectId: String (FK)   │
│ key: String (UNIQUE)     │
│ name: String             │
│ isActive: Boolean        │
│ createdAt: DateTime      │
├──────────────────────────┤
│ INDEX(projectId)         │
│ INDEX(key)               │
└──────────────────────────┘
```

### Data Flow Patterns

#### Pattern 1: Create Project with Encryption

```
┌─────────┐    DTO     ┌────────────┐   Validate   ┌─────────┐
│ Client  │ ────────▶  │ Controller │ ───────────▶ │  Pipe   │
└─────────┘            └────┬───────┘              └─────────┘
                            │
                    Service │ Call
                            ▼
                  ┌──────────────────┐
                  │ ProjectsService  │
                  └────────┬─────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       Encrypt          Validate       Create
            ▼              ▼              ▼
   ┌──────────────┐  ┌──────────┐  ┌──────────┐
   │CryptoService │  │ Business │  │ Prisma   │
   │  (AES-GCM)   │  │  Logic   │  │ Service  │
   └──────────────┘  └──────────┘  └────┬─────┘
                                         │
                                    PostgreSQL
                                         ▼
                              ┌──────────────────┐
                              │ Encrypted token  │
                              │ stored in DB     │
                              └──────────────────┘
```

#### Pattern 2: Document Sync from GitHub

```
┌─────────┐   POST sync   ┌────────────┐
│ Client  │ ────────────▶ │DocsController│
└─────────┘               └────┬────────┘
                               │
                        Service│ Call
                               ▼
                    ┌──────────────────┐
                    │   DocsService    │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        Load Project    Decrypt Token   Fetch Docs
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Prisma  │  │  Crypto  │  │  GitHub  │
        │ Service  │  │ Service  │  │ Service  │
        └──────────┘  └──────────┘  └────┬─────┘
                                          │
                                    GitHub API
                                          ▼
                              ┌──────────────────┐
                              │ Fetch all .md    │
                              │ files from repo  │
                              └────────┬─────────┘
                                       │
                            For each file
                                       ▼
                              ┌──────────────────┐
                              │ Compute SHA-256  │
                              │ Upsert to DB     │
                              └──────────────────┘
```

#### Pattern 3: Lock Acquisition with Race Prevention

```
┌─────────┐ POST lock  ┌────────────┐   Validate  ┌─────────┐
│ Client  │ ─────────▶ │LockController│ ─────────▶ │AcquireLockDto│
└─────────┘            └────┬────────┘             └─────────┘
                            │
                     Service│ Call
                            ▼
                  ┌──────────────────┐
                  │   LockService    │
                  └────────┬─────────┘
                           │
                   BEGIN TX│ (Serializable)
                           ▼
              ┌─────────────────────────┐
              │ Prisma.$transaction()   │
              └────────┬────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    Check Lock    Verify Proj   Create Lock
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ findUnique│  │ findUnique│  │  create  │
   │ (tx)      │  │ (tx)      │  │ (tx)     │
   └────┬─────┘  └──────────┘  └──────────┘
        │
   If exists & active
        │
        ▼
  ConflictException
        │
   ROLLBACK
```

## API Architecture

### REST API Design

**URL Structure**: `/api/{resource}/{id?}/{sub-resource?}/{action?}`

**Examples**:
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/api-keys
POST   /api/projects/:projectId/docs/sync
POST   /api/projects/:projectId/lock/extend
```

### Request/Response Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ HTTP Request
     │ Headers: Content-Type, X-API-Key (optional)
     │ Body: JSON DTO
     ▼
┌──────────────────────────────┐
│    NestJS Middleware         │
│  1. CORS                     │
│  2. Body Parser              │
│  3. Rate Limiter (future)    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│    ValidationPipe            │
│  - Transform JSON → DTO      │
│  - Validate with decorators  │
│  - Throw BadRequestException │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│    Guards (optional)         │
│  - ApiKeyGuard               │
│  - Attach project to request │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│    Controller                │
│  - Extract params            │
│  - Call service methods      │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│    Service Layer             │
│  - Business logic            │
│  - Database operations       │
│  - External API calls        │
└────────┬─────────────────────┘
         │
         │ Success
         ▼
┌──────────────────────────────┐
│    Response Interceptor      │
│  - Format response           │
│  - Add metadata              │
└────────┬─────────────────────┘
         │
         │ HTTP 200/201
         ▼
┌──────────┐
│  Client  │
└──────────┘

         │ Error
         ▼
┌──────────────────────────────┐
│  GlobalExceptionFilter       │
│  - Log error                 │
│  - Format error response     │
│  - HTTP 4xx/5xx              │
└────────┬─────────────────────┘
         │
         ▼
┌──────────┐
│  Client  │
└──────────┘
```

## Security Architecture

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Layers                         │
│                                                                  │
│  Layer 1: CORS Protection                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ origin: FRONTEND_URL (http://localhost:3000)            │   │
│  │ credentials: true                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  Layer 2: API Key Authentication (Future - Phase 05)            │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │ Header: X-API-Key                                        │   │
│  │ Guard: ApiKeyGuard                                       │   │
│  │ Validation: Database lookup + isActive check            │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                    │
│  Layer 3: Input Validation                                      │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │ ValidationPipe                                           │   │
│  │ - Type checking                                          │   │
│  │ - Required fields                                        │   │
│  │ - Max lengths                                            │   │
│  │ - Format validation (URL, etc.)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Encryption Architecture

**Token Encryption (AES-256-GCM)**:
```
┌────────────────────────────────────────────────────────────┐
│                  Encryption Process                        │
│                                                            │
│  Plaintext Token                                          │
│       │                                                    │
│       ▼                                                    │
│  ┌─────────────────────────────────────────────┐          │
│  │ CryptoService.encrypt(token)                │          │
│  └───────────┬─────────────────────────────────┘          │
│              │                                             │
│    ┌─────────┼─────────┐                                  │
│    │         │         │                                  │
│    ▼         ▼         ▼                                  │
│  ┌────┐  ┌────┐  ┌─────────┐                             │
│  │ IV │  │Key │  │Algorithm│                              │
│  │16B │  │32B │  │AES-GCM  │                              │
│  └────┘  └────┘  └─────────┘                              │
│    │         │         │                                  │
│    └─────────┼─────────┘                                  │
│              ▼                                             │
│    ┌──────────────────┐                                   │
│    │ createCipheriv() │                                   │
│    └────────┬─────────┘                                   │
│             │                                              │
│    ┌────────┴────────┐                                    │
│    │                 │                                    │
│    ▼                 ▼                                    │
│ ┌──────┐      ┌──────────┐                               │
│ │Cipher│      │ Auth Tag │                               │
│ │ text │      │   (16B)  │                               │
│ └──────┘      └──────────┘                               │
│    │                 │                                    │
│    └────────┬────────┘                                    │
│             ▼                                              │
│   Format: {IV}:{AuthTag}:{Ciphertext}                    │
│             │                                              │
│             ▼                                              │
│        Store in DB                                        │
└────────────────────────────────────────────────────────────┘
```

**Content Hashing (SHA-256)**:
```
┌──────────────────────────────────────────┐
│       Document Content                   │
│              │                            │
│              ▼                            │
│   createHash('sha256')                   │
│              │                            │
│              ▼                            │
│   .update(content)                       │
│              │                            │
│              ▼                            │
│   .digest('hex')                         │
│              │                            │
│              ▼                            │
│   64-char hex string                     │
│              │                            │
│              ▼                            │
│   Store in Doc.hash field                │
│              │                            │
│              ▼                            │
│   Compare on sync to detect changes      │
└──────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling Strategy

```
┌────────────────────────────────────────────────────────────┐
│                      Load Balancer                         │
│                    (nginx / HAProxy)                       │
└───────┬────────────────┬────────────────┬──────────────────┘
        │                │                │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │ NestJS  │      │ NestJS  │      │ NestJS  │
   │Instance1│      │Instance2│      │Instance3│
   └────┬────┘      └────┬────┘      └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────▼────┐
                    │PostgreSQL│
                    │  Primary │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │                     │
         ┌────▼────┐           ┌────▼────┐
         │ Read    │           │ Read    │
         │ Replica │           │ Replica │
         └─────────┘           └─────────┘
```

**Stateless Design**:
- No session storage trên backend
- Locks stored trong database (shared state)
- API keys validated via database

### Database Performance

**Connection Pooling**:
```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings in DATABASE_URL:
  // ?connection_limit=20&pool_timeout=10
}
```

**Query Optimization**:
- Indexes on foreign keys (projectId, key)
- Indexes on query columns (expiresAt)
- Unique constraints prevent duplicates
- Select only needed fields

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────────────────┐
│              Local Development (Docker)                 │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Frontend   │    │   Backend    │                  │
│  │  (Next.js)   │    │   (NestJS)   │                  │
│  │  Port 3000   │    │  Port 3001   │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                              │                          │
│                      ┌───────▼────────┐                 │
│                      │   PostgreSQL   │                 │
│                      │    Port 5432   │                 │
│                      │  (Docker)      │                 │
│                      └────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### Production Environment (Future)

```
┌──────────────────────────────────────────────────────────┐
│                      Production                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │              CDN / Static Assets               │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     │                                    │
│  ┌──────────────────▼─────────────────────────────┐     │
│  │           Load Balancer (SSL/TLS)              │     │
│  └───────┬──────────────────────────┬─────────────┘     │
│          │                          │                    │
│     ┌────▼────┐                ┌────▼────┐              │
│     │Frontend │                │ Backend │              │
│     │Container│                │Container│              │
│     │(Next.js)│                │(NestJS) │              │
│     └─────────┘                └────┬────┘              │
│                                     │                    │
│                          ┌──────────▼──────────┐        │
│                          │  PostgreSQL Cluster │        │
│                          │  - Primary          │        │
│                          │  - Replicas         │        │
│                          │  - Backups          │        │
│                          └─────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

## Monitoring & Observability (Future)

### Logging Strategy

```
Application Logs
     │
     ├─► NestJS Logger
     │       │
     │       ├─► Info: Business events
     │       ├─► Warn: Potential issues
     │       ├─► Error: Exceptions + stack traces
     │       └─► Debug: Development info
     │
     ├─► Access Logs
     │       └─► HTTP requests/responses
     │
     └─► Audit Logs
             └─► Security events (auth, key generation)
```

### Metrics Collection (Planned)

- **Application Metrics**:
  - Request count per endpoint
  - Response times (p50, p95, p99)
  - Error rates
  - Active locks count

- **Database Metrics**:
  - Query latency
  - Connection pool utilization
  - Transaction rollback rate

- **Business Metrics**:
  - Projects created
  - Docs synced
  - API keys generated
  - Lock acquisitions

## Technology Stack Summary

### Backend Stack
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | NestJS | 10.3.0 | Application framework |
| Runtime | Node.js | 20+ | JavaScript runtime |
| Language | TypeScript | 5.4.0 | Type-safe development |
| Database | PostgreSQL | 14+ | Primary data store |
| ORM | Prisma | 5.10.0 | Database access |
| Validation | class-validator | 0.14.1 | DTO validation |
| Testing | Jest | 29.7.0 | Unit/integration tests |
| API Client | Octokit | 20.0.0 | GitHub API |

### Infrastructure
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container | Docker | Development environment |
| Orchestration | Docker Compose | Multi-container setup |
| CI/CD | GitHub Actions (future) | Automated deployment |
| Monitoring | TBD | Application monitoring |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Architecture Phase**: 02 - Backend Core Services
**Next Evolution**: Phase 05 - WebSocket & Real-time Features
