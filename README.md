# AI Toolkit Sync Platform

**Version:** 0.1.0 | **Status:** Phase 06 Complete (Testing & Deployment Infrastructure)

Centralized documentation management system for AI-assisted development teams ensuring consistency across collaborative development.

## Problem

Multi-developer teams using AI coding assistants (Claude Code) produce inconsistent code due to:
- Different prompts → different code styles
- No centralized "source of truth" for AI context
- Documentation can be accidentally modified or lost

## Solution

Web platform that:
- Centralizes 6 documentation files as single source of truth
- Restricts editing to Tech Leads via web interface
- Auto-syncs changes to all developer workstations via `.docs/` folder
- Locks projects during documentation updates to prevent conflicts
- Integrates with Claude Code via pre-commit hooks
- Provides real-time synchronization via WebSocket

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Shadcn/ui + Monaco Editor + TanStack Query
- **Backend:** NestJS 10 + Prisma 5 + PostgreSQL 16
- **Real-time:** WebSocket (NestJS Gateway)
- **Git Integration:** GitHub (Octokit)
- **Testing:** Jest (E2E), Vitest (Components)
- **Monorepo:** pnpm workspaces

## Project Structure

```
ai-toolkit-sync-platform/
├── apps/
│   ├── backend/              # NestJS API (Port 3001)
│   │   ├── src/              # Source code (8 modules)
│   │   └── test/             # E2E tests (Jest)
│   └── frontend/             # Next.js app (Port 3000)
│       ├── app/              # App Router pages
│       └── __tests__/        # Component tests (Vitest)
├── docs/                     # Project documentation
├── plans/                    # Development phases & reports
├── scripts/                  # Claude Code hooks
└── docker-compose.yml        # PostgreSQL container
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (package manager)
- Docker (for PostgreSQL)

### Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start development servers (parallel)
pnpm dev
```

### Development Commands

```bash
# Backend only (Port 3001)
pnpm dev:backend

# Frontend only (Port 3000)
pnpm dev:frontend

# Database tools
pnpm db:studio           # Prisma Studio UI (Port 5555)

# Testing
cd apps/backend && pnpm test:e2e    # Backend E2E tests
cd apps/frontend && pnpm test       # Frontend component tests
```

## Architecture Overview

### Backend (NestJS)
- 8 modules: Projects, Docs, Lock, GitHub, Hook, WebSocket, Common, Prisma
- PostgreSQL database with 4 models: Project, Doc, Lock, ApiKey
- REST API with real-time WebSocket support
- GitHub integration via Octokit

### Frontend (Next.js)
- 5 routes: home, projects list, project detail, settings, editor
- 19 components (12 feature + 7 Shadcn/ui)
- 4 custom hooks for data fetching and state management
- Monaco Editor for documentation editing
- Dark mode support with Tailwind CSS

### Database (PostgreSQL)
- 4 models with relationships and constraints
- Automatic migrations via Prisma
- Indexes on frequently queried fields
- Encryption for sensitive data (GitHub tokens)

## Documentation

See `./docs/` for comprehensive documentation:

- **project-overview-pdr.md** - Product vision, requirements, and development phases
- **codebase-summary.md** - Technical implementation details and metrics
- **code-standards.md** - Coding conventions and project structure standards
- **system-architecture.md** - Detailed architecture diagrams and design patterns
- **design-guidelines.md** - UI/UX standards and component specifications
- **project-roadmap.md** - Development phases and timeline
- **deployment-guide.md** - Production deployment instructions

## Development Phases

- **Phase 01** ✅ Infrastructure & Database
- **Phase 02** ✅ Backend Core Services
- **Phase 03** ✅ Frontend Foundation
- **Phase 04** ✅ Frontend Features
- **Phase 05** ✅ Real-time & GitHub Integration
- **Phase 06** ✅ Testing & Deployment Infrastructure

## Key Features

- Centralized documentation repository with version tracking
- Project locking mechanism during updates
- Real-time synchronization via WebSocket
- GitHub integration with auto-commit
- API key management for CLI/hook authentication
- Comprehensive E2E and component testing
- Dark mode UI with responsive design

## Testing

- **Backend:** Jest E2E tests with 85%+ coverage
- **Frontend:** Vitest component tests with 60%+ coverage
- **Integration:** Manual testing checklist in TESTING.md
- **Coverage Goals:** Backend 70-80%, Frontend 60%, E2E 100%

## Security

- GitHub tokens encrypted at rest (AES-256-GCM)
- API key authentication for all endpoints
- Input validation on all DTOs
- CORS protection with configurable origins
- SQL injection prevention via Prisma parameterization
- XSS prevention via React automatic escaping

## Performance

- API response time <200ms (p95)
- Support for 100+ concurrent WebSocket connections
- Database query optimization with indexes
- Frontend bundle size <500KB gzipped
- Lazy loading for Monaco Editor

## Contributing

See `./docs/code-standards.md` for:
- Naming conventions and file structure
- Backend (NestJS) standards
- Frontend (Next.js) standards
- TypeScript configuration
- Testing requirements
- Git commit message format

## License

Proprietary - Cloudteam Agentic
