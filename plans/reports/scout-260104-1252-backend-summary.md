# Backend Codebase Scout - Executive Summary

**Scout Report:** 2026-01-04 12:52  
**Location:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/backend`  
**Status:** Complete analysis of backend architecture

---

## Quick Facts

- **Framework:** NestJS 10.3.0 with TypeScript 5.4
- **Database:** PostgreSQL + Prisma ORM 5.10
- **Real-time:** Socket.IO + WebSocket
- **Modules:** 8 feature modules + 1 common utilities module
- **Files:** 38+ TypeScript files
- **API Prefix:** `/api`
- **Rate Limit:** 100 requests/minute

---

## Architecture Overview

### Layered Structure
```
┌─────────────────────────────────────┐
│      HTTP & WebSocket Layer         │
│  (Express + Socket.IO Gateway)      │
├─────────────────────────────────────┤
│    Controllers & Validation Layer   │
│  (Global validation, CORS, Auth)    │
├─────────────────────────────────────┤
│      Business Logic Layer           │
│  (Services for each feature)        │
├─────────────────────────────────────┤
│    Database Access Layer            │
│  (Prisma ORM + PostgreSQL)          │
└─────────────────────────────────────┘
```

### Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **HTTP Server** | Express 5.0 | REST API endpoints |
| **WebSocket** | Socket.IO 4.8 | Real-time updates |
| **Database** | PostgreSQL | Data persistence |
| **ORM** | Prisma 5.10 | Type-safe DB access |
| **Validation** | class-validator | Input validation |
| **Encryption** | Custom Crypto | Token encryption |
| **External API** | Octokit 20.0 | GitHub integration |
| **Rate Limiting** | NestJS Throttler | API protection |

---

## 8 Feature Modules

### 1. Projects Module
- **Endpoints:** CRUD operations for GitHub projects
- **DTOs:** create-project, update-project
- **Tests:** Service + Controller unit tests

### 2. Docs Module
- **Endpoints:** Manage documentation files
- **Dependencies:** GitHub module, Crypto module
- **DTOs:** update-doc
- **Tests:** Service + Controller unit tests

### 3. Lock Module
- **Endpoints:** Acquire/extend distributed locks
- **Purpose:** Prevent concurrent doc edits
- **DTOs:** acquire-lock, extend-lock
- **Tests:** Service + Controller unit tests

### 4. GitHub Module
- **Integration:** @octokit/rest client
- **Purpose:** Interact with GitHub repositories
- **Tests:** Service unit tests

### 5. WebSocket Module
- **Gateway:** Real-time event broadcasting
- **Technology:** Socket.IO
- **Purpose:** Live doc updates to clients

### 6. Hook Module
- **Endpoints:** Receive GitHub webhooks
- **Purpose:** React to repository events
- **Tests:** Service unit tests

### 7. Prisma Module
- **Service:** Database connection manager
- **Features:** Lifecycle hooks, test cleanup utilities
- **Schema:** 4 models (Project, Doc, Lock, ApiKey)

### 8. Crypto Module
- **Service:** Encrypt/decrypt sensitive data
- **Usage:** GitHub PAT token encryption

---

## Data Models (Prisma Schema)

### Project
- Stores GitHub repo metadata
- Fields: id, name, repoUrl, token (encrypted), branch, docsPath
- Relations: 1-to-many with Doc, Lock, ApiKey

### Doc
- Stores documentation content
- Fields: id, projectId, fileName, content, hash, version
- Unique constraint: [projectId, fileName]

### Lock
- Manages file editing locks
- Fields: id, projectId, lockedBy, lockedAt, expiresAt, reason
- Purpose: Prevent simultaneous edits

### ApiKey
- Authentication tokens
- Fields: id, projectId, key (unique), name, isActive
- Purpose: API access control

---

## Configuration & Security

### Application Setup (main.ts)
```typescript
- Global validation pipe (whitelist mode)
- Global exception filter
- CORS enabled (FRONTEND_URL configurable)
- Global API prefix: /api
- Default port: 3001
```

### Rate Limiting
```typescript
- 100 requests per minute
- Configured globally via ThrottlerModule
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `FRONTEND_URL` - CORS origin
- `PORT` - Server port (default 3001)
- `NODE_ENV` - Environment (development/production)

---

## Testing Infrastructure

### Jest Configuration
- **Root directory:** `src/`
- **Test pattern:** `*.spec.ts`
- **Coverage directory:** `../coverage`
- **Environment:** Node.js

### Test Commands
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:e2e     # End-to-end tests
```

### Test Files Present
- Service specs (`.service.spec.ts`)
- Controller specs (`.controller.spec.ts`)
- E2E config: `test/jest-e2e.json`

---

## Dependencies Summary

### Production Dependencies (11)
- @nestjs/* (7 packages) - Framework ecosystem
- @prisma/client - Database ORM
- class-validator, class-transformer - Validation
- @octokit/rest - GitHub API
- socket.io - WebSocket library
- rxjs, reflect-metadata - Utilities

### Dev Dependencies (8)
- @nestjs/cli, @nestjs/testing - Dev tools
- jest, ts-jest - Testing framework
- prisma - ORM CLI
- supertest - HTTP testing
- typescript - Language
- @types/* - Type definitions

---

## Key Architecture Patterns

1. **Feature Module Pattern**
   - Each feature is self-contained module
   - Clear separation of concerns
   - Reusable service exports

2. **Service-Controller Separation**
   - Controllers handle HTTP requests
   - Services contain business logic
   - DTOs validate inputs

3. **Dependency Injection**
   - NestJS IoC container manages dependencies
   - Loose coupling between modules
   - Testability through mocking

4. **Global Middleware Stack**
   - Validation pipes
   - Exception filters
   - Rate limiting
   - CORS handling

5. **Type Safety**
   - TypeScript 5.4 strict mode
   - Prisma-generated types
   - DTO validation at runtime

---

## File Locations Quick Reference

**Core Files:**
- `/src/app.module.ts` - Root module
- `/src/main.ts` - Application bootstrap

**Feature Modules:**
- `/src/projects/` - Project management
- `/src/docs/` - Documentation
- `/src/lock/` - Locking mechanism
- `/src/github/` - GitHub integration
- `/src/websocket/` - Real-time updates
- `/src/hook/` - Webhook handling

**Infrastructure:**
- `/src/prisma/` - Database service
- `/src/common/` - Shared utilities
- `/prisma/schema.prisma` - Data model

**Configuration:**
- `/package.json` - Dependencies
- `/tsconfig.json` - TypeScript config
- `/nest-cli.json` - NestJS config

---

## Insights & Next Steps

### Strengths
- Clean modular architecture
- Type-safe database access (Prisma)
- Real-time capabilities (WebSocket)
- Comprehensive testing setup
- Security considerations (encryption, validation)

### Areas to Explore
- Guard implementations (common/guards)
- Lock mechanism specifics (optimistic vs pessimistic)
- WebSocket event architecture
- GitHub webhook payload handling
- API key authentication flow

---

**Full Details:** See accompanying documents:
- `scout-260104-1252-backend-architecture.md` - Detailed analysis
- `scout-260104-1252-backend-modules-inventory.md` - Module-by-module breakdown

