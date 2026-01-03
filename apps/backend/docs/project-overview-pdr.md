# Project Overview & Product Development Requirements

## Project Identity

**Project Name**: AI Toolkit Sync Platform
**Component**: Backend Core Services
**Version**: 0.0.1
**Phase**: 02 (Completed)
**Status**: Production-Ready with Security Enhancements Required

## Vision & Purpose

### Problem Statement
Development teams working với documentation-heavy projects cần:
- Real-time collaboration trên markdown documentation
- Sync bidirectional giữa local và GitHub repositories
- Lock mechanism để prevent editing conflicts
- Secure GitHub token management
- API integration cho CLI tools và hooks

### Solution
Backend REST API platform cung cấp:
- Project & documentation management
- GitHub repository integration
- TTL-based locking system với race condition prevention
- Encrypted GitHub token storage (AES-256-GCM)
- API key authentication cho external tools

### Target Users
1. **Development Teams**: Manage project documentation
2. **Individual Developers**: Sync docs giữa local và GitHub
3. **CLI Tools**: Integrate via API keys và hooks
4. **CI/CD Pipelines**: Automated documentation updates

## Product Requirements Document (PRD)

### Functional Requirements

#### FR-1: Project Management
- **FR-1.1**: User có thể tạo project với GitHub repo URL và PAT
- **FR-1.2**: System phải encrypt GitHub PAT trước khi lưu database
- **FR-1.3**: User có thể configure branch và docs path
- **FR-1.4**: User có thể list, view, update, delete projects
- **FR-1.5**: System phải validate GitHub repo URL format
- **Acceptance**: CRUD operations hoạt động, tokens encrypted, validation passed

#### FR-2: API Key Management
- **FR-2.1**: User có thể generate API keys cho projects
- **FR-2.2**: API keys phải unique và cryptographically secure
- **FR-2.3**: User có thể revoke API keys
- **FR-2.4**: System phải validate API keys trước khi grant access
- **FR-2.5**: API keys phải có human-readable names
- **Acceptance**: Keys generated unique, authentication works, revocation effective

#### FR-3: Document Synchronization
- **FR-3.1**: System phải fetch all markdown files từ GitHub repo
- **FR-3.2**: System phải detect content changes via hashing
- **FR-3.3**: User có thể sync docs từ GitHub về local DB
- **FR-3.4**: User có thể push updated docs về GitHub
- **FR-3.5**: System phải preserve file SHAs cho conflict detection
- **FR-3.6**: System phải track document versions
- **Acceptance**: Sync bidirectional works, conflicts detected, versions tracked

#### FR-4: Lock Mechanism
- **FR-4.1**: User có thể acquire lock trên project
- **FR-4.2**: Lock phải có TTL (default 30 phút)
- **FR-4.3**: System phải prevent concurrent lock acquisition (race conditions)
- **FR-4.4**: User có thể extend lock duration
- **FR-4.5**: User có thể release lock manually
- **FR-4.6**: System phải auto-release expired locks
- **FR-4.7**: Lock phải include lockedBy identifier và optional reason
- **Acceptance**: Single lock per project, TTL works, race conditions prevented

#### FR-5: GitHub Integration
- **FR-5.1**: System phải support cả HTTPS và SSH GitHub URLs
- **FR-5.2**: System phải fetch file contents từ specific branch
- **FR-5.3**: System phải create/update files trên GitHub
- **FR-5.4**: System phải handle GitHub API errors gracefully
- **FR-5.5**: System phải filter chỉ markdown files (.md)
- **Acceptance**: GitHub operations work, errors handled, filtering correct

### Non-Functional Requirements

#### NFR-1: Security
- **NFR-1.1**: GitHub PATs encrypted với AES-256-GCM
- **NFR-1.2**: Content hashing với SHA-256
- **NFR-1.3**: API keys minimum 64 hex characters (256 bits entropy)
- **NFR-1.4**: Input validation trên all DTOs
- **NFR-1.5**: CORS restricted về frontend URL
- **NFR-1.6**: Sensitive data KHÔNG xuất hiện trong logs/responses
- **Priority**: CRITICAL
- **Metrics**: Zero plaintext token exposures, encryption verified

#### NFR-2: Performance
- **NFR-2.1**: API response time < 200ms (excluding GitHub calls)
- **NFR-2.2**: GitHub sync operations < 5s cho repositories với < 50 files
- **NFR-2.3**: Lock acquisition < 100ms
- **NFR-2.4**: Database queries optimized với indexes
- **Priority**: HIGH
- **Metrics**: p95 latency, throughput testing

#### NFR-3: Reliability
- **NFR-3.1**: System uptime > 99.5%
- **NFR-3.2**: Database transactions với ACID guarantees
- **NFR-3.3**: Graceful error handling với clear messages
- **NFR-3.4**: Auto-retry cho transient GitHub API failures
- **Priority**: HIGH
- **Metrics**: Error rates, transaction success rates

#### NFR-4: Scalability
- **NFR-4.1**: Support concurrent users lên tới 1000
- **NFR-4.2**: Handle projects lên tới 10,000
- **NFR-4.3**: Document storage efficient (TEXT column)
- **NFR-4.4**: Connection pooling cho database
- **Priority**: MEDIUM
- **Metrics**: Load testing results

#### NFR-5: Maintainability
- **NFR-5.1**: Test coverage > 80%
- **NFR-5.2**: TypeScript strict mode enabled
- **NFR-5.3**: Code follows NestJS best practices
- **NFR-5.4**: Modular architecture với clear boundaries
- **NFR-5.5**: Comprehensive error logging
- **Priority**: HIGH
- **Metrics**: Test coverage reports, lint pass rate

#### NFR-6: Usability
- **NFR-6.1**: API responses JSON-formatted
- **NFR-6.2**: Error messages descriptive và actionable
- **NFR-6.3**: Validation errors include field-level details
- **NFR-6.4**: API follows RESTful conventions
- **Priority**: MEDIUM
- **Metrics**: Developer feedback, API consistency

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────┐
│           Frontend (Next.js)                │
│        http://localhost:3000                │
└────────────────┬────────────────────────────┘
                 │ CORS + REST API
                 ↓
┌─────────────────────────────────────────────┐
│       NestJS Backend (Port 3001)            │
│  ┌─────────────────────────────────────┐   │
│  │  Controllers Layer                  │   │
│  │  - ProjectsController               │   │
│  │  - DocsController                   │   │
│  │  - LockController                   │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │  Services Layer                     │   │
│  │  - ProjectsService (CRUD + Keys)    │   │
│  │  - DocsService (Sync + Versioning)  │   │
│  │  - LockService (TTL + Transactions) │   │
│  │  - GitHubService (Octokit wrapper)  │   │
│  │  - CryptoService (AES + SHA)        │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │  Common Layer                       │   │
│  │  - ApiKeyGuard                      │   │
│  │  - GlobalExceptionFilter            │   │
│  │  - ValidationPipe                   │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│  ┌──────────────▼──────────────────────┐   │
│  │  Prisma ORM                         │   │
│  │  - Type-safe queries                │   │
│  │  - Migrations                       │   │
│  │  - Transaction support              │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
     ↓            ↓            ↓
┌─────────┐  ┌────────┐  ┌─────────────┐
│PostgreSQL│  │ GitHub │  │ Environment │
│Database  │  │  API   │  │   Config    │
└─────────┘  └────────┘  └─────────────┘
```

### Data Flow Examples

#### Example 1: Create Project với Encrypted Token
```
1. POST /api/projects {name, repoUrl, token}
   ↓
2. ValidationPipe validates DTO
   ↓
3. ProjectsController → ProjectsService.create()
   ↓
4. CryptoService.encrypt(token) → AES-256-GCM
   ↓
5. PrismaService.project.create({...data, token: encrypted})
   ↓
6. Response {id, name, repoUrl, branch, docsPath}
   (Token NOT included in response)
```

#### Example 2: Sync Documents từ GitHub
```
1. POST /api/projects/:id/docs/sync
   ↓
2. DocsController → DocsService.syncFromGitHub()
   ↓
3. Load project + decrypt token
   ↓
4. GitHubService.getAllDocs(token, repoUrl, docsPath)
   ↓
5. For each .md file:
   - Fetch content from GitHub
   - Compute SHA-256 hash
   - Upsert vào database
   ↓
6. Return synced docs array
```

#### Example 3: Acquire Lock với Race Protection
```
1. POST /api/projects/:id/lock {lockedBy, reason}
   ↓
2. ValidationPipe validates AcquireLockDto
   ↓
3. LockController → LockService.acquireLock()
   ↓
4. Start Serializable transaction
   ↓
5. Check existing lock (within transaction)
   - If exists + not expired → ConflictException
   - If exists + expired → Delete lock
   ↓
6. Verify project exists
   ↓
7. Create lock with TTL (now + 30 min)
   ↓
8. Commit transaction
   ↓
9. Return lock object
```

## API Specification

### Base Configuration
- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`
- **Authentication**: `X-API-Key` header (cho protected routes)

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/projects` | No | Create project |
| GET | `/projects` | No | List projects |
| GET | `/projects/:id` | No | Get project details |
| PUT | `/projects/:id` | No | Update project |
| DELETE | `/projects/:id` | No | Delete project |
| POST | `/projects/:id/api-keys` | No | Generate API key |
| DELETE | `/projects/api-keys/:keyId` | No | Revoke API key |
| GET | `/projects/:projectId/docs` | No | List documents |
| GET | `/projects/:projectId/docs/:fileName` | No | Get document |
| PUT | `/projects/:projectId/docs/:fileName` | No | Update document |
| POST | `/projects/:projectId/docs/sync` | No | Sync from GitHub |
| POST | `/projects/:projectId/docs/:fileName/push` | No | Push to GitHub |
| GET | `/projects/:projectId/lock` | No | Get lock status |
| POST | `/projects/:projectId/lock` | No | Acquire lock |
| DELETE | `/projects/:projectId/lock` | No | Release lock |
| POST | `/projects/:projectId/lock/extend` | No | Extend lock TTL |

**Note**: Phase 02 chưa implement auth guards trên routes. Phase 05 sẽ add API key protection.

## Success Metrics & KPIs

### Implementation Metrics (Phase 02)
- ✅ **Test Coverage**: 82/82 tests passing (100%)
- ✅ **Build Status**: TypeScript compilation successful
- ✅ **Code Quality**: ESLint passing, no critical issues
- ✅ **Module Count**: 7 modules implemented
- ✅ **API Endpoints**: 15 endpoints functional

### Security Metrics
- ✅ **Encryption**: AES-256-GCM implemented
- ✅ **Hashing**: SHA-256 implemented
- ⚠️ **API Key Security**: Plain text storage (needs bcrypt hashing)
- ✅ **Input Validation**: All DTOs validated
- ⚠️ **Rate Limiting**: Package installed, not configured

### Performance Targets
- **API Latency**: Target < 200ms (not yet measured)
- **GitHub Sync**: Target < 5s for < 50 files (not yet measured)
- **Lock Acquisition**: Target < 100ms (not yet measured)
- **Concurrent Users**: Target 1000 (not yet tested)

### Business Metrics (Future)
- **Project Count**: Track active projects
- **Sync Operations**: Daily sync count
- **Lock Utilization**: Average lock duration
- **API Key Usage**: Requests per key per day

## Risks & Mitigation

### Security Risks

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| API keys stored plain text | HIGH | Implement bcrypt hashing | TODO |
| No rate limiting | MEDIUM | Configure @nestjs/throttler | TODO |
| Token exposure in logs | HIGH | Sanitize logging, audit code | PARTIAL |
| No audit trail | MEDIUM | Add audit logging service | TODO |

### Technical Risks

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| GitHub API rate limits | HIGH | Implement caching, request batching | TODO |
| Database connection pool exhaustion | MEDIUM | Configure Prisma pool settings | TODO |
| Long-running sync operations | MEDIUM | Add timeout + pagination | TODO |
| Lock deadlocks | LOW | Serializable transactions implemented | DONE |

### Operational Risks

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| Database migration failures | HIGH | Backup strategy, rollback plan | TODO |
| Encryption key rotation | HIGH | Key versioning system | TODO |
| Service downtime | MEDIUM | Health checks, monitoring | TODO |

## Dependencies & Integrations

### External Services
- **GitHub API**: Repository và file operations
  - Rate limits: 5000 requests/hour (authenticated)
  - Requires valid GitHub PAT
  - Supported operations: getContent, createOrUpdateFileContents

### Internal Dependencies
- **PostgreSQL**: Primary data store
  - Version: 14+
  - Features: ACID transactions, indexes, cascading deletes

- **Frontend**: Next.js application
  - CORS configured
  - REST API consumption

### Future Integrations (Phase 05+)
- WebSocket gateway cho real-time notifications
- CLI tool via hook API
- Webhook receivers cho GitHub events

## Roadmap & Future Enhancements

### Phase 03: Frontend Foundation (Parallel)
- Next.js UI components
- Monaco editor integration
- Project management interface

### Phase 04: Frontend Features (Parallel)
- Document editor
- Lock status indicators
- GitHub sync UI

### Phase 05: WebSocket & Hooks
- Real-time lock notifications
- CLI hook API
- API key authentication enforcement

### Phase 06: Testing & Deployment
- E2E testing
- Performance testing
- Production deployment
- Monitoring setup

### Post-Launch Enhancements
- [ ] Swagger/OpenAPI documentation
- [ ] GraphQL API option
- [ ] Document conflict resolution UI
- [ ] Batch operations API
- [ ] Webhook integration cho GitHub events
- [ ] User authentication & authorization
- [ ] Multi-tenant support
- [ ] Analytics dashboard
- [ ] Backup & restore functionality

## Compliance & Standards

### Code Standards
- **Language**: TypeScript 5.4+ (strict mode)
- **Framework**: NestJS 10.3+
- **Linting**: ESLint with recommended rules
- **Testing**: Jest, minimum 80% coverage target
- **Formatting**: Prettier (enforced)

### API Standards
- **Protocol**: REST over HTTP/HTTPS
- **Format**: JSON request/response bodies
- **Versioning**: URL path versioning (future: /api/v1)
- **Error Handling**: Standard HTTP status codes
- **Pagination**: Limit/offset (future enhancement)

### Security Standards
- **Encryption**: AES-256-GCM (NIST approved)
- **Hashing**: SHA-256 (FIPS 180-4)
- **Key Management**: Environment variables
- **Authentication**: API key based (Bearer token future)
- **Transport**: HTTPS in production

### Database Standards
- **ORM**: Prisma with type safety
- **Migrations**: Versioned, reversible
- **Naming**: camelCase for fields, PascalCase for models
- **Indexes**: All foreign keys, query columns
- **Constraints**: Unique, cascading deletes where appropriate

## Team & Responsibilities

### Development Roles
- **Backend Lead**: NestJS architecture, API design
- **Database Engineer**: Schema design, migrations, optimization
- **Security Engineer**: Encryption, authentication, auditing
- **DevOps**: Deployment, monitoring, infrastructure
- **QA Engineer**: Test automation, quality assurance

### Stakeholder Communication
- **Product Owner**: Feature prioritization, requirements
- **Engineering Manager**: Resource allocation, timelines
- **Security Team**: Security review, compliance
- **Operations Team**: Deployment, monitoring, incidents

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Phase**: 02 - Backend Core Services
**Status**: ✅ Implementation Complete, ⚠️ Security Enhancements Required
**Next Review**: Before Phase 05 start
