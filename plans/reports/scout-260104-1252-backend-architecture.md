# Backend Architecture Scout Report
**Date:** 2026-01-04 12:52  
**Directory:** `/Users/typham/Documents/GitHub/Cloudteam-Agentic/apps/backend`

## 1. Module Structure

### Core Modules
- **app.module.ts** - Main application module importing all feature modules
- **main.ts** - Entry point with configuration (CORS, validation, global prefix)

### Feature Modules (8 total)
| Module | Purpose | Key Files |
|--------|---------|-----------|
| **Prisma** | Database ORM layer | prisma.service.ts, prisma.module.ts |
| **Crypto** | Encryption/decryption utilities | crypto.service.ts, crypto.module.ts |
| **Projects** | Project CRUD operations | projects.service.ts, projects.controller.ts |
| **Docs** | Documentation management | docs.service.ts, docs.controller.ts |
| **Lock** | Distributed locking mechanism | lock.service.ts, lock.controller.ts |
| **GitHub** | GitHub API integration | github.service.ts, github.module.ts |
| **WebSocket** | Real-time communication | websocket.gateway.ts, websocket.module.ts |
| **Hook** | Webhook handling | hook.service.ts, hook.controller.ts |

### Common Utilities (`/src/common`)
- **Decorators**: api-key.decorator.ts
- **Filters**: global-exception.filter.ts
- **Guards**: (directory exists)
- **Services**: crypto.service.ts, crypto.module.ts

## 2. Technology Stack

### Core Framework
- **NestJS** 10.3.0 - Backend framework (CommonJS)
- **Express** 5.0.6 - Underlying HTTP server
- **TypeScript** 5.4.0 - Language

### Database & ORM
- **Prisma** 5.10.0 - ORM with PostgreSQL
- **PostgreSQL** - Primary database (DATABASE_URL in .env)

### Real-time Communication
- **Socket.IO** 4.8.3 - WebSocket support
- **@nestjs/websockets** 10.3.0 - NestJS WebSocket integration

### Third-party Integration
- **@octokit/rest** 20.0.0 - GitHub API client

### Validation & Security
- **class-validator** 0.14.1 - DTO validation
- **class-transformer** 0.5.1 - DTO transformation
- **@nestjs/throttler** 6.5.0 - Rate limiting (100 req/min)

### Configuration Management
- **@nestjs/config** 4.0.2 - Environment variables

### Utilities
- **rxjs** 7.8.1 - Reactive extensions
- **reflect-metadata** 0.2.0 - Metadata reflection

## 3. Database Schema (Prisma)

Four core models with relationships:

```
Project (1 → Many)
├─ Doc (documents per project)
├─ Lock (distributed lock per project)
└─ ApiKey (API authentication keys)
```

### Models Summary
- **Project** - GitHub repo metadata (name, repoUrl, token, branch, docsPath)
- **Doc** - Documentation files (fileName, content, hash, version tracking)
- **Lock** - Concurrency control (lockedBy, expiresAt, reason)
- **ApiKey** - API authentication (key, name, isActive)

## 4. Architecture Patterns

### Design Patterns Identified
1. **Module Pattern** - Feature-based modular architecture
2. **Service-Controller Pattern** - Standard NestJS separation of concerns
3. **Global Pipes** - Validation at application level (whitelist, forbid non-whitelisted)
4. **Global Filters** - Centralized error handling
5. **DTO Pattern** - Data validation objects (create-*.dto.ts, update-*.dto.ts)
6. **Middleware Stack** - CORS, validation, rate limiting

### Configuration
- **Global API prefix:** `/api`
- **CORS enabled** with configurable FRONTEND_URL
- **Rate limiting:** 100 requests/minute
- **Global validation:** Transform, whitelist enabled, forbid unknown fields

## 5. Testing Infrastructure

### Test Setup (Jest)
- **test:** Run all tests
- **test:watch:** Watch mode
- **test:e2e:** End-to-end tests
- **Jest config** with TypeScript support (ts-jest)
- **Coverage directory:** `../coverage`

### Test Files Found
- `*.spec.ts` files in each module (service, controller tests)
- E2E tests config: `test/jest-e2e.json`

## 6. Key Dependencies Summary

| Category | Dependencies |
|----------|---|
| **NestJS Ecosystem** | @nestjs/common, @nestjs/core, @nestjs/config, @nestjs/platform-express, @nestjs/platform-socket.io, @nestjs/websockets, @nestjs/throttler |
| **Database** | @prisma/client, prisma |
| **Validation** | class-validator, class-transformer |
| **External APIs** | @octokit/rest |
| **Real-time** | socket.io |
| **Dev Tools** | ts-jest, jest, @nestjs/testing, supertest |

## 7. Project Structure

```
apps/backend/
├── src/
│   ├── app.module.ts (root module)
│   ├── main.ts (bootstrap)
│   ├── prisma/ (database service)
│   ├── common/ (shared decorators, filters, guards, services)
│   ├── projects/ (project management)
│   ├── docs/ (documentation)
│   ├── lock/ (concurrency control)
│   ├── github/ (GitHub integration)
│   ├── websocket/ (real-time updates)
│   └── hook/ (webhook handling)
├── prisma/
│   └── schema.prisma (data model definition)
├── test/ (E2E tests)
├── package.json (dependencies)
├── tsconfig.json (TypeScript config)
└── nest-cli.json (NestJS CLI config)
```

## 8. Key Insights

- **Modular Design** - Clear separation of concerns with feature modules
- **Database First** - Prisma provides type-safe ORM with migrations
- **Real-time Capable** - WebSocket support for live updates
- **GitHub-Integrated** - Native GitHub API integration via @octokit
- **Production Ready** - Rate limiting, global exception handling, CORS configured
- **Testing Focused** - Spec files and E2E testing infrastructure
- **Scalable Schema** - Foreign key relationships and indexes for performance
- **Encrypted Storage** - Token field marked for encryption in Project model

---

**Unresolved Questions:**
- Implementation details of lock mechanism (optimistic/pessimistic locking)
- GitHub webhook payload handling specifics
- WebSocket event naming conventions
