# Phase 05: Backend Real-time & Hooks API

---
phase: 05
title: Backend Real-time & Hooks API
status: pending
effort: 8h
parallelization: Can run in PARALLEL with Phase 04
depends_on: [phase-02]
blocks: [phase-06]
---

## Overview

Implement WebSocket gateway for real-time lock notifications, Hook API for Claude Code integration, and shell scripts for dev workstations.

## File Ownership (Exclusive to This Phase)

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

## Implementation Steps

### Step 1: WebSocket Gateway (2h)

**1.1 Create apps/backend/src/websocket/websocket.gateway.ts**

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface JoinMessage {
  projectId: string;
}

interface LockEvent {
  type: 'lock:acquired' | 'lock:released';
  projectId: string;
  lockedBy?: string;
  lockedAt?: string;
}

interface DocEvent {
  type: 'doc:updated';
  projectId: string;
  docId: string;
  hash: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger('WebSocketGateway');

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMessage,
  ) {
    const room = `project:${data.projectId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMessage,
  ) {
    const room = `project:${data.projectId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { success: true };
  }

  /**
   * Broadcast lock acquired event to all clients in project room
   */
  notifyLockAcquired(projectId: string, lockedBy: string, lockedAt: string) {
    const event: LockEvent = {
      type: 'lock:acquired',
      projectId,
      lockedBy,
      lockedAt,
    };
    this.server.to(`project:${projectId}`).emit('lock:acquired', event);
    this.logger.log(`Lock acquired broadcast for project ${projectId}`);
  }

  /**
   * Broadcast lock released event to all clients in project room
   */
  notifyLockReleased(projectId: string) {
    const event: LockEvent = {
      type: 'lock:released',
      projectId,
    };
    this.server.to(`project:${projectId}`).emit('lock:released', event);
    this.logger.log(`Lock released broadcast for project ${projectId}`);
  }

  /**
   * Broadcast doc updated event to all clients in project room
   */
  notifyDocUpdated(projectId: string, docId: string, hash: string) {
    const event: DocEvent = {
      type: 'doc:updated',
      projectId,
      docId,
      hash,
    };
    this.server.to(`project:${projectId}`).emit('doc:updated', event);
    this.logger.log(`Doc updated broadcast for project ${projectId}`);
  }
}
```

**1.2 Create apps/backend/src/websocket/websocket.module.ts**

```typescript
import { Module, Global } from '@nestjs/common';
import { NotificationsGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class WebSocketModule {}
```

**1.3 Update apps/backend/src/app.module.ts** (add import)

```typescript
// Add to imports array:
import { WebSocketModule } from './websocket/websocket.module';
import { HookModule } from './hook/hook.module';

@Module({
  imports: [
    // ... existing imports
    WebSocketModule,
    HookModule,
  ],
})
export class AppModule {}
```

### Step 2: Integrate WebSocket with Lock Service (30m)

**2.1 Update apps/backend/src/lock/lock.service.ts**

Add WebSocket notifications to lock operations:

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../websocket/websocket.gateway';

const DEFAULT_LOCK_TTL_MINUTES = 30;

@Injectable()
export class LockService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway, // Add this
  ) {}

  async getLock(projectId: string) {
    const lock = await this.prisma.lock.findUnique({
      where: { projectId },
    });

    // Check if lock has expired
    if (lock?.expiresAt && lock.expiresAt < new Date()) {
      await this.releaseLock(projectId);
      return null;
    }

    return lock;
  }

  async acquireLock(projectId: string, lockedBy: string, reason?: string) {
    const existingLock = await this.getLock(projectId);
    if (existingLock) {
      throw new ConflictException({
        message: 'Project is already locked',
        lockedBy: existingLock.lockedBy,
        lockedAt: existingLock.lockedAt,
      });
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + DEFAULT_LOCK_TTL_MINUTES);

    const lock = await this.prisma.lock.create({
      data: {
        projectId,
        lockedBy,
        reason,
        expiresAt,
      },
    });

    // Broadcast lock acquired event
    this.notifications.notifyLockAcquired(
      projectId,
      lockedBy,
      lock.lockedAt.toISOString(),
    );

    return lock;
  }

  async releaseLock(projectId: string) {
    const lock = await this.prisma.lock.findUnique({
      where: { projectId },
    });

    if (!lock) {
      return { released: false, message: 'No lock exists' };
    }

    await this.prisma.lock.delete({
      where: { projectId },
    });

    // Broadcast lock released event
    this.notifications.notifyLockReleased(projectId);

    return { released: true };
  }

  async extendLock(projectId: string, minutes = DEFAULT_LOCK_TTL_MINUTES) {
    const lock = await this.getLock(projectId);
    if (!lock) {
      throw new NotFoundException('No active lock found');
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);

    return this.prisma.lock.update({
      where: { projectId },
      data: { expiresAt },
    });
  }

  async isLocked(projectId: string): Promise<boolean> {
    const lock = await this.getLock(projectId);
    return lock !== null;
  }
}
```

### Step 3: Hook API Service (1.5h)

**3.1 Create apps/backend/src/hook/hook.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocsService } from '../docs/docs.service';
import { LockService } from '../lock/lock.service';

export interface HookStatusResponse {
  locked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  expiresAt?: string;
}

export interface HookDocsHashResponse {
  hash: string;
  docsCount: number;
}

export interface HookSyncResponse {
  docs: Array<{
    fileName: string;
    content: string;
    hash: string;
  }>;
  hash: string;
}

@Injectable()
export class HookService {
  constructor(
    private prisma: PrismaService,
    private docsService: DocsService,
    private lockService: LockService,
  ) {}

  async getStatus(projectId: string): Promise<HookStatusResponse> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const lock = await this.lockService.getLock(projectId);

    if (!lock) {
      return { locked: false };
    }

    return {
      locked: true,
      lockedBy: lock.lockedBy,
      lockedAt: lock.lockedAt.toISOString(),
      expiresAt: lock.expiresAt?.toISOString(),
    };
  }

  async getDocsHash(projectId: string): Promise<HookDocsHashResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const docs = await this.docsService.findAllByProject(projectId);
    const hash = await this.docsService.getDocsHash(projectId);

    return {
      hash,
      docsCount: docs.length,
    };
  }

  async syncDocs(projectId: string): Promise<HookSyncResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // First sync from GitHub to ensure we have latest
    await this.docsService.syncFromGitHub(projectId);

    // Get all docs
    const docs = await this.docsService.findAllByProject(projectId);
    const hash = await this.docsService.getDocsHash(projectId);

    return {
      docs: docs.map((doc) => ({
        fileName: doc.fileName,
        content: doc.content,
        hash: doc.hash,
      })),
      hash,
    };
  }
}
```

**3.2 Create apps/backend/src/hook/hook.controller.ts**

```typescript
import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { HookService } from './hook.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('hook')
@UseGuards(ApiKeyGuard)
export class HookController {
  constructor(private readonly hookService: HookService) {}

  /**
   * Check project lock status
   * Used by check-platform.sh to determine if dev can start session
   */
  @Get('status/:projectId')
  getStatus(@Param('projectId') projectId: string) {
    return this.hookService.getStatus(projectId);
  }

  /**
   * Get docs hash for quick comparison
   * Used by check-platform.sh to determine if sync needed
   */
  @Get('docs/:projectId')
  getDocsHash(@Param('projectId') projectId: string) {
    return this.hookService.getDocsHash(projectId);
  }

  /**
   * Sync docs from platform
   * Returns all docs content for local .docs/ folder
   */
  @Post('sync/:projectId')
  syncDocs(@Param('projectId') projectId: string) {
    return this.hookService.syncDocs(projectId);
  }
}
```

**3.3 Create apps/backend/src/hook/hook.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { HookController } from './hook.controller';
import { HookService } from './hook.service';
import { DocsModule } from '../docs/docs.module';
import { LockModule } from '../lock/lock.module';

@Module({
  imports: [DocsModule, LockModule],
  controllers: [HookController],
  providers: [HookService],
})
export class HookModule {}
```

### Step 4: Claude Code Hook Scripts (2h)

**4.1 Create scripts/check-platform.sh**

```bash
#!/bin/bash
#
# AI Toolkit Platform - Pre-session Hook
# Checks lock status and syncs docs before Claude Code session
#
set -e

# Configuration (from environment)
PLATFORM_URL="${AI_TOOLKIT_PLATFORM_URL:-http://localhost:3001}"
API_KEY="${AI_TOOLKIT_API_KEY}"
PROJECT_ID="${AI_TOOLKIT_PROJECT_ID}"
TIMEOUT=10
MAX_RETRIES=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# Validate required environment variables
if [ -z "$API_KEY" ]; then
  log_error "AI_TOOLKIT_API_KEY not set"
  log_info "Get your API key from the Platform and set:"
  log_info "  export AI_TOOLKIT_API_KEY='sk_xxx'"
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  log_error "AI_TOOLKIT_PROJECT_ID not set"
  log_info "Get your project ID from the Platform and set:"
  log_info "  export AI_TOOLKIT_PROJECT_ID='clxxx'"
  exit 1
fi

# Helper: API call with timeout, retry, and error handling
api_call() {
  local endpoint="$1"
  local method="${2:-GET}"
  local attempt=1

  while [ $attempt -le $MAX_RETRIES ]; do
    response=$(curl -s --fail --max-time $TIMEOUT \
      -X "$method" \
      -H "X-API-Key: $API_KEY" \
      -H "Content-Type: application/json" \
      "$PLATFORM_URL/api/hook/$endpoint" 2>/dev/null) && {
      echo "$response"
      return 0
    }

    log_warn "API call failed (attempt $attempt/$MAX_RETRIES)"
    attempt=$((attempt + 1))
    sleep 1
  done

  return 1
}

# Check lock status
check_lock() {
  log_info "Checking project lock status..."

  response=$(api_call "status/$PROJECT_ID") || {
    log_warn "Cannot reach Platform. Checking cached .docs/..."
    if [ -d "./.docs" ] && [ -f "./.docs/.sync-hash" ]; then
      log_info "Using cached .docs/ (offline mode)"
      return 0
    else
      log_error "No cached docs. Please connect to Platform first."
      exit 1
    fi
  }

  locked=$(echo "$response" | jq -r '.locked')
  lockedBy=$(echo "$response" | jq -r '.lockedBy // empty')
  lockedAt=$(echo "$response" | jq -r '.lockedAt // empty')

  if [ "$locked" == "true" ]; then
    log_error "Project locked by $lockedBy"
    [ -n "$lockedAt" ] && log_info "  Since: $lockedAt"
    log_info "  Docs being updated. Please wait..."
    exit 1
  fi

  log_info "Project is unlocked - proceeding"
}

# Check if docs need sync
check_sync() {
  log_info "Checking docs sync status..."

  response=$(api_call "docs/$PROJECT_ID") || {
    log_warn "Cannot check for updates. Using cached docs."
    return 0
  }

  remote_hash=$(echo "$response" | jq -r '.hash')
  local_hash=$(cat ./.docs/.sync-hash 2>/dev/null || echo "")

  if [ "$remote_hash" != "$local_hash" ]; then
    log_info "Docs have updates. Syncing..."
    sync_docs "$remote_hash"
  else
    log_info "Docs are up to date"
  fi
}

# Sync docs from Platform
sync_docs() {
  local expected_hash="$1"

  # Create .docs/ if not exists
  mkdir -p ./.docs

  # Download docs from Platform API
  response=$(api_call "sync/$PROJECT_ID" "POST") || {
    log_error "Sync failed. Please check connection."
    exit 1
  }

  # Save each doc file
  echo "$response" | jq -c '.docs[]' | while read -r doc; do
    fileName=$(echo "$doc" | jq -r '.fileName')
    content=$(echo "$doc" | jq -r '.content')
    echo "$content" > "./.docs/$fileName"
    log_info "  Synced: $fileName"
  done

  # Save hash for quick comparison
  actual_hash=$(echo "$response" | jq -r '.hash')
  echo "$actual_hash" > ./.docs/.sync-hash

  log_info "Docs synced successfully to .docs/"
}

# Main
main() {
  log_info "AI Toolkit Platform - Pre-session Check"
  log_info "Platform: $PLATFORM_URL"
  log_info "Project:  $PROJECT_ID"
  echo ""

  check_lock
  check_sync

  echo ""
  log_info "Ready for Claude Code session!"
}

main "$@"
```

**4.2 Create scripts/protect-docs.sh**

```bash
#!/bin/bash
#
# AI Toolkit Platform - Docs Protection Hook
# Blocks writes to .docs/ and docs/ folders
# Install in ~/.claude/hooks/pre-write
#

# Check if this is a write or edit operation
if [[ "$CLAUDE_OPERATION" != "write" && "$CLAUDE_OPERATION" != "edit" ]]; then
  exit 0
fi

# Get the target file path
TARGET_FILE="$CLAUDE_TARGET_FILE"

# Block writes to .docs/ (Platform-synced folder)
if [[ "$TARGET_FILE" == *"/.docs/"* ]] || [[ "$TARGET_FILE" == ".docs/"* ]]; then
  echo "BLOCKED: .docs/ is read-only (Platform-synced)"
  echo ""
  echo "This folder contains documentation synced from AI Toolkit Platform."
  echo "Only the Tech Lead can modify docs via the Platform."
  echo ""
  echo "If you need to update documentation:"
  echo "  1. Contact your Tech Lead"
  echo "  2. They will update via Platform"
  echo "  3. Run check-platform.sh to sync latest"
  exit 1
fi

# Block writes to docs/ (Git-tracked folder)
if [[ "$TARGET_FILE" == *"/docs/"* ]] || [[ "$TARGET_FILE" == "docs/"* ]]; then
  # Allow CLAUDE.md in root (not in docs/)
  if [[ "$TARGET_FILE" == "CLAUDE.md" ]] || [[ "$TARGET_FILE" == "./CLAUDE.md" ]]; then
    exit 0
  fi

  echo "BLOCKED: docs/ is protected (Git-tracked)"
  echo ""
  echo "This folder is the source of truth pushed by Platform."
  echo "Direct modifications may cause sync conflicts."
  echo ""
  echo "Claude should read from .docs/ instead."
  exit 1
fi

# Allow all other writes
exit 0
```

**4.3 Make scripts executable and add to package.json**

```json
// Add to root package.json scripts:
{
  "scripts": {
    "hooks:install": "chmod +x scripts/*.sh && echo 'Hooks ready. Copy to ~/.claude/hooks/'",
    "hooks:check": "scripts/check-platform.sh"
  }
}
```

### Step 5: Update Lock Module for WebSocket (15m)

**5.1 Update apps/backend/src/lock/lock.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { LockController } from './lock.controller';
import { LockService } from './lock.service';

@Module({
  controllers: [LockController],
  providers: [LockService],
  exports: [LockService],
})
export class LockModule {}
```

Note: The NotificationsGateway is injected via the global WebSocketModule.

### Step 6: Installation Guide (create README section)

**6.1 Create scripts/README.md**

```markdown
# Claude Code Hooks

These scripts integrate with Claude Code to enforce docs protection.

## Installation

### 1. Set Environment Variables

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export AI_TOOLKIT_PLATFORM_URL="http://localhost:3001"
export AI_TOOLKIT_API_KEY="sk_your_api_key_here"
export AI_TOOLKIT_PROJECT_ID="clxxx_your_project_id"
```

Get these values from the Platform:
- **API Key**: Project Settings > API Keys > Generate
- **Project ID**: Visible in project URL

### 2. Install Hooks

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Copy to Claude hooks directory
mkdir -p ~/.claude/hooks
cp scripts/check-platform.sh ~/.claude/hooks/pre-session
cp scripts/protect-docs.sh ~/.claude/hooks/pre-write
```

### 3. Configure .gitignore

Add to your project's `.gitignore`:

```gitignore
# Platform-synced docs (Claude reads from here)
.docs/
```

### 4. Update CLAUDE.md

Reference `.docs/` in your project's CLAUDE.md:

```markdown
## Documentation

Read these files before coding:
- .docs/project-overview-pdr.md
- .docs/code-standards.md
- .docs/codebase-summary.md
- .docs/design-guidelines.md
- .docs/deployment-guide.md
- .docs/system-architecture.md

NOTE: These files are synced from AI Toolkit Platform. DO NOT modify directly.
```

## Usage

### Before Starting Claude Code

```bash
# Check lock status and sync docs
./scripts/check-platform.sh
```

The pre-session hook will:
1. Check if project is locked (fail if yes)
2. Compare docs hash with Platform
3. Sync updated docs to `.docs/` folder

### During Claude Code Session

The pre-write hook will:
- Block any writes to `.docs/` folder
- Block any writes to `docs/` folder
- Allow all other file operations

## Troubleshooting

### "API key required" error
Set `AI_TOOLKIT_API_KEY` environment variable.

### "Project not found" error
Check `AI_TOOLKIT_PROJECT_ID` matches your project.

### "Project locked" error
Wait for Tech Lead to finish editing docs.

### Offline mode
If Platform is unreachable, hooks use cached `.docs/`.
First sync requires Platform connection.
```

---

## Verification Steps

```bash
# 1. Start backend with WebSocket
cd apps/backend && pnpm dev

# 2. Test Hook API with curl
# First get an API key via Platform or direct DB insert

# Test status endpoint
curl -H "X-API-Key: sk_test_key" \
  http://localhost:3001/api/hook/status/PROJECT_ID

# Test docs hash endpoint
curl -H "X-API-Key: sk_test_key" \
  http://localhost:3001/api/hook/docs/PROJECT_ID

# Test sync endpoint
curl -X POST -H "X-API-Key: sk_test_key" \
  http://localhost:3001/api/hook/sync/PROJECT_ID

# 3. Test WebSocket
# Open browser console on frontend and check for WS connection

# 4. Test hook scripts
export AI_TOOLKIT_API_KEY="sk_test"
export AI_TOOLKIT_PROJECT_ID="your_project_id"
./scripts/check-platform.sh
```

## Success Criteria

- [ ] WebSocket gateway accepts connections
- [ ] Clients can join/leave project rooms
- [ ] Lock acquire broadcasts to room
- [ ] Lock release broadcasts to room
- [ ] `GET /api/hook/status/:id` returns lock status
- [ ] `GET /api/hook/docs/:id` returns hash
- [ ] `POST /api/hook/sync/:id` returns docs content
- [ ] ApiKeyGuard blocks invalid keys
- [ ] check-platform.sh syncs docs to .docs/
- [ ] protect-docs.sh blocks .docs/ writes

---

## Conflict Prevention

This phase owns:
- `websocket/` module (new directory)
- `hook/` module (new directory)
- `scripts/` directory

Phase 02 owns:
- `lock/lock.service.ts` - Phase 05 adds NotificationsGateway injection
- `app.module.ts` - Phase 05 adds WebSocketModule and HookModule imports

Coordination needed:
- Phase 05 modifies LockService to add WebSocket notifications
- This is the ONLY cross-phase file modification
- Use feature flag or conditional injection if running truly parallel
