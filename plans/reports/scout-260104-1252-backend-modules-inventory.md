# Backend Modules Inventory

## All Backend Modules in `/src`

### 1. PRISMA Module
**Path:** `/src/prisma/`
**Files:**
- `prisma.module.ts` - Module definition
- `prisma.service.ts` - Database service with lifecycle hooks

**Purpose:** ORM service layer for PostgreSQL database via Prisma Client

---

### 2. CRYPTO Module
**Path:** `/src/common/services/`
**Files:**
- `crypto.module.ts` - Module definition
- `crypto.service.ts` - Encryption/decryption utilities

**Purpose:** Handle sensitive data encryption (GitHub PAT tokens)

---

### 3. PROJECTS Module
**Path:** `/src/projects/`
**Files:**
- `projects.module.ts` - Module definition
- `projects.service.ts` - Business logic
- `projects.controller.ts` - HTTP endpoints
- `dto/create-project.dto.ts` - Request validation
- `dto/update-project.dto.ts` - Request validation
- `projects.service.spec.ts` - Unit tests
- `projects.controller.spec.ts` - Controller tests

**Purpose:** Manage GitHub projects/repositories

---

### 4. DOCS Module
**Path:** `/src/docs/`
**Files:**
- `docs.module.ts` - Module definition
- `docs.service.ts` - Business logic
- `docs.controller.ts` - HTTP endpoints
- `dto/update-doc.dto.ts` - Request validation
- `docs.service.spec.ts` - Unit tests
- `docs.controller.spec.ts` - Controller tests

**Purpose:** Manage documentation files and content

---

### 5. LOCK Module
**Path:** `/src/lock/`
**Files:**
- `lock.module.ts` - Module definition
- `lock.service.ts` - Distributed locking logic
- `lock.controller.ts` - HTTP endpoints
- `dto/acquire-lock.dto.ts` - Request validation
- `dto/extend-lock.dto.ts` - Request validation
- `lock.service.spec.ts` - Unit tests
- `lock.controller.spec.ts` - Controller tests

**Purpose:** Concurrency control with distributed locks

---

### 6. GITHUB Module
**Path:** `/src/github/`
**Files:**
- `github.module.ts` - Module definition
- `github.service.ts` - GitHub API integration
- `github.service.spec.ts` - Unit tests

**Purpose:** GitHub repository operations via Octokit API

---

### 7. WEBSOCKET Module
**Path:** `/src/websocket/`
**Files:**
- `websocket.module.ts` - Module definition
- `websocket.gateway.ts` - WebSocket event handlers

**Purpose:** Real-time bidirectional communication using Socket.IO

---

### 8. HOOK Module
**Path:** `/src/hook/`
**Files:**
- `hook.module.ts` - Module definition
- `hook.service.ts` - Webhook processing
- `hook.controller.ts` - HTTP endpoints

**Purpose:** Handle GitHub webhooks

---

### 9. COMMON Module
**Path:** `/src/common/`
**Subdirectories:**

#### Decorators
- `api-key.decorator.ts` - API key extraction decorator

#### Filters
- `global-exception.filter.ts` - Centralized error handling

#### Guards
- (Directory exists, contents TBD)

#### Services
- `crypto.service.ts` - Encryption utilities
- `crypto.module.ts` - Crypto module wrapper

---

### 10. ROOT Module
**Path:** `/src/`
**Files:**
- `app.module.ts` - Root application module (imports all feature modules)
- `main.ts` - Application bootstrap (entry point)

---

## Module Dependencies Graph

```
AppModule
├── ConfigModule (env variables)
├── ThrottlerModule (rate limiting)
├── PrismaModule (database)
├── CryptoModule (encryption)
├── WebSocketModule (real-time)
├── ProjectsModule
├── DocsModule
│   ├── GitHubModule
│   └── CryptoModule
├── LockModule
├── GitHubModule (@octokit/rest)
└── HookModule
```

---

## File Count Summary

| Module | Files | Type |
|--------|-------|------|
| Projects | 7 | Service + Controller + DTOs + Tests |
| Docs | 7 | Service + Controller + DTOs + Tests |
| Lock | 7 | Service + Controller + DTOs + Tests |
| GitHub | 3 | Service + Module + Tests |
| Hook | 3 | Service + Controller + Module |
| Prisma | 2 | Service + Module |
| Crypto | 2 | Service + Module |
| WebSocket | 2 | Gateway + Module |
| Common | 3+ | Decorators, Filters, Guards |
| Root | 2 | App Module + Bootstrap |

**Total TypeScript files:** 38+

---

## Dependencies from package.json

### Direct Module Imports
```json
{
  "core": "@nestjs/common, @nestjs/core",
  "config": "@nestjs/config",
  "validation": "class-validator, class-transformer",
  "database": "@prisma/client",
  "websocket": "socket.io, @nestjs/websockets, @nestjs/platform-socket.io",
  "external-api": "@octokit/rest",
  "security": "@nestjs/throttler",
  "dev": "jest, ts-jest, @nestjs/testing, supertest"
}
```

