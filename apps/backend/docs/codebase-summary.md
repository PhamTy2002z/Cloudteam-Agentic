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

### 1. Projects Module

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

### 3. Lock Module

**Chức năng**:
- Acquire/release project locks
- TTL-based expiration (30 phút default)
- Race condition prevention với database transactions
- Lock extension mechanism

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

**DTOs**:
- `AcquireLockDto`: lockedBy (required), reason? (optional)
- `ExtendLockDto`: minutes? (optional)

### 4. GitHub Service

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

### 5. Common Services

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
- [ ] WebSocket support cho real-time lock notifications (Phase 05)
- [ ] Hook API cho CLI integration (Phase 05)
- [ ] Swagger/OpenAPI documentation
- [ ] Health check endpoints

## Dependencies Graph

```
AppModule
├── ConfigModule (global)
├── PrismaModule
├── ProjectsModule
│   └── CryptoModule (imported)
├── DocsModule
│   └── GitHubModule (imported)
├── LockModule
└── GitHubModule
```

## Key Design Patterns

1. **Module encapsulation**: Mỗi domain có controller, service, module riêng
2. **Service exports**: Services exported cho cross-module usage
3. **DTO validation**: Input validation với class-validator
4. **Exception filters**: Centralized error handling
5. **Guard-based auth**: Decorator + Guard pattern cho authentication
6. **Transaction safety**: Database transactions cho critical operations
7. **Environment-based config**: ConfigService cho sensitive data

---

**Generated**: 2026-01-03
**Phase**: 02 - Backend Core Services
**Status**: Implementation Complete (82/82 tests passing)
**Next**: Phase 05 - WebSocket & Hook Integration
