# Project Overview & Product Development Requirements (PDR)

**Project Name:** AI Toolkit Sync Platform
**Version:** 0.1.0 (Phase 06 Complete)
**Last Updated:** 2026-01-03
**Status:** Development - Phase 06/06 Complete (Testing & Deployment Infrastructure)

---

## Executive Summary

AI Toolkit Sync Platform is a centralized documentation management system that ensures consistency across AI-assisted development teams by providing a single source of truth for AI context files.

**Problem:** Multi-developer teams using AI coding assistants (e.g., Claude Code) produce inconsistent code because each developer provides different prompts, leading to divergent coding styles and patterns.

**Solution:** Web platform that centralizes 6 critical documentation files, restricts editing to Tech Leads, and auto-syncs changes to all developer workstations via `.docs/` folder with project locking during updates.

---

## Product Vision

### Mission
Eliminate AI-generated code inconsistencies in collaborative development by centralizing and synchronizing AI context across teams.

### Target Users
1. **Tech Leads** - Edit and manage documentation
2. **Developers** - Consume synced documentation via CLI hooks
3. **Team Managers** - Monitor documentation updates and project locks

### Success Metrics
- **Consistency Rate:** 95%+ code style adherence across team
- **Sync Latency:** \<5s from edit to workstation update
- **Lock Conflicts:** \<1% failed lock acquisitions
- **Adoption Rate:** 80%+ teams using hooks within 30 days

---

## Core Features

### 1. Centralized Documentation Repository
**Status:** 🔄 In Progress (Phase 01 Complete, Phase 02 Pending)

**Requirements:**
- FR-001: Store 6 documentation files per project (project-overview, code-standards, etc.)
- FR-002: Track version history with SHA-256 hashing
- FR-003: Support multiple projects per instance
- FR-004: Enforce unique filenames per project

**Acceptance Criteria:**
- [x] Database schema supports Doc model with versioning
- [ ] CRUD APIs for document management
- [ ] Hash-based change detection
- [ ] Version rollback capability

---

### 2. GitHub Integration
**Status:** 📝 Planned (Phase 02, Phase 05)

**Requirements:**
- FR-005: Authenticate via GitHub Personal Access Token (PAT)
- FR-006: Auto-commit documentation changes to `docs/` folder
- FR-007: Support custom branch and path configuration
- FR-008: Store encrypted GitHub credentials

**Acceptance Criteria:**
- [ ] Secure token encryption (AES-256-GCM)
- [ ] Octokit integration for Git operations
- [ ] Configurable repo URL, branch, docs path
- [ ] Audit log for all Git commits

**Security Requirements:**
- NFR-001: Encrypt GitHub tokens at rest
- NFR-002: Use separate encryption key from DATABASE_URL
- NFR-003: Implement key rotation mechanism
- NFR-004: Never log decrypted tokens

---

### 3. Project Locking Mechanism
**Status:** 🔄 In Progress (Schema Complete, Logic Pending)

**Requirements:**
- FR-009: Lock project during documentation edits
- FR-010: Auto-expire locks after configurable timeout (default 30min)
- FR-011: Display lock status to all users
- FR-012: Allow lock override by admins

**Acceptance Criteria:**
- [x] Lock model with expiresAt field
- [ ] Automatic lock acquisition on edit
- [ ] WebSocket notifications for lock changes
- [ ] Background job to clean expired locks

**Business Rules:**
- Only one lock per project at a time
- Lock owner can extend expiration
- Admin override requires reason (audit trail)

---

### 4. Monaco Editor Integration
**Status:** 📝 Planned (Phase 04)

**Requirements:**
- FR-013: Syntax highlighting for Markdown files
- FR-014: Live preview pane
- FR-015: Auto-save every 30 seconds
- FR-016: Conflict detection on save

**Acceptance Criteria:**
- [ ] Monaco Editor with Markdown language support
- [ ] Side-by-side preview rendering
- [ ] Debounced auto-save with optimistic UI
- [ ] Merge conflict resolution UI

---

### 5. Real-time Synchronization
**Status:** 📝 Planned (Phase 05)

**Requirements:**
- FR-017: WebSocket connection for active users
- FR-018: Broadcast documentation updates
- FR-019: Send lock status changes
- FR-020: Support reconnection after network loss

**Acceptance Criteria:**
- [ ] NestJS WebSocket Gateway
- [ ] Frontend Zustand store for socket state
- [ ] Auto-reconnect with exponential backoff
- [ ] Event-driven architecture (doc:updated, lock:acquired)

---

### 6. CLI Hooks for Claude Code
**Status:** 📝 Planned (Phase 05)

**Requirements:**
- FR-021: Pre-commit hook to sync latest docs
- FR-022: Validate API key before operations
- FR-023: Download docs to `.docs/` folder
- FR-024: Prevent commits if project locked

**Acceptance Criteria:**
- [ ] Bash script for Unix-like systems
- [ ] API key authentication
- [ ] Rate limiting (10 req/min per key)
- [ ] Error handling with user-friendly messages

---

### 7. API Key Management
**Status:** 🔄 In Progress (Schema Complete, APIs Pending)

**Requirements:**
- FR-025: Generate unique API keys per project
- FR-026: Support multiple keys per project (dev, prod, CI/CD)
- FR-027: Enable/disable keys without deletion
- FR-028: Display last used timestamp

**Acceptance Criteria:**
- [x] ApiKey model with isActive flag
- [ ] Key generation with cryptographic randomness
- [ ] CRUD APIs with project isolation
- [ ] Usage analytics (last used, request count)

---

## Non-Functional Requirements

### Performance
- NFR-005: API response time \<200ms (p95)
- NFR-006: Support 100 concurrent WebSocket connections
- NFR-007: Database queries use indexed fields
- NFR-008: Frontend bundle size \<500KB gzipped

### Scalability
- NFR-009: Horizontal scaling via stateless backend
- NFR-010: PostgreSQL read replicas for analytics
- NFR-011: Redis caching for frequently accessed docs

### Security
- NFR-012: HTTPS only in production
- NFR-013: CORS restricted to known origins
- NFR-014: Input validation on all API endpoints
- NFR-015: SQL injection prevention via Prisma parameterization
- NFR-016: XSS prevention via React escaping
- NFR-017: Rate limiting (100 req/min per IP)

### Reliability
- NFR-018: 99.5% uptime SLA
- NFR-019: Automated database backups (daily)
- NFR-020: Disaster recovery plan (4-hour RTO)
- NFR-021: Health check endpoint (/api/health)

### Usability
- NFR-022: Mobile-responsive UI (Tailwind breakpoints)
- NFR-023: Accessibility WCAG 2.1 AA compliance
- NFR-024: Onboarding tutorial for new users
- NFR-025: Keyboard shortcuts for editor actions

---

## Technical Constraints

### Technology Stack (Fixed)
- **Backend:** NestJS 10+ (TypeScript)
- **Frontend:** Next.js 14+ (App Router)
- **Database:** PostgreSQL 16+
- **ORM:** Prisma 5+
- **Real-time:** WebSocket (NestJS Gateway)
- **Version Control:** Git (Octokit for GitHub)

### Dependencies
- Node.js 20+
- pnpm (monorepo management)
- Docker (local development)

### Browser Support
- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

---

## System Architecture

### High-Level Design
```
┌─────────────┐      HTTPS      ┌─────────────┐
│             │ ──────────────▶ │   Next.js   │
│   Browser   │                 │   Frontend  │
│             │ ◀────────────── │   (Port 3000│
└─────────────┘   WebSocket     └─────────────┘
                                       │
                                   REST API
                                       │
                                       ▼
                                ┌─────────────┐
                                │   NestJS    │
                                │   Backend   │
                                │  (Port 3001)│
                                └─────────────┘
                                       │
                          ┌────────────┼────────────┐
                          │            │            │
                          ▼            ▼            ▼
                    ┌──────────┐ ┌──────────┐ ┌──────────┐
                    │PostgreSQL│ │  GitHub  │ │  Redis   │
                    │ (Prisma) │ │ (Octokit)│ │ (Cache)  │
                    └──────────┘ └──────────┘ └──────────┘
```

### Data Flow (Documentation Update)
1. Tech Lead edits doc in Monaco Editor
2. Frontend acquires project lock via POST /api/locks
3. Frontend saves doc via PUT /api/docs/:id
4. Backend updates database (hash, version++)
5. Backend commits to GitHub via Octokit
6. Backend broadcasts WebSocket event (doc:updated)
7. All connected clients refresh UI
8. CLI hooks poll /api/docs/latest for updates
9. Lock auto-expires after 30 minutes

---

## Development Phases

### Phase 01: Infrastructure & Database ✅ COMPLETE
- [x] Monorepo setup (pnpm workspaces)
- [x] Docker PostgreSQL
- [x] Prisma schema (4 models)
- [x] NestJS backend skeleton
- [x] Next.js frontend skeleton
- [x] Development scripts

**Deliverables:** Working local dev environment, database schema migrated

---

### Phase 02: Backend Core Services ✅ COMPLETE
**Estimated Effort:** 6 hours
**Status:** Delivered

**Completed Tasks:**
- [x] ProjectsModule (CRUD + encryption service)
- [x] DocsModule (versioning, hash detection)
- [x] LocksModule (auto-expiration, conflict handling)
- [x] ApiKeysModule (generation, validation)
- [x] Global error handling
- [x] Logging middleware

**Acceptance Criteria Met:**
- All CRUD endpoints functional
- GitHub tokens encrypted in database
- Unit tests for core services (80%+ coverage)
- API documentation (Swagger)

---

### Phase 03: Frontend Foundation ✅ COMPLETE
**Estimated Effort:** 5 hours
**Status:** Delivered

**Completed Tasks:**
- [x] Tailwind UI components (buttons, inputs, modals)
- [x] Layout with sidebar navigation
- [x] API client setup (TanStack Query)
- [x] Global state management (Zustand)
- [x] Error boundary components

**Acceptance Criteria Met:**
- Reusable component library
- Authenticated API calls
- Loading/error states handled
- Responsive design (mobile-first)

---

### Phase 04: Frontend Features ✅ COMPLETE
**Estimated Effort:** 8 hours
**Status:** Delivered

**Completed Tasks:**
- [x] Monaco Editor integration
- [x] Project management UI
- [x] Document editor with preview
- [x] Lock status indicator
- [x] API key management UI

---

### Phase 05: Real-time & GitHub Integration ✅ COMPLETE
**Estimated Effort:** 6 hours
**Status:** Delivered

**Completed Tasks:**
- [x] WebSocket Gateway (NestJS)
- [x] Octokit GitHub integration
- [x] CLI hook scripts
- [x] Auto-commit on doc save

---

### Phase 06: Testing & Deployment ✅ COMPLETE
**Estimated Effort:** 4 hours
**Status:** Delivered

**Completed Tasks:**
- [x] E2E tests (Jest + Supertest)
- [x] Component tests (Vitest + React Testing Library)
- [x] Integration testing checklist (TESTING.md)
- [x] Testing infrastructure and configuration
- [x] Production environment setup documentation

---

## Risk Management

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| GitHub API rate limits | High | Medium | Implement caching, batch commits |
| WebSocket scalability | Medium | Medium | Use Redis pub/sub for multi-instance |
| Database encryption performance | Low | Low | Benchmark, use hardware acceleration |
| Lock expiration race conditions | High | Low | Database-level locking with FOR UPDATE |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption (developers skip hooks) | High | Medium | Make setup frictionless, add VS Code extension |
| GitHub token leakage | Critical | Low | Encryption, key rotation, audit logs |
| Competitor launches similar tool | Medium | Medium | Rapid iteration, unique Claude Code integration |

---

## Change Log

### Version 0.1.0 (2026-01-03) - Phase 01 Complete
- Initial monorepo setup
- PostgreSQL database with 4 models
- NestJS backend bootstrap
- Next.js frontend skeleton
- Development environment configured

### Upcoming (Phase 02) - Planned 2026-01-04
- Backend CRUD APIs
- GitHub token encryption
- API documentation
- Unit tests

---

## Appendix

### Glossary
- **PAT:** Personal Access Token (GitHub authentication)
- **Lock:** Temporary exclusive edit permission for a project
- **Hook:** Script executed before Git operations (pre-commit, pre-push)
- **Sync:** Process of downloading latest docs to local `.docs/` folder

### Related Documents
- `docs/codebase-summary.md` - Technical implementation details
- `docs/code-standards.md` - Coding conventions
- `docs/system-architecture.md` - Detailed architecture diagrams
- `plans/260103-1818-ai-toolkit-sync-platform/plan.md` - Full project plan
