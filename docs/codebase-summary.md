# Codebase Summary - AI Toolkit Sync Platform

**Last Updated:** 2026-01-03
**Phase:** Phase 01 Complete
**Status:** Infrastructure & Database Foundation Established

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

### Frontend
- **Framework:** Next.js 14.2.0 (App Router)
- **State Management:** Zustand 4.5.0, TanStack Query 5.28.0
- **Editor:** Monaco Editor 4.6.0
- **Styling:** Tailwind CSS 3.4.1
- **Language:** TypeScript 5.4.0

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
│   │   └── src/
│   │       ├── prisma/       # Prisma service (global module)
│   │       ├── app.module.ts # Root application module
│   │       └── main.ts       # Bootstrap with CORS, validation
│   └── frontend/             # Next.js application
│       └── app/
│           ├── layout.tsx    # Root layout with metadata
│           ├── page.tsx      # Landing page
│           └── globals.css   # Tailwind base styles
├── docs/                     # Project documentation
├── plans/                    # Development plans (6 phases)
├── scripts/                  # Claude Code hooks (future)
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
- **Testing Utility:** `cleanDatabase()` for non-production environments

### Bootstrap Configuration (main.ts)
- **Port:** 3001 (configurable via PORT env)
- **API Prefix:** `/api`
- **CORS:** Enabled for `http://localhost:3000` (configurable)
- **Validation:** Global pipes with whitelist, transform, forbid non-whitelisted
- **DTOs:** class-validator + class-transformer ready

---

## Frontend Architecture

### App Router Structure
```
app/
├── layout.tsx       # Root layout, metadata, global styles
├── page.tsx         # Landing page (placeholder)
└── globals.css      # Tailwind directives, dark mode support
```

### Configuration
- **Port:** 3000 (Next.js default)
- **Styling:** Tailwind CSS with PostCSS, dark mode support
- **Path Aliases:** `@/*` maps to app root
- **Module Resolution:** ESNext bundler mode

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

## Key Features Implemented (Phase 01)

### ✅ Completed
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

### 🔄 Pending (Future Phases)
- [ ] GitHub token encryption (CRITICAL - Phase 02)
- [ ] CRUD APIs for Projects, Docs, Locks, ApiKeys (Phase 02)
- [ ] WebSocket real-time sync (Phase 05)
- [ ] Monaco Editor integration (Phase 04)
- [ ] GitHub Octokit integration (Phase 05)
- [ ] Authentication & authorization (Phase 02)
- [ ] CLI hooks for Claude Code (Phase 05)

---

## Code Quality & Standards

### TypeScript Configuration
- **Target:** ES2022
- **Module System:** CommonJS (backend), ESNext (frontend)
- **Strict Mode:** Enabled
- **Decorators:** Enabled (NestJS requirement)
- **Declaration Maps:** Enabled for debugging

### Linting & Testing
- **Backend:** ESLint configured, Jest ready
- **Frontend:** Next.js built-in linting
- **Coverage:** Jest configured with coverage directory

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

- **Total Files:** 37 (excluding node_modules)
- **Total Lines of Code:** ~8,864 (via repomix)
- **Backend LoC:** ~150
- **Frontend LoC:** ~50
- **Database Models:** 4
- **API Endpoints:** 0 (Phase 02)
- **Test Coverage:** 0% (Phase 06)

---

## References

- Phase Plan: `plans/260103-1818-ai-toolkit-sync-platform/phase-01-infrastructure-database.md`
- Code Review: `apps/frontend/plans/reports/code-reviewer-260103-1912-phase01.md`
- Repomix Output: `repomix-output.xml`
