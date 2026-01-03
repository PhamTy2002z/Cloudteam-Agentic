# AI Toolkit Sync Platform - Implementation Plan

---
title: "AI Toolkit Sync Platform"
description: "Web platform for centralized docs management for AI-assisted dev teams"
status: in-progress
priority: P1
effort: 32h
branch: main
tags: [nestjs, nextjs, prisma, websocket, monaco, platform]
created: 2026-01-03
updated: 2026-01-03
---

## Executive Summary

Build a web platform for centralized documentation management enabling:
- Project CRUD with GitHub repo connection
- Monaco-based docs editor with markdown preview
- Lock mechanism (auto-lock when editing)
- Real-time lock notifications via WebSocket
- API keys for Claude Code hooks
- Hook scripts for dev workstation integration

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 App Router, Shadcn/ui, TanStack Query, Zustand, Monaco Editor |
| Backend | NestJS, Prisma, PostgreSQL, @nestjs/websockets, Octokit |
| Integration | Claude Code hooks (bash scripts) |

---

## Dependency Graph

```
Phase 01 (Infrastructure) ─────────────────┐
     │                                      │
     ├──► Phase 02 (Backend Services)       │
     │         │                            │
     │         ├──► Phase 05 (WebSocket)    │
     │         │                            │
     │         └──────────────────────┐     │
     │                                │     │
     └──► Phase 03 (Frontend Found.) ─┤     │
               │                      │     │
               └──► Phase 04 (Pages) ─┴──► Phase 06 (Testing)
```

## Parallelization Groups

| Group | Phases | Can Start After | Estimated Duration |
|-------|--------|-----------------|-------------------|
| A | Phase 01 | Start immediately | 4h |
| B | Phase 02 + Phase 03 | Group A complete | 8h (parallel) |
| C | Phase 04 + Phase 05 | Group B complete | 8h (parallel) |
| D | Phase 06 | Group C complete | 4h |

**Total Critical Path:** ~24h (vs 32h if sequential)

---

## File Ownership Matrix

Each file is owned by EXACTLY ONE phase. No cross-phase file conflicts.

### Phase 01: Infrastructure & Database
```
apps/backend/prisma/
  └── schema.prisma
  └── migrations/
apps/backend/src/prisma/
  └── prisma.service.ts
  └── prisma.module.ts
docker-compose.yml
.env.example
tsconfig.base.json
package.json (root)
apps/backend/package.json
apps/frontend/package.json
```

### Phase 02: Backend Core Services
```
apps/backend/src/
  ├── main.ts
  ├── app.module.ts
  ├── projects/
  │   ├── projects.controller.ts
  │   ├── projects.service.ts
  │   ├── projects.module.ts
  │   └── dto/
  ├── docs/
  │   ├── docs.controller.ts
  │   ├── docs.service.ts
  │   ├── docs.module.ts
  │   └── dto/
  ├── lock/
  │   ├── lock.controller.ts
  │   ├── lock.service.ts
  │   └── lock.module.ts
  ├── github/
  │   ├── github.service.ts
  │   └── github.module.ts
  └── common/
      ├── guards/
      │   └── api-key.guard.ts
      ├── filters/
      │   └── global-exception.filter.ts
      └── decorators/
```

### Phase 03: Frontend Foundation
```
apps/frontend/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── globals.css
  ├── lib/
  │   ├── providers.tsx
  │   ├── query-client.ts
  │   └── utils.ts
  ├── components/ui/
  │   └── (shadcn components)
  ├── stores/
  │   └── ui-store.ts
  ├── tailwind.config.ts
  └── next.config.js
```

### Phase 04: Frontend Features
```
apps/frontend/
  ├── app/(dashboard)/
  │   ├── layout.tsx
  │   ├── projects/
  │   │   ├── page.tsx
  │   │   └── [id]/
  │   │       ├── page.tsx
  │   │       └── settings/page.tsx
  │   └── editor/
  │       └── [id]/[docId]/page.tsx
  ├── components/
  │   ├── project-card.tsx
  │   ├── create-project-dialog.tsx
  │   ├── monaco-editor.tsx
  │   ├── markdown-preview.tsx
  │   ├── lock-status.tsx
  │   ├── sidebar.tsx
  │   └── header.tsx
  └── hooks/
      ├── use-websocket.ts
      ├── use-projects.ts
      └── use-lock.ts
```

### Phase 05: Backend Real-time & Hooks API
```
apps/backend/src/
  ├── websocket/
  │   ├── websocket.gateway.ts
  │   └── websocket.module.ts
  └── hook/
      ├── hook.controller.ts
      ├── hook.service.ts
      └── hook.module.ts
scripts/
  ├── check-platform.sh
  └── protect-docs.sh
```

### Phase 06: Integration & Testing
```
apps/backend/test/
  ├── app.e2e-spec.ts
  ├── projects.e2e-spec.ts
  └── lock.e2e-spec.ts
apps/frontend/
  └── __tests__/
      ├── components/
      └── hooks/
jest.config.js (backend)
vitest.config.ts (frontend)
playwright.config.ts
```

---

## Phase Details

| Phase | File | Description | Status |
|-------|------|-------------|--------|
| 01 | [phase-01-infrastructure-database.md](./phase-01-infrastructure-database.md) | Prisma, Docker, env setup | ✅ DONE (2026-01-03) |
| 02 | [phase-02-backend-core-services.md](./phase-02-backend-core-services.md) | NestJS controllers/services | ✅ DONE (2026-01-03) |
| 03 | [phase-03-frontend-foundation.md](./phase-03-frontend-foundation.md) | Next.js, Shadcn, state | ✅ DONE (2026-01-03) |
| 04 | [phase-04-frontend-features.md](./phase-04-frontend-features.md) | Pages, components, hooks | ✅ DONE (2026-01-03) |
| 05 | [phase-05-backend-realtime-hooks.md](./phase-05-backend-realtime-hooks.md) | WebSocket, Claude hooks | ✅ DONE (2026-01-03) |
| 06 | [phase-06-integration-testing.md](./phase-06-integration-testing.md) | E2E, unit tests | Pending |

---

## Execution Strategy

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL client (optional)
- pnpm (recommended)

### Execution Commands

```bash
# Group A: Start Phase 01
coder phase-01

# Group B: Run Phase 02 + Phase 03 in parallel
coder phase-02 &
coder phase-03 &
wait

# Group C: Run Phase 04 + Phase 05 in parallel
coder phase-04 &
coder phase-05 &
wait

# Group D: Finalize with Phase 06
coder phase-06
```

### Conflict Prevention Strategy

1. **Strict File Ownership**: Each file belongs to exactly one phase
2. **No Cross-Phase Imports During Development**: Phases use interface contracts
3. **Integration Points Defined**: Clear API contracts between frontend/backend
4. **Shared Types Package**: Common types in `libs/shared/types.ts` (owned by Phase 01)

---

## API Contracts

### REST Endpoints (Backend -> Frontend)

| Endpoint | Method | Response |
|----------|--------|----------|
| `GET /projects` | GET | `Project[]` |
| `POST /projects` | POST | `Project` |
| `GET /projects/:id` | GET | `Project` |
| `PUT /projects/:id` | PUT | `Project` |
| `DELETE /projects/:id` | DELETE | `void` |
| `GET /projects/:id/docs` | GET | `Doc[]` |
| `GET /projects/:id/docs/:file` | GET | `Doc` |
| `PUT /projects/:id/docs/:file` | PUT | `Doc` |
| `POST /projects/:id/docs/sync` | POST | `{success: boolean}` |
| `GET /projects/:id/lock` | GET | `Lock \| null` |
| `POST /projects/:id/lock` | POST | `Lock` |
| `DELETE /projects/:id/lock` | DELETE | `void` |

### Hook API (Backend -> Claude Code)

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `GET /hook/status/:id` | GET | API Key | `{locked, lockedBy?, lockedAt?}` |
| `GET /hook/docs/:id` | GET | API Key | `{hash}` |
| `POST /hook/sync/:id` | POST | API Key | `{docs: DocFile[]}` |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `lock:acquired` | Server -> Client | `{projectId, lockedBy, lockedAt}` |
| `lock:released` | Server -> Client | `{projectId}` |
| `doc:updated` | Server -> Client | `{projectId, docId, hash}` |

---

## Database Schema

```prisma
model Project {
  id        String   @id @default(cuid())
  name      String
  repoUrl   String
  token     String   // Encrypted GitHub PAT
  branch    String   @default("main")
  docsPath  String   @default("docs")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  docs      Doc[]
  locks     Lock[]
  apiKeys   ApiKey[]
}

model Doc {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  fileName  String
  content   String   @db.Text
  hash      String
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([projectId, fileName])
}

model Lock {
  id        String    @id @default(cuid())
  projectId String    @unique
  project   Project   @relation(fields: [projectId], references: [id])
  lockedBy  String
  lockedAt  DateTime  @default(now())
  expiresAt DateTime?
  reason    String?
  @@index([projectId])
}

model ApiKey {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  key       String   @unique
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

---

## Success Criteria

- [ ] Project CRUD with GitHub repo connection working
- [ ] Monaco editor loads and saves docs
- [ ] Lock acquired on editor open, released on close
- [ ] WebSocket broadcasts lock status changes
- [ ] API keys can be generated for hook auth
- [ ] check-platform.sh blocks dev when locked
- [ ] protect-docs.sh blocks .docs/ and docs/ writes
- [ ] All E2E tests pass

---

## Validation Summary

**Validated:** 2026-01-03
**Questions asked:** 6

### Confirmed Decisions
- **Package manager**: pnpm (monorepo workspaces)
- **Lock TTL**: 30 minutes auto-expire
- **GitHub tokens**: AES-256 encrypted in database (not env vars)
- **Database setup**: Docker Compose for PostgreSQL
- **Offline mode**: Allow cached `.docs/` when platform unreachable
- **Phase 05 cross-ownership**: Accepted - Phase 05 can modify `LockService` for WebSocket notifications

### Action Items
- [ ] Add `crypto.service.ts` in Phase 02 for AES-256 token encryption
- [ ] Update `ProjectsService` to encrypt/decrypt tokens via CryptoService

---

## Unresolved Questions

1. **Hosting provider**: Not decided by CEO. Plan assumes Docker-based deployment.
2. **Auth for platform UI**: MVP skips auth. Add OAuth later if needed.
3. ~~**Lock TTL**: Defaulting to 30 minutes auto-expire. Confirm with team.~~ ✅ Confirmed
4. **Multi-project per repo**: Scope limited to 1 project = 1 repo for MVP.

---

## References

- Brainstorm: `plans/reports/brainstorm-260103-1704-ai-toolkit-sync-platform.md`
- NestJS research: `plans/reports/researcher-260103-1819-nestjs-prisma-best-practices.md`
- Next.js research: `plans/reports/researcher-260103-1819-nextjs14-monaco-platform.md`
- Design system: `docs/design-guidelines.md`
- Wireframes: `docs/wireframes/`

---

*Generated: 2026-01-03*
