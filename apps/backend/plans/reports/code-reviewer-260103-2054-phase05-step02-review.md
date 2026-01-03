# Code Review: Phase 05 Step 2 - Backend Real-time & Hooks API

---
reviewer: code-reviewer
date: 2026-01-03
phase: 05
step: 02
status: critical-issues-found
---

## Tổng quan

### Phạm vi
- Files reviewed: 11 files (7 core implementation + 4 supporting)
- Lines analyzed: ~600 LOC
- Focus: Security, architecture, YAGNI/KISS/DRY
- Build status: ✅ PASSED

### Core Files
1. `apps/backend/src/websocket/websocket.gateway.ts` (114 lines)
2. `apps/backend/src/websocket/websocket.module.ts` (9 lines)
3. `apps/backend/src/hook/hook.service.ts` (102 lines)
4. `apps/backend/src/hook/hook.controller.ts` (36 lines)
5. `apps/backend/src/hook/hook.module.ts` (12 lines)
6. `apps/backend/src/lock/lock.service.ts` (modified - WebSocket integration)
7. `apps/backend/src/app.module.ts` (modified - module imports)

### Supporting Files
8. `scripts/check-platform.sh` (156 lines)
9. `scripts/protect-docs.sh` (48 lines)
10. `scripts/README.md` (documentation)
11. `package.json` (hooks scripts - CHƯA thêm)

---

## Critical Issues

### 🔴 #1: WebSocket Gateway - No Authentication (CRITICAL)

**Location:** `websocket.gateway.ts:45-62`

**Issue:** Không có authentication cho WebSocket connections. Bất kỳ client nào cũng có thể:
- Connect tới WebSocket server
- Join bất kỳ project room nào bằng cách biết `projectId`
- Lắng nghe tất cả real-time events (lock status, doc updates)
- Tiềm năng DOS attack bằng cách join nhiều rooms

**OWASP:** A01:2021 - Broken Access Control

**Impact:**
- Unauthorized access to sensitive real-time data
- Information disclosure (lock status, user activities)
- Potential for event spoofing or replay attacks

**Fix Required:**
```typescript
// Add authentication middleware
@WebSocketGateway({
  cors: { /* ... */ },
  middlewares: [WsAuthMiddleware], // ADD THIS
})
export class NotificationsGateway {
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMessage,
  ) {
    // Validate user has access to this project
    const hasAccess = await this.validateProjectAccess(
      client.handshake.auth.token,
      data.projectId
    );

    if (!hasAccess) {
      throw new UnauthorizedException('No access to this project');
    }

    // Validate projectId format
    if (!isValidProjectId(data.projectId)) {
      throw new BadRequestException('Invalid projectId');
    }

    const room = `project:${data.projectId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { success: true, room };
  }
}
```

**Recommendation:**
1. Implement WS authentication middleware using Socket.IO auth
2. Validate JWT token in handshake
3. Attach user context to socket
4. Verify user has access to project before allowing join

---

### 🔴 #2: Input Validation Missing (HIGH)

**Location:** `websocket.gateway.ts:58, 69`

**Issue:** `data.projectId` không được validate trước khi dùng. Có thể inject malicious strings.

**Fix Required:**
```typescript
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class JoinMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+$/, { message: 'Invalid projectId format' })
  projectId: string;
}

@SubscribeMessage('join')
@UsePipes(new ValidationPipe())
handleJoin(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: JoinMessageDto, // Use DTO
) {
  // ...
}
```

---

### 🟠 #3: Shell Script Path Traversal (MEDIUM)

**Location:** `check-platform.sh:130`

**Issue:** `fileName` từ API response không được sanitize trước khi ghi file. Có thể ghi file ngoài `.docs/` directory.

**Attack scenario:**
```json
{
  "docs": [
    {
      "fileName": "../../../etc/passwd",
      "content": "malicious"
    }
  ]
}
```

**Fix Required:**
```bash
# Save each doc file
echo "$response" | jq -c '.docs[]' | while read -r doc; do
  fileName=$(echo "$doc" | jq -r '.fileName')

  # SANITIZE fileName - prevent path traversal
  if [[ "$fileName" == *".."* ]] || [[ "$fileName" == "/"* ]]; then
    log_error "Invalid fileName detected: $fileName"
    continue
  fi

  # Extract basename only
  fileName=$(basename "$fileName")

  content=$(echo "$doc" | jq -r '.content')
  echo "$content" > "./.docs/$fileName"
  log_info "  Synced: $fileName"
done
```

---

### 🟠 #4: CORS Misconfiguration (MEDIUM)

**Location:** `websocket.gateway.ts:32-34`

**Issue:** CORS fallback về `localhost:3000` nếu `FRONTEND_URL` không set. Trong production có thể cho phép localhost connections.

**Fix Required:**
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? false // Reject all in prod if not configured
        : 'http://localhost:3000'), // Dev only
    credentials: true,
  },
})
```

---

## Architectural Issues

### 🟠 #5: Circular Dependency Risk - Service Layer depends on Transport Layer (HIGH)

**Location:** `lock.service.ts:15`

**Issue:** `LockService` (domain/business logic) depends on `NotificationsGateway` (transport layer). Violates separation of concerns.

**Problems:**
- Service layer không nên biết về transport mechanism
- Khó test LockService mà không mock WebSocket
- Khó thay đổi notification mechanism (VD: thay WebSocket bằng Redis Pub/Sub)
- Circular dependency risk nếu Gateway cần inject service

**Current Architecture (WRONG):**
```
LockService (domain) --> NotificationsGateway (transport)
```

**Correct Architecture:**
```
LockService --> EventEmitter --> [WebSocketListener, RedisListener, etc.]
```

**Fix Required:**

1. Create event emitter:
```typescript
// src/common/events/lock.events.ts
export class LockAcquiredEvent {
  constructor(
    public readonly projectId: string,
    public readonly lockedBy: string,
    public readonly lockedAt: string,
  ) {}
}

export class LockReleasedEvent {
  constructor(public readonly projectId: string) {}
}
```

2. Update LockService:
```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LockService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2, // Change from NotificationsGateway
  ) {}

  async acquireLock(projectId: string, lockedBy: string, reason?: string) {
    // ... acquire lock logic ...

    // Emit domain event instead of calling gateway directly
    this.eventEmitter.emit(
      'lock.acquired',
      new LockAcquiredEvent(projectId, lockedBy, lock.lockedAt.toISOString())
    );

    return lock;
  }

  async releaseLock(projectId: string) {
    // ... release logic ...

    this.eventEmitter.emit('lock.released', new LockReleasedEvent(projectId));

    return { released: true };
  }
}
```

3. Create WebSocket listener:
```typescript
// src/websocket/lock.listener.ts
@Injectable()
export class LockWebSocketListener {
  constructor(private gateway: NotificationsGateway) {}

  @OnEvent('lock.acquired')
  handleLockAcquired(event: LockAcquiredEvent) {
    this.gateway.notifyLockAcquired(
      event.projectId,
      event.lockedBy,
      event.lockedAt
    );
  }

  @OnEvent('lock.released')
  handleLockReleased(event: LockReleasedEvent) {
    this.gateway.notifyLockReleased(event.projectId);
  }
}
```

4. Install @nestjs/event-emitter:
```bash
npm install @nestjs/event-emitter
```

**Benefits:**
- Clean separation of concerns
- Easy to test LockService without WebSocket
- Can add multiple listeners (Redis, Email, etc.) without touching LockService
- No circular dependencies

---

### 🟡 #6: Race Condition in Lock Expiry Check (MEDIUM)

**Location:** `lock.service.ts:18-29`

**Issue:** `getLock()` check expired và auto-delete, nhưng KHÔNG trong transaction. Hai concurrent calls có thể cùng try delete.

**Current Code:**
```typescript
async getLock(projectId: string) {
  const lock = await this.prisma.lock.findUnique({
    where: { projectId },
  });

  if (lock?.expiresAt && lock.expiresAt < new Date()) {
    await this.releaseLock(projectId); // NOT in transaction
    return null;
  }

  return lock;
}
```

**Scenario:**
1. Request A: finds expired lock, calls releaseLock()
2. Request B: finds same expired lock (before A deletes), calls releaseLock()
3. Both try to delete → one fails silently (current code handles this OK)
4. BUT: If releaseLock emits events, duplicate events fired

**Fix Required:**
```typescript
async getLock(projectId: string) {
  const lock = await this.prisma.lock.findUnique({
    where: { projectId },
  });

  // Check expiry but DON'T auto-delete
  if (lock?.expiresAt && lock.expiresAt < new Date()) {
    return null; // Treat as no lock
  }

  return lock;
}

// Add explicit cleanup job (run periodically)
@Cron('0 */5 * * * *') // Every 5 minutes
async cleanupExpiredLocks() {
  const expired = await this.prisma.lock.findMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });

  for (const lock of expired) {
    await this.releaseLock(lock.projectId);
  }
}
```

**Alternative:** Keep auto-delete but do it in acquireLock transaction (already done correctly on lines 36-51).

---

## Code Quality Issues

### 🟡 #7: DRY Violation - Duplicate Project Validation (LOW)

**Location:** `hook.service.ts:37-43, 60-66, 78-84`

**Issue:** Same project existence check repeated 3 lần.

**Fix:**
```typescript
@Injectable()
export class HookService {
  // Extract to private method
  private async validateProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return project;
  }

  async getStatus(projectId: string): Promise<HookStatusResponse> {
    await this.validateProject(projectId); // Use helper
    const lock = await this.lockService.getLock(projectId);
    // ...
  }

  async getDocsHash(projectId: string): Promise<HookDocsHashResponse> {
    await this.validateProject(projectId); // Use helper
    // ...
  }

  async syncDocs(projectId: string): Promise<HookSyncResponse> {
    await this.validateProject(projectId); // Use helper
    // ...
  }
}
```

---

### 🟡 #8: Missing package.json Scripts (LOW)

**Location:** `package.json`

**Issue:** Plan yêu cầu add hooks scripts nhưng chưa thấy trong file.

**Expected (from plan line 685-691):**
```json
{
  "scripts": {
    "hooks:install": "chmod +x scripts/*.sh && echo 'Hooks ready. Copy to ~/.claude/hooks/'",
    "hooks:check": "scripts/check-platform.sh"
  }
}
```

**Current:** Scripts CHƯA được thêm.

**Fix:** Add to `apps/backend/package.json` hoặc root `package.json`.

---

## Performance Issues

### 🟡 #9: Synchronous File I/O in Loop (MEDIUM)

**Location:** `check-platform.sh:127-132`

**Issue:** Ghi files synchronously trong while loop. Slow nếu có nhiều docs.

**Current:**
```bash
echo "$response" | jq -c '.docs[]' | while read -r doc; do
  fileName=$(echo "$doc" | jq -r '.fileName')
  content=$(echo "$doc" | jq -r '.content')
  echo "$content" > "./.docs/$fileName"  # Synchronous write
  log_info "  Synced: $fileName"
done
```

**Impact:** Acceptable cho use case này (docs sync không frequent). Not critical.

**Improvement (optional):**
```bash
# Pre-create all files in parallel
echo "$response" | jq -c '.docs[]' | while read -r doc; do
  fileName=$(basename "$(echo "$doc" | jq -r '.fileName')")
  content=$(echo "$doc" | jq -r '.content')
  echo "$content" > "./.docs/$fileName" &  # Background
done
wait  # Wait for all writes
```

---

## Positive Observations

✅ **Good:**
1. Build thành công - no TypeScript errors
2. WebSocket module đúng cấu trúc NestJS (@Global decorator hợp lý)
3. Hook API có proper guards (ApiKeyGuard)
4. Lock service dùng Serializable transaction (line 74) - excellent for race condition prevention
5. Shell scripts có error handling và retry logic
6. CORS configured (dù có issue về fallback)
7. Logging comprehensive
8. Code structure clean, dễ đọc

✅ **Well-implemented:**
- Transaction isolation in acquireLock (lines 33-77)
- Proper NotFoundException usage
- Clean separation of concerns giữa controller/service (Hook module)
- Shell script có offline mode fallback

---

## Recommended Actions (Priority Order)

### MUST FIX (Before Production):

1. **[CRITICAL]** Add WebSocket authentication (#1)
   - Implement WS auth middleware
   - Validate JWT in handshake
   - Verify project access before join

2. **[HIGH]** Add input validation for WebSocket messages (#2)
   - Use class-validator DTOs
   - Validate projectId format

3. **[HIGH]** Fix architectural violation - remove Gateway dependency from LockService (#5)
   - Implement event emitter pattern
   - Create WebSocket listener
   - Install @nestjs/event-emitter

4. **[MEDIUM]** Sanitize fileName in shell script (#3)
   - Add path traversal prevention
   - Use basename only

5. **[MEDIUM]** Fix CORS fail-safe behavior (#4)
   - Reject all in prod if FRONTEND_URL not set

### SHOULD FIX (Before Merge):

6. **[MEDIUM]** Resolve race condition in getLock (#6)
   - Either remove auto-delete or add cleanup job

7. **[LOW]** Extract duplicate project validation (#7)
   - Create private helper method

8. **[LOW]** Add missing package.json scripts (#8)

### OPTIONAL (Future):

9. **[LOW]** Optimize shell script file writes (#9) - not urgent

---

## Metrics

- **Critical Issues:** 2 (Security)
- **High Issues:** 2 (Security + Architecture)
- **Medium Issues:** 4 (Security + Architecture + Performance)
- **Low Issues:** 2 (Code quality)
- **Build Status:** ✅ PASSED
- **Lint Status:** ⚠️ SKIPPED (eslint not found - install dev dependencies)

---

## Plan Status Update

**Phase 05 - Step 2 Status:** ❌ BLOCKED by critical security issues

**Completed:**
- ✅ WebSocket gateway implementation
- ✅ Hook API service/controller
- ✅ Shell scripts (check-platform.sh, protect-docs.sh)
- ✅ Module integration
- ✅ Build succeeds

**Remaining:**
- ❌ Fix critical security issues (#1, #2)
- ❌ Fix architectural violation (#5)
- ❌ Add missing package.json scripts (#8)
- ⚠️ Address medium/low issues

**Recommendation:** DO NOT merge until critical issues fixed. Architectural issue (#5) should be fixed before proceeding to avoid tech debt.

---

## Unresolved Questions

1. **WebSocket Authentication Strategy:** JWT in handshake auth hoặc dùng API key như REST endpoints?
2. **Event Emitter vs Direct Injection:** Team có muốn refactor sang event-driven architecture không? (recommended)
3. **Package.json location:** Hooks scripts nên add vào root package.json hay apps/backend/package.json?
4. **ESLint config:** Dev dependencies chưa install - intentional hay oversight?
5. **Testing:** Có cần e2e tests cho WebSocket không? (highly recommended for #1 fix verification)
