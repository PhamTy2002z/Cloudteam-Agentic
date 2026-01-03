# Codebase Summary

**Tổng quan hệ thống AI Toolkit Sync Platform - Backend Core Services**

## Thông Tin Dự Án

- **Tên dự án**: AI Toolkit Sync Platform (Backend)
- **Phiên bản**: 0.0.1
- **Framework chính**: NestJS 10.3.0
- **Runtime**: Node.js
- **Database**: PostgreSQL (via Prisma ORM 5.10.0)
- **Ngôn ngữ**: TypeScript 5.4.0
- **Testing**: Jest 29.7.0

## Technology Stack

### Core Dependencies
- **NestJS**: 10.3.0 - Progressive Node.js framework
- **Prisma**: 5.10.0 - Type-safe database ORM
- **Socket.IO**: ^4.8.1 - Real-time WebSocket communication (Phase 05)
- **@nestjs/websockets**: ^10.4.12 - NestJS WebSocket integration (Phase 05)
- **@nestjs/platform-socket.io**: ^10.4.12 - Socket.IO adapter (Phase 05)
- **class-validator**: 0.14.1 - DTO validation
- **class-transformer**: 0.5.1 - Object transformation
- **@octokit/rest**: 20.0.0 - GitHub API client
- **@nestjs/config**: 4.0.2 - Configuration management
- **@nestjs/throttler**: 6.5.0 - Rate limiting

### Security Stack
- **Node.js crypto**: AES-256-GCM encryption, SHA-256 hashing
- **API Key Authentication**: Custom guard with database validation
- **Input Validation**: DTOs with class-validator decorators

## Architecture Overview

### Module Structure

```
backend/src/
├── common/              # Shared utilities
│   ├── services/        # CryptoService (AES-256-GCM, SHA-256)
│   ├── guards/          # ApiKeyGuard
│   ├── filters/         # GlobalExceptionFilter
│   └── decorators/      # @CurrentProject
├── websocket/           # WebSocket gateway (Phase 05)
├── hook/                # Hook API endpoints (Phase 05)
├── projects/            # Project CRUD + API keys
├── docs/                # Document sync & management
├── lock/                # TTL-based locking system
├── github/              # GitHub API integration
└── prisma/              # Database service
```

### Database Schema (Prisma)

**Project** - Quản lý GitHub repositories
- `id`: CUID primary key
- `name`: Tên project
- `repoUrl`: GitHub repository URL
- `token`: Encrypted GitHub PAT (AES-256-GCM)
- `branch`: Target branch (default: main)
- `docsPath`: Docs directory path (default: docs)
- Relations: docs[], locks[], apiKeys[]

**Doc** - Quản lý tài liệu Markdown
- `id`: CUID primary key
- `projectId`: Foreign key → Project
- `fileName`: Tên file
- `content`: Nội dung (TEXT)
- `hash`: SHA-256 content hash
- `version`: Version counter
- Unique constraint: (projectId, fileName)

**Lock** - Phòng tránh race conditions
- `id`: CUID primary key
- `projectId`: UNIQUE foreign key → Project
- `lockedBy`: User/process identifier
- `lockedAt`: Timestamp
- `expiresAt`: TTL timestamp (default: 30 phút)
- `reason`: Optional lock reason

**ApiKey** - Authentication cho hooks
- `id`: CUID primary key
- `projectId`: Foreign key → Project
- `key`: UNIQUE generated key (sk_[64 hex chars])
- `name`: Key identifier
- `isActive`: Boolean flag
- Indexes: projectId, key

## Core Modules

### 1. WebSocket Module (Phase 05)

**Chức năng**:
- Real-time notifications cho project events
- Socket.IO-based WebSocket gateway
- API key authentication cho WebSocket connections
- Room-based event broadcasting

**Gateway**: `NotificationsGateway`
- **Connection authentication**: API key validation qua handshake
- **Room management**: Join/leave project rooms (`project:{projectId}`)
- **Event types**:
  - `lock:acquired` - Project được lock
  - `lock:released` - Project được unlock
  - `doc:updated` - Document được cập nhật

**Connection Flow**:
```typescript
// Client connects with API key
socket.connect({
  auth: { apiKey: 'sk_xxx' },
  // or via header: { 'x-api-key': 'sk_xxx' }
  // or via query: ?apiKey=sk_xxx
});

// Server validates API key → Prisma lookup
// Store projectId in socket.data
// Auto-disconnect if invalid/inactive key
```

**Client Messages**:
- `join` - Join project room (requires JoinMessage with projectId)
- `leave` - Leave project room

**Server Events**:
- `lock:acquired` - Broadcast khi lock được acquire
- `lock:released` - Broadcast khi lock được release
- `doc:updated` - Broadcast khi document được update

**Security**:
- CUID pattern validation (`/^c[a-z0-9]{24}$/`)
- Project-scoped rooms (clients chỉ join được project của mình)
- Authentication required cho tất cả operations

**CORS Configuration**:
```typescript
cors: {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}
```

**Integration**:
- Global module exported to all services
- `LockService` gọi `notifyLockAcquired/Released()`
- `DocsService` sẽ gọi `notifyDocUpdated()` (future)

### 2. Hook Module (Phase 05)

**Chức năng**:
- API endpoints cho Claude Code hooks integration
- Pre-session lock status checks
- Docs sync với hash comparison
- Bridge giữa CLI scripts và backend services

**API Endpoints**:
```
GET  /api/hook/status/:projectId   - Check lock status
GET  /api/hook/docs/:projectId     - Get docs hash
POST /api/hook/sync/:projectId     - Sync docs to local
```

**Authentication**: `@UseGuards(ApiKeyGuard)` - Requires `X-API-Key` header

**Response Types**:

**Status Response** (`HookStatusResponse`):
```typescript
{
  locked: boolean;
  lockedBy?: string;    // User/process identifier
  lockedAt?: string;    // ISO timestamp
  expiresAt?: string;   // Lock expiration
}
```

**Docs Hash Response** (`HookDocsHashResponse`):
```typescript
{
  hash: string;         // Aggregate SHA-256 hash
  docsCount: number;    // Total docs in project
}
```

**Sync Response** (`HookSyncResponse`):
```typescript
{
  docs: [
    {
      fileName: string;   // e.g., "code-standards.md"
      content: string;    // Full markdown content
      hash: string;       // Individual doc hash
    }
  ],
  hash: string;          // Aggregate hash
}
```

**Integration với Scripts**:
- `check-platform.sh` → `GET /hook/status/:projectId`
- `check-platform.sh` → `GET /hook/docs/:projectId` (hash comparison)
- `check-platform.sh` → `POST /hook/sync/:projectId` (nếu outdated)

**Use Cases**:
1. **Pre-session check**: Claude Code hook kiểm tra lock trước khi start
2. **Docs sync**: So sánh hash, chỉ sync khi có changes
3. **Offline mode**: Scripts cache `.docs/.sync-hash` để fallback

### 3. Projects Module

**Chức năng**:
- CRUD operations cho projects
- GitHub PAT encryption (AES-256-GCM)
- API key generation & revocation
- Token decryption helper

**API Endpoints**:
```
POST   /api/projects              - Tạo project mới
GET    /api/projects              - List all projects
GET    /api/projects/:id          - Chi tiết project
PUT    /api/projects/:id          - Cập nhật project
DELETE /api/projects/:id          - Xóa project
POST   /api/projects/:id/api-keys - Generate API key
DELETE /api/projects/api-keys/:keyId - Revoke API key
```

**Security Features**:
- GitHub PAT được mã hóa với AES-256-GCM trước khi lưu DB
- API key format: `sk_` + 64 hex characters (32 random bytes)
- Tokens KHÔNG được trả về trong API responses
- Method `getDecryptedToken()` cho internal services

**DTOs**:
- `CreateProjectDto`: name, repoUrl, token, branch?, docsPath?
- `UpdateProjectDto`: PartialType(CreateProjectDto)

### 2. Docs Module

**Chức năng**:
- Sync documents từ GitHub repository
- Update local document content
- Push documents về GitHub
- Content versioning với SHA-256 hashing

**API Endpoints**:
```
GET  /api/projects/:projectId/docs          - List docs
GET  /api/projects/:projectId/docs/:fileName - Get doc
PUT  /api/projects/:projectId/docs/:fileName - Update doc
POST /api/projects/:projectId/docs/sync      - Sync từ GitHub
POST /api/projects/:projectId/docs/:fileName/push - Push về GitHub
```

**Integration**:
- Sử dụng `GitHubService` để fetch/push documents
- SHA-256 hash để detect content changes
- Auto-increment version khi update
- Upsert pattern cho sync operations

**DTOs**:
- `UpdateDocDto`: content (required string)

### 4. Lock Module (Updated Phase 05)

**Chức năng**:
- Acquire/release project locks
- TTL-based expiration (30 phút default)
- Race condition prevention với database transactions
- Lock extension mechanism
- **WebSocket notifications** cho lock events (Phase 05)

**API Endpoints**:
```
GET    /api/projects/:projectId/lock        - Get lock status
POST   /api/projects/:projectId/lock        - Acquire lock
DELETE /api/projects/:projectId/lock        - Release lock
POST   /api/projects/:projectId/lock/extend - Extend lock TTL
```

**Race Condition Protection**:
```typescript
await prisma.$transaction(
  async (tx) => {
    // Check + Create lock atomically
  },
  {
    isolationLevel: 'Serializable',
    timeout: 5000,
  }
)
```

**WebSocket Integration** (Phase 05):
```typescript
// After successful lock acquisition
this.notifications.notifyLockAcquired(
  projectId,
  lockedBy,
  lock.lockedAt.toISOString(),
);

// After lock release
this.notifications.notifyLockReleased(projectId);
```

**Real-time Events**:
- Clients trong `project:{projectId}` room nhận lock events
- Frontend có thể show notifications/UI updates
- Prevents multiple users editing simultaneously

**DTOs**:
- `AcquireLockDto`: lockedBy (required), reason? (optional)
- `ExtendLockDto`: minutes? (optional)

### 5. GitHub Service

**Chức năng**:
- Octokit wrapper cho GitHub API
- Fetch single/multiple markdown files
- Push documents với auto-SHA resolution
- SHA-256 content hashing

**Methods**:
- `getDocFile()`: Fetch single .md file
- `getAllDocs()`: List & fetch all .md files trong docsPath
- `pushDoc()`: Create/update file trên GitHub
- `computeHash()`: SHA-256 content hash

**URL Parsing**:
```typescript
// Supports both formats:
// https://github.com/owner/repo
// git@github.com:owner/repo.git
parseRepoUrl(repoUrl: string): { owner: string; repo: string }
```

### 6. Common Services

#### CryptoService

**Encryption**: AES-256-GCM
- IV: 16 bytes random
- Auth tag: 16 bytes
- Output format: `{iv}:{authTag}:{encrypted}`
- Key derivation: SHA-256(ENCRYPTION_KEY env var)

**Hashing**: SHA-256
- `computeHash(content)`: Hex digest

**Configuration**:
- Requires `ENCRYPTION_KEY` env var (min 32 chars)
- Key auto-derived via SHA-256

#### ApiKeyGuard

**Authentication Flow**:
1. Extract `X-API-Key` header
2. Validate key exists trong database
3. Check `isActive` flag
4. Attach `project` object vào request
5. Throw `UnauthorizedException` nếu invalid

**Usage**:
```typescript
@UseGuards(ApiKeyGuard)
@Get()
async protectedRoute(@CurrentProject() project: Project) {
  // project tự động inject từ guard
}
```

#### GlobalExceptionFilter

**Error Handling**:
- Catch tất cả exceptions
- Format response: statusCode, timestamp, path, message
- Log errors với stack trace
- Handle cả HttpException và unknown errors

## API Structure

### Global Configuration

**Base URL**: `/api`
**CORS**: Enabled for `FRONTEND_URL` (default: http://localhost:3000)
**Port**: 3001 (default)

### Validation Pipeline

```typescript
new ValidationPipe({
  transform: true,        // Auto-transform DTOs
  whitelist: true,        // Strip unknown properties
  forbidNonWhitelisted: true, // Reject extra properties
})
```

### Rate Limiting

- Package: `@nestjs/throttler` 6.5.0
- Configured nhưng chưa apply trong Phase 02

## Security Features Summary

### 1. Token Encryption (AES-256-GCM)
- **Algorithm**: AES-256-GCM (Authenticated encryption)
- **Key derivation**: SHA-256 hash of env ENCRYPTION_KEY
- **IV**: Random 16 bytes per encryption
- **Auth tag**: 16 bytes AEAD tag
- **Storage**: `{iv}:{authTag}:{ciphertext}` format

### 2. Content Hashing (SHA-256)
- **Algorithm**: SHA-256
- **Usage**: Document content integrity verification
- **Output**: Hex digest (64 characters)
- **Purpose**: Detect changes, prevent unnecessary GitHub API calls

### 3. API Key Authentication
- **Format**: `sk_` prefix + 64 hex characters
- **Generation**: `randomBytes(32).toString('hex')`
- **Storage**: Plain text trong database (TODO: Hash với bcrypt)
- **Validation**: Database lookup + isActive check
- **Header**: `X-API-Key`

### 4. Input Validation
- **Library**: class-validator + class-transformer
- **Decorators**: @IsString, @IsNotEmpty, @IsUrl, @MaxLength, @Transform
- **Trimming**: Auto-trim strings
- **Type safety**: TypeScript + DTOs

### 5. Database Security
- **Cascading deletes**: onDelete: Cascade cho relations
- **Indexes**: Optimized queries (projectId, key, expiresAt)
- **Unique constraints**: Prevent duplicates
- **Transactions**: Serializable isolation cho lock operations

## Testing Coverage

**Total**: 82 tests passing
**Test suites**: 7 suites

**Coverage areas**:
- Projects CRUD operations
- Docs sync & management
- Lock acquire/release/extend
- GitHub service methods
- Crypto service encryption/decryption
- Controller endpoint testing
- Service unit tests

**Testing tools**:
- Jest 29.7.0
- @nestjs/testing 10.3.0
- Mocking: PrismaService, CryptoService, Octokit

## Configuration Requirements

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# Security
ENCRYPTION_KEY="min-32-characters-secret-key"

# Server
PORT=3001
FRONTEND_URL="http://localhost:3000"

# GitHub (per-project trong database)
# GitHub PATs stored encrypted in Project.token field
```

## Build & Development

### Scripts
```bash
pnpm dev          # Development mode with watch
pnpm build        # Production build
pnpm start        # Run compiled code
pnpm test         # Run tests
pnpm test:watch   # Watch mode
pnpm lint         # ESLint
```

### Development Flow
1. Start PostgreSQL: `docker-compose up -d`
2. Run migrations: `pnpm prisma migrate dev`
3. Start dev server: `pnpm dev`
4. API available: `http://localhost:3001/api`

## Known Limitations & Future Work

### Security Improvements Needed
- [ ] Hash API keys với bcrypt trước khi lưu DB
- [ ] Add rate limiting middleware (throttler đã install)
- [ ] Implement token rotation mechanism
- [ ] Add audit logging cho sensitive operations

### Performance Optimizations
- [ ] Parallelize GitHub API calls trong `getAllDocs()`
- [ ] Add database transaction cho document sync
- [ ] Cache frequently accessed data
- [ ] Add pagination cho list endpoints

### Feature Enhancements
- [x] WebSocket support cho real-time lock notifications (Phase 05)
- [x] Hook API cho CLI integration (Phase 05)
- [ ] Swagger/OpenAPI documentation
- [ ] Health check endpoints

## Dependencies Graph

```
AppModule
├── ConfigModule (global)
├── PrismaModule
├── WebSocketModule (global - Phase 05)
├── HookModule (Phase 05)
│   ├── DocsModule (imported)
│   └── LockModule (imported)
├── ProjectsModule
│   └── CryptoModule (imported)
├── DocsModule
│   └── GitHubModule (imported)
├── LockModule
│   └── WebSocketModule (injected - Phase 05)
└── GitHubModule
```

## Key Design Patterns

1. **Module encapsulation**: Mỗi domain có controller, service, module riêng
2. **Service exports**: Services exported cho cross-module usage
3. **Global modules**: WebSocketModule exported globally (Phase 05)
4. **DTO validation**: Input validation với class-validator
5. **Exception filters**: Centralized error handling
6. **Guard-based auth**: Decorator + Guard pattern cho authentication
7. **Transaction safety**: Database transactions cho critical operations
8. **Environment-based config**: ConfigService cho sensitive data
9. **Event-driven architecture**: WebSocket events cho real-time updates (Phase 05)

---

**Generated**: 2026-01-03
**Phase**: 05 - Backend Real-time & Hooks API
**Status**: Implementation Complete
**Features**: WebSocket Gateway, Hook API, Lock Notifications, CLI Integration
