# Brainstorm Report: AI Toolkit Sync Platform

**Date:** 2026-01-03
**Session ID:** 260103-1704
**Updated:** 260103-1802
**Status:** Completed (Updated: Hybrid .docs/ sync approach)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Requirements Analysis](#requirements-analysis)
4. [Evaluated Approaches](#evaluated-approaches)
5. [Recommended Solution](#recommended-solution)
6. [System Architecture](#system-architecture)
7. [Workflow Design](#workflow-design)
8. [Technical Specifications](#technical-specifications)
9. [Security Considerations](#security-considerations)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Risk Assessment](#risk-assessment)
12. [Success Metrics](#success-metrics)
13. [Next Steps](#next-steps)
14. [Unresolved Questions](#unresolved-questions)

---

## Executive Summary

### Problem
Multi-developer environment using AI-assisted coding (Claude Code) produces inconsistent code due to:
- Different devs → different prompts → different code styles
- No centralized "source of truth" for AI to follow
- Docs can be accidentally modified, causing AI to deviate from standards

### Solution
Build a **Web Platform** that:
- Centralizes 6 docs files as source of truth
- Only Tech Lead can modify docs via Platform
- Auto-syncs to all dev workstations
- Locks project when docs being updated
- Integrates with Claude Code via hooks

### Key Decisions
- **Tech Stack:** Next.js (frontend) + NestJS (backend) + Prisma + PostgreSQL
- **Git Provider:** GitHub only (experimental phase, GitLab deferred)
- **Sync Method:** Platform API → `.docs/` folder (gitignored, separate from git-tracked `docs/`)
- **Lock Mechanism:** Auto-lock when Tech Lead opens editor
- **Workflow:** Hybrid (update docs only for major changes)
- **Protection:** Branch protection + Claude Code hooks + `.docs/` isolation

---

## Problem Statement

### Current Situation
When working solo, developer workflow is:
1. Brainstorm → Plan → Code (with AI assistance)
2. Update docs as part of development
3. Commit code + docs together
4. Push to repository

### Problems in Team Environment

| Problem | Impact | Root Cause |
|---------|--------|------------|
| Inconsistent code style | Merge conflicts, code review burden | Different prompts → different AI outputs |
| Docs modification conflicts | Architecture drift | Multiple devs editing docs/ |
| No single source of truth | AI follows outdated/wrong patterns | Docs not centralized/protected |
| No version control for AI context | Hard to trace why AI generated certain code | No audit trail |

### CEO Requirements
1. Sync system architecture docs for ALL developers
2. AI must read 6 docs files before coding
3. Devs cannot modify docs (or need permission)
4. Some files are "source of truth" - must be protected
5. Build a web platform for management

---

## Requirements Analysis

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Manage 6 docs files per project | Must |
| FR-2 | Only Tech Lead can edit docs | Must |
| FR-3 | Lock project while editing | Must |
| FR-4 | Sync docs to dev workstations | Must |
| FR-5 | Integrate with GitHub/GitLab | Must |
| FR-6 | Real-time notification when locked | Should |
| FR-7 | Version history for docs | Could |
| FR-8 | Audit log for changes | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Availability | 99.9% uptime |
| NFR-2 | Latency (lock check) | < 200ms |
| NFR-3 | Concurrent users | 10-30 |
| NFR-4 | Scalability | Multi-project support |
| NFR-5 | Security | Encrypted tokens, API key auth |

### Constraints

- Team size: Small (< 10 devs)
- Git provider: **GitHub only** (experimental phase, no GitLab Enterprise)
- MVP timeline: Simple web platform
- Hosting: TBD (develop local first)
- Auth: Not needed for MVP

---

## Evaluated Approaches

### Option A: GitHub-Native (Not Selected)

**Concept:** Leverage GitHub features only, no new platform.

**Implementation:**
- Protected files via GitHub Actions
- CODEOWNERS for approval
- Lock via `.docs-lock` file
- Claude Code hooks check lock

**Pros:**
- Zero new infrastructure
- 1-2 weeks to implement
- Free (uses existing GitHub)
- No new tools for devs

**Cons:**
- No visual UI for Tech Lead
- Crude lock mechanism
- Manual process

**Verdict:** Good for MVP, but limited scalability.

---

### Option B: Simple Web Platform (Selected)

**Concept:** Separate frontend + backend API for docs management.

**Implementation:**
- Next.js frontend application
- NestJS backend API
- PostgreSQL for metadata + cache
- GitHub integration via Octokit
- WebSocket for real-time notifications
- Claude Code hooks for sync + protection

**Pros:**
- Good UX for Tech Lead
- Real-time lock mechanism
- Centralized control
- Extensible architecture

**Cons:**
- Need to maintain new system
- Additional hosting cost
- Longer development time

**Verdict:** Best balance of features and complexity.

---

### Option C: Hybrid (GitHub + Lock API)

**Concept:** GitHub as source of truth + lightweight Edge function for lock.

**Implementation:**
- Tech Lead edits on GitHub Web
- Edge function (Cloudflare/Vercel) for lock API
- GitHub webhook triggers lock API
- Claude Code hooks check lock

**Pros:**
- Simple, stateless, fast
- Minimal infrastructure
- GitHub remains source of truth
- Easy to extend

**Cons:**
- No fancy UI
- Manual lock/unlock

**Verdict:** Good for very small teams, but less UX.

---

### Comparison Matrix

| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| Time to MVP | 1-2 weeks | 3-4 weeks | 2 weeks |
| Infrastructure | None | Backend + DB | Edge function |
| Monthly cost | Free | $20-50 | Free tier |
| Tech Lead UX | Low | High | Medium |
| Scalability | Limited | High | High |
| Maintenance | Low | High | Low |
| Lock mechanism | File-based | Real-time | Near real-time |

**Selected:** Option B - Simple Web Platform

---

## Recommended Solution

### Solution Overview

```
AI TOOLKIT SYNC PLATFORM
═══════════════════════

PURPOSE: Centralize docs management for AI-assisted development teams

COMPONENTS:
┌─────────────────────────────────────────────────────────────────────┐
│                         WEB PLATFORM                                │
│  • Dashboard: Project overview, status                              │
│  • Docs Editor: Monaco editor for markdown                          │
│  • Lock Manager: Auto-lock/unlock mechanism                         │
│  • Sync Service: Push to Git, notify devs                           │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       GIT PROVIDER                                  │
│  • GitHub integration (Octokit)                                        │
│  • Source of truth for docs/                                        │
│  • Branch protection enabled                                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DEV WORKSTATIONS                                 │
│  • Claude Code CLI with hooks                                       │
│  • Pre-session: Check lock + sync docs to .docs/                    │
│  • Pre-write: Block .docs/ and docs/ modifications                  │
│  • CLAUDE.md references .docs/ (Platform-synced)                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Features

| Feature | Description |
|---------|-------------|
| Project Management | CRUD for projects, Git connection settings |
| Docs Editor | Monaco editor with markdown preview |
| Auto-Lock | Lock acquired when editor opens |
| Real-time Notify | WebSocket broadcast to all connected devs |
| Git Sync | Two-way sync with GitHub/GitLab |
| API Keys | Project-scoped keys for Claude Code hooks |
| Version Tracking | Hash-based version for quick sync check |

### Protected Docs Files

| File | Purpose |
|------|---------|
| `project-overview-pdr.md` | Product requirements, scope |
| `code-standards.md` | Coding conventions, patterns |
| `codebase-summary.md` | Project structure, key files |
| `design-guidelines.md` | UI/UX standards |
| `deployment-guide.md` | Build, deploy instructions |
| `system-architecture.md` | Technical architecture |

---

## System Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           ECOSYSTEM OVERVIEW                                │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌───────────────────┐         ┌───────────────────┐                        │
│  │     TECH LEAD     │         │       DEV         │                        │
│  │    WORKSTATION    │         │    WORKSTATION    │                        │
│  └─────────┬─────────┘         └─────────┬─────────┘                        │
│            │                             │                                   │
│            │ HTTPS                       │ HTTPS (check lock + sync)        │
│            ▼                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                      NEXT.JS FRONTEND                               │     │
│  │                     (React + TypeScript)                            │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │     │
│  │  │   Dashboard  │  │  Project Mgmt│  │  Docs Editor │              │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │     │
│  └──────────────────────────────┬──────────────────────────────────────┘     │
│                                 │ REST API / WebSocket                       │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                      NESTJS BACKEND                                 │     │
│  │                   (TypeScript + Prisma)                            │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │     │
│  │  │ REST API     │  │  WebSocket   │  │  Services    │              │     │
│  │  │ Controllers  │  │  Gateway     │  │  (Business)  │              │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │     │
│  │         │                 │                 │                       │     │
│  │         └─────────────────┼─────────────────┘                       │     │
│  │                           ▼                                         │     │
│  │                 ┌──────────────────┐                                │     │
│  │                 │   Core Services  │                                │     │
│  │                 │  ┌────────────┐  │                                │     │
│  │                 │  │ ProjectSvc │  │                                │     │
│  │                 │  │  LockSvc   │  │                                │     │
│  │                 │  │  DocsSvc   │  │                                │     │
│  │                 │  │  SyncSvc   │  │                                │     │
│  │                 │  └────────────┘  │                                │     │
│  │                 └────────┬─────────┘                                │     │
│  │                          │                                          │     │
│  │         ┌────────────────┼────────────────┐                         │     │
│  │         ▼                ▼                ▼                         │     │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐                   │     │
│  │  │ PostgreSQL │   │   GitHub   │   │   Redis    │                   │     │
│  │  │  (Prisma)  │   │  (Octokit) │   │  (Pub/Sub) │                   │     │
│  │  │            │   │            │   │  Optional  │                   │     │
│  │  └────────────┘   └─────┬──────┘   └────────────┘                   │     │
│  │                         │                                           │     │
│  └─────────────────────────┼───────────────────────────────────────────┘     │
│                            │                                                 │
│                            │ REST API                                        │
│                            ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                          GITHUB                                     │     │
│  │                    (via Octokit API)                               │     │
│  │  ┌─────────────────────────────────────────────────────────────┐    │     │
│  │  │  Repository                                                  │    │     │
│  │  │  ├── docs/                                                   │    │     │
│  │  │  │   ├── project-overview-pdr.md      (Source of Truth)     │    │     │
│  │  │  │   ├── code-standards.md            (Protected)           │    │     │
│  │  │  │   ├── codebase-summary.md          (Protected)           │    │     │
│  │  │  │   ├── design-guidelines.md         (Protected)           │    │     │
│  │  │  │   ├── deployment-guide.md          (Protected)           │    │     │
│  │  │  │   └── system-architecture.md       (Protected)           │    │     │
│  │  │  └── src/  (Dev code area)                                  │    │     │
│  │  └─────────────────────────────────────────────────────────────┘    │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    FRONTEND LAYER (Next.js)                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           ║
║  │   Dashboard     │  │   Project Mgmt  │  │   Docs Editor   │           ║
║  │                 │  │                 │  │                 │           ║
║  │ • Projects list │  │ • Create/Edit   │  │ • Monaco Editor │           ║
║  │ • Lock status   │  │ • Git settings  │  │ • Markdown prev │           ║
║  │ • Activity log  │  │ • API keys      │  │ • Auto-save     │           ║
║  │ • Quick actions │  │ • Members       │  │ • Push button   │           ║
║  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           ║
║           │                    │                    │                     ║
║           └────────────────────┼────────────────────┘                     ║
║                                ▼                                          ║
║                    ┌─────────────────────┐                                ║
║                    │    State Manager    │                                ║
║                    │   (React Query /    │                                ║
║                    │    Zustand)         │                                ║
║                    └──────────┬──────────┘                                ║
╚═══════════════════════════════╪═══════════════════════════════════════════╝
                                │ HTTP / WebSocket
╔═══════════════════════════════╪═══════════════════════════════════════════╗
║                  BACKEND LAYER│ (NestJS)                                   ║
╠═══════════════════════════════╪═══════════════════════════════════════════╣
║                               ▼                                           ║
║  ┌────────────────────────────────────────────────────────────────────┐   ║
║  │                     CONTROLLERS + GATEWAY                           │   ║
║  │                                                                     │   ║
║  │  /projects/*           Project CRUD, settings                       │   ║
║  │  /projects/:id/docs    Docs management                              │   ║
║  │  /projects/:id/lock    Lock acquire/release                         │   ║
║  │  /hook/*               Claude Code integration                      │   ║
║  │  WebSocket Gateway     Real-time notifications                      │   ║
║  └────────────────────────────────────────────────────────────────────┘   ║
║                               │                                           ║
╠═══════════════════════════════╪═══════════════════════════════════════════╣
║                  SERVICE LAYER│                                            ║
╠═══════════════════════════════╪═══════════════════════════════════════════╣
║                               ▼                                           ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      ║
║  │ ProjectSvc  │  │  LockSvc    │  │  DocsSvc    │  │  SyncSvc    │      ║
║  │             │  │             │  │             │  │             │      ║
║  │ • CRUD      │  │ • Acquire   │  │ • Get/Set   │  │ • Import    │      ║
║  │ • Settings  │  │ • Release   │  │ • Validate  │  │ • Export    │      ║
║  │ • API keys  │  │ • Check     │  │ • Hash      │  │ • Push/Pull │      ║
║  │             │  │ • Timeout   │  │ • Version   │  │             │      ║
║  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      ║
║         │               │               │               │                 ║
║         └───────────────┼───────────────┼───────────────┘                 ║
║                         ▼               ▼                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝
                          │               │
╔═════════════════════════╪═══════════════╪═════════════════════════════════╗
║              DATA LAYER │               │                                  ║
╠═════════════════════════╪═══════════════╪═════════════════════════════════╣
║                         ▼               ▼                                 ║
║  ┌──────────────────────────┐  ┌──────────────────────────┐               ║
║  │       PostgreSQL         │  │         GitHub           │               ║
║  │       (via Prisma)       │  │       (Octokit)          │               ║
║  │                          │  │                          │               ║
║  │  • Project metadata      │  │  • Actual docs files     │               ║
║  │  • Docs cache            │  │  • Commit history        │               ║
║  │  • Lock status           │  │  • Branch protection     │               ║
║  │  • API keys              │  │                          │               ║
║  │  • Audit logs            │  │                          │               ║
║  └──────────────────────────┘  └──────────────────────────┘               ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Database Schema

```prisma
// schema.prisma

model Project {
  id          String   @id @default(cuid())
  name        String

  // GitHub integration
  repoUrl     String
  token       String   // Encrypted GitHub PAT
  branch      String   @default("main")

  docsPath    String   @default("docs")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  docs        Doc[]
  locks       Lock[]
  apiKeys     ApiKey[]
}

model Doc {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])

  fileName  String   // e.g., "code-standards.md"
  content   String   @db.Text
  hash      String   // MD5 for quick comparison
  version   Int      @default(1)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, fileName])
}

model Lock {
  id        String    @id @default(cuid())
  projectId String    @unique
  project   Project   @relation(fields: [projectId], references: [id])

  lockedBy  String    // Tech Lead username
  lockedAt  DateTime  @default(now())
  expiresAt DateTime? // Auto-unlock after timeout
  reason    String?

  @@index([projectId])
}

model ApiKey {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])

  key       String   @unique // For Claude Code hooks
  name      String   // e.g., "Dev Machine 1"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

### API Endpoints (NestJS)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/projects` | GET | Session | List all projects |
| `/projects` | POST | Session | Create project |
| `/projects/:id` | GET | Session | Get project |
| `/projects/:id` | PUT | Session | Update project |
| `/projects/:id` | DELETE | Session | Delete project |
| `/projects/:id/docs` | GET | Session | Get all docs |
| `/projects/:id/docs/:file` | GET | Session | Get doc |
| `/projects/:id/docs/:file` | PUT | Session | Update doc |
| `/projects/:id/docs/sync` | POST | Session | Push to Git |
| `/projects/:id/lock` | GET | Session | Check lock |
| `/projects/:id/lock` | POST | Session | Acquire lock |
| `/projects/:id/lock` | DELETE | Session | Release lock |
| `/hook/status/:id` | GET | API Key | Check status |
| `/hook/docs/:id` | GET | API Key | Get docs hash |
| `/hook/sync/:id` | POST | API Key | Get docs content |

---

## Workflow Design

### Recommended Workflow: Hybrid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              HYBRID WORKFLOW: UPDATE DOCS ON MAJOR CHANGES                  │
└─────────────────────────────────────────────────────────────────────────────┘

PRINCIPLE:
  • Docs only update for BREAKING CHANGE or NEW MAJOR FEATURE
  • Minor changes/bug fixes: no docs update needed
  • Devs code following current docs, never self-modify

WHEN TO UPDATE DOCS:
  ✅ New major feature (payment, auth, etc.)
  ✅ Architecture change (new service, new database, etc.)
  ✅ Code standards change
  ✅ API breaking change

  ❌ Bug fixes
  ❌ Minor refactoring
  ❌ UI tweaks
  ❌ Performance optimization

FLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Day 1-N: Devs work normally
  │
  ├── Dev 1: feature-login → PR → Tech Lead review → Merge
  ├── Dev 2: bugfix-cart → PR → Tech Lead review → Merge
  └── Dev 3: feature-payment → PR → Tech Lead review → (major feature)
      │
      └── Tech Lead sees payment feature needs architecture doc update
          │
          └── BEFORE MERGE:
              1. Lock project on Platform
              2. Update system-architecture.md
              3. Push to main
              4. Unlock
              5. Merge PR
              6. Notify devs: "Restart Claude session - docs updated"
```

### Flow Diagrams

#### Flow 1: Tech Lead Edit Docs

```
Tech Lead                 Platform                    Database              Git
    │                        │                           │                   │
    │  1. Open editor        │                           │                   │
    │───────────────────────▶│                           │                   │
    │                        │  2. Check existing lock   │                   │
    │                        │──────────────────────────▶│                   │
    │                        │◀──────────────────────────│                   │
    │                        │                           │                   │
    │                        │  3. Acquire lock          │                   │
    │                        │──────────────────────────▶│                   │
    │                        │                           │                   │
    │                        │  4. Get latest docs       │                   │
    │                        │──────────────────────────────────────────────▶│
    │                        │◀──────────────────────────────────────────────│
    │                        │                           │                   │
    │  5. Show editor        │                           │                   │
    │◀───────────────────────│                           │                   │
    │                        │                           │                   │
    │                        │  6. Broadcast: "LOCKED"   │                   │
    │                        │═══════════════════════════════════════▶ All Devs
    │                        │                           │                   │
    │  7. Edit content...    │                           │                   │
    │                        │                           │                   │
    │  8. Click Save         │                           │                   │
    │───────────────────────▶│                           │                   │
    │                        │  9. Push to Git           │                   │
    │                        │──────────────────────────────────────────────▶│
    │                        │◀──────────────────────────────────────────────│
    │                        │                           │                   │
    │                        │  10. Update cache + hash  │                   │
    │                        │──────────────────────────▶│                   │
    │                        │                           │                   │
    │                        │  11. Release lock         │                   │
    │                        │──────────────────────────▶│                   │
    │                        │                           │                   │
    │  12. Success!          │  13. Broadcast: "UPDATED" │                   │
    │◀───────────────────────│═══════════════════════════════════════▶ All Devs
    │                        │                           │                   │
```

#### Flow 2: Dev Start Coding (Hybrid .docs/ Approach)

```
Dev                    Claude Code Hook              Platform API
 │                           │                            │
 │  1. Start Claude session  │                            │
 │──────────────────────────▶│                            │
 │                           │                            │
 │                           │  2. Check lock status      │
 │                           │───────────────────────────▶│
 │                           │◀───────────────────────────│
 │                           │                            │
 │                   ┌───────┴───────┐                    │
 │                   │  Lock Status? │                    │
 │                   └───────┬───────┘                    │
 │                           │                            │
 │           ┌───────────────┼───────────────┐            │
 │           ▼ LOCKED        │ UNLOCKED      │            │
 │    ┌─────────────┐        │               │            │
 │    │ Show Error  │        │               │            │
 │    │ "Wait..."   │        │               │            │
 │    │ EXIT(1)     │        │               │            │
 │◀───┴─────────────┘        │               │            │
 │                           ▼               │            │
 │                   ┌─────────────┐         │            │
 │                   │ Check docs  │         │            │
 │                   │   hash      │─────────┘            │
 │                   └──────┬──────┘                      │
 │                          │                             │
 │                   ┌──────┴──────┐                      │
 │                   │ Hash match? │                      │
 │                   └──────┬──────┘                      │
 │                          │                             │
 │           ┌──────────────┼──────────────┐              │
 │           ▼ DIFFERENT    │ SAME         │              │
 │    ┌─────────────────┐   │              │              │
 │    │ Sync docs to    │   │              │              │
 │    │ .docs/ folder   │───┘              │              │
 │    │ (gitignored)    │                  │              │
 │    └────────┬────────┘                  │              │
 │             │                           │              │
 │             ▼                           ▼              │
 │    ┌───────────────────────────────────────┐           │
 │    │        Continue with Claude Code      │           │
 │    │  Claude reads from .docs/ (Platform)  │           │
 │◀───│  Both .docs/ and docs/ are READ-ONLY  │           │
 │    └───────────────────────────────────────┘           │
```

### Local Folder Structure (Dev Workstation)

```
project/
├── .docs/                    ← Platform sync target (gitignored)
│   ├── .sync-hash            ← Hash for quick comparison
│   ├── project-overview-pdr.md
│   ├── code-standards.md
│   ├── codebase-summary.md
│   ├── design-guidelines.md
│   ├── deployment-guide.md
│   └── system-architecture.md
├── docs/                     ← Git tracked (GitHub viewing only)
│   └── *.md                  ← Updated when Tech Lead pushes via Platform
├── .gitignore                ← Contains ".docs/"
├── CLAUDE.md                 ← References .docs/ for AI context
└── src/
```

### Why Hybrid Approach?

| Benefit | Description |
|---------|-------------|
| Clean git status | `.docs/` never pollutes `git status` |
| Zero conflict risk | Platform and Git don't interfere |
| Clear source of truth | Claude always reads Platform-synced `.docs/` |
| GitHub friendly | `docs/` visible on GitHub for viewing |
| Rollback safe | `git checkout` doesn't affect Claude's context |

### Developer Initial Setup (First-time)

When a developer joins the project or clones the repo for the first time:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FIRST-TIME SETUP FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

1. Clone repo
   $ git clone https://github.com/org/project.git
   $ cd project

2. Get API credentials from Tech Lead
   - AI_TOOLKIT_PLATFORM_URL (Platform URL)
   - AI_TOOLKIT_API_KEY (Project-specific key)
   - AI_TOOLKIT_PROJECT_ID (Project ID)

3. Configure environment
   $ cat >> ~/.bashrc << 'EOF'
   export AI_TOOLKIT_PLATFORM_URL="https://platform.example.com"
   export AI_TOOLKIT_API_KEY="sk-xxxx"
   export AI_TOOLKIT_PROJECT_ID="proj_xxxx"
   EOF
   $ source ~/.bashrc

4. Install Claude Code hooks
   $ mkdir -p ~/.claude/hooks
   $ cp ./scripts/check-platform.sh ~/.claude/hooks/
   $ cp ./scripts/protect-docs.sh ~/.claude/hooks/
   $ chmod +x ~/.claude/hooks/*.sh

5. First Claude session
   $ claude
   → Hook auto-creates .docs/ and syncs from Platform
   → Ready to code!
```

#### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Platform down on first run | ❌ Error: "No cached docs. Please connect to Platform first." |
| Platform down after first sync | ✅ Uses cached `.docs/` (offline mode) |
| `.docs/` accidentally deleted | ✅ Re-created on next session |
| Wrong API key | ❌ API call fails after 3 retries |

---

## Technical Specifications

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | | |
| Framework | Next.js 14 (App Router) | SSR, routing, React ecosystem |
| UI Components | Shadcn/ui | Rapid development |
| Editor | Monaco Editor | Full markdown support |
| State | React Query + Zustand | Server state + client state |
| **Backend** | | |
| Framework | NestJS | Modular, TypeScript-first, scalable |
| ORM | Prisma | Type-safe, migrations |
| Database | PostgreSQL | Reliable, scalable |
| Real-time | @nestjs/websockets | Native NestJS WebSocket support |
| Git Integration | Octokit | GitHub API |
| Auth | None (MVP) | Add later if needed |

### GitHub Service (Simplified)

```typescript
// lib/github/types.ts
export interface DocFile {
  fileName: string;
  content: string;
  sha?: string | null;
}

// lib/github/service.ts
import { Octokit } from '@octokit/rest';

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, repoUrl: string) {
    this.octokit = new Octokit({ auth: token });
    // Parse owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    [, this.owner, this.repo] = match;
  }

  async getDocFile(fileName: string, branch = 'main'): Promise<DocFile> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: `docs/${fileName}`,
      ref: branch,
    });
    // Decode base64 content
    return {
      fileName,
      content: Buffer.from((data as any).content, 'base64').toString(),
      sha: (data as any).sha,
    };
  }

  async getAllDocs(branch = 'main'): Promise<DocFile[]> { /* ... */ }
  async pushDoc(fileName: string, content: string, message: string): Promise<void> { /* ... */ }
}
```

### Claude Code Hooks

#### Pre-session Hook (check-platform.sh)

```bash
#!/bin/bash
set -e  # Exit on error

PLATFORM_URL="${AI_TOOLKIT_PLATFORM_URL:-http://localhost:3000}"
API_KEY="${AI_TOOLKIT_API_KEY}"
PROJECT_ID="${AI_TOOLKIT_PROJECT_ID}"
TIMEOUT=10  # seconds
MAX_RETRIES=3

# Helper: API call with timeout, retry, and error handling
api_call() {
  local endpoint="$1"
  local attempt=1

  while [ $attempt -le $MAX_RETRIES ]; do
    response=$(curl -s --fail --max-time $TIMEOUT \
      -H "X-API-Key: $API_KEY" \
      "$PLATFORM_URL/api/hook/$endpoint" 2>/dev/null) && {
      echo "$response"
      return 0
    }

    echo "⚠️ API call failed (attempt $attempt/$MAX_RETRIES)" >&2
    attempt=$((attempt + 1))
    sleep 1
  done

  return 1
}

check_lock() {
  response=$(api_call "status/$PROJECT_ID") || {
    echo "⚠️ Cannot reach Platform. Checking cached .docs/..."
    if [ -d "./.docs" ] && [ -f "./.docs/.sync-hash" ]; then
      echo "✅ Using cached .docs/ (offline mode)"
      return 0
    else
      echo "❌ No cached docs. Please connect to Platform first."
      exit 1
    fi
  }

  locked=$(echo "$response" | jq -r '.locked')
  lockedBy=$(echo "$response" | jq -r '.lockedBy')
  lockedAt=$(echo "$response" | jq -r '.lockedAt // empty')

  if [ "$locked" == "true" ]; then
    echo "⛔ Project locked by $lockedBy"
    [ -n "$lockedAt" ] && echo "   Since: $lockedAt"
    echo "   Docs being updated. Please wait..."
    exit 1
  fi
}

check_sync() {
  response=$(api_call "docs/$PROJECT_ID") || {
    echo "⚠️ Cannot check for updates. Using cached docs."
    return 0
  }

  remote_hash=$(echo "$response" | jq -r '.hash')

  # Read from .docs/ (Platform-synced folder)
  local_hash=$(cat ./.docs/.sync-hash 2>/dev/null || echo "")

  if [ "$remote_hash" != "$local_hash" ]; then
    echo "📥 Docs have updates. Syncing to .docs/..."
    sync_docs "$remote_hash"
  fi
}

sync_docs() {
  local hash="$1"

  # Create .docs/ if not exists
  mkdir -p ./.docs

  # Download docs from Platform API
  docs_response=$(api_call "sync/$PROJECT_ID") || {
    echo "❌ Sync failed. Please check connection."
    exit 1
  }

  echo "$docs_response" | jq -c '.docs[]' | while read -r doc; do
    fileName=$(echo "$doc" | jq -r '.fileName')
    content=$(echo "$doc" | jq -r '.content')
    echo "$content" > "./.docs/$fileName"
  done

  echo "$hash" > ./.docs/.sync-hash
  echo "✅ Docs synced to .docs/ successfully"
}

check_lock
check_sync
```

#### Docs Protection Hook (protect-docs.sh)

```bash
#!/bin/bash

if [[ "$CLAUDE_OPERATION" == "write" || "$CLAUDE_OPERATION" == "edit" ]]; then
  # Block both .docs/ (Platform-synced) and docs/ (Git-tracked)
  if [[ "$CLAUDE_TARGET_FILE" == *"/.docs/"* ]] || \
     [[ "$CLAUDE_TARGET_FILE" == *"/docs/"* ]]; then
    echo "⛔ BLOCKED: docs folders are read-only"
    echo "   .docs/ = Platform-synced (for Claude)"
    echo "   docs/  = Git-tracked (for GitHub viewing)"
    echo "   Only Tech Lead can modify via Platform"
    exit 1
  fi
fi
```

#### Project .gitignore (Required)

```gitignore
# Platform-synced docs (Claude reads from here)
.docs/
```

#### Project CLAUDE.md (Required)

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

---

## Security Considerations

### Authentication Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| Platform UI | Session (future) | Tech Lead access |
| Hook API | API Key | Claude Code access |
| Git Provider | Personal Access Token | Push/pull docs |

### Data Protection

| Data | Protection |
|------|------------|
| Git tokens | Encrypted in DB (AES-256) |
| API keys | Hashed, never displayed after creation |
| Docs content | Cached in DB, source in Git |

### Access Control

| Action | Who Can Do |
|--------|------------|
| View docs | All (via Git) |
| Edit docs | Tech Lead only (via Platform) |
| Lock/unlock | Tech Lead only |
| Generate API key | Tech Lead only |
| Use API key | Any dev (for hooks) |

### Git Protection

- Branch protection on `main`
- CODEOWNERS for `docs/`
- Require PR for direct pushes
- Platform uses admin token

---

## Implementation Roadmap

### Phase 1: Core MVP (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| NestJS backend setup + Prisma | High | 3h |
| Next.js frontend setup | High | 2h |
| Database schema + migrations | High | 2h |
| GitHub service (Octokit) | High | 4h |
| Project CRUD API (NestJS) | High | 3h |
| Docs management API (NestJS) | High | 4h |
| Lock mechanism API (NestJS) | High | 3h |
| Basic dashboard UI (Next.js) | High | 4h |
| Docs editor (Monaco) | High | 6h |
| Claude Code hooks | High | 4h |

### Phase 2: Polish (Week 2-3)

| Task | Priority | Effort |
|------|----------|--------|
| WebSocket Gateway (NestJS) | Medium | 4h |
| API key management | Medium | 3h |
| Auto-lock timeout | Medium | 2h |
| Error handling + logging | Medium | 3h |
| UI polish | Medium | 4h |
| GitHub branch protection setup | Medium | 2h |

### Phase 3: Production Ready (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Authentication (if needed) | Low | 6h |
| Deployment setup (Docker) | Medium | 4h |
| Documentation | Medium | 3h |
| Testing | Medium | 4h |
| Team onboarding | Medium | 2h |

### Phase 4: Future (Post-MVP)

| Task | Priority | Effort |
|------|----------|--------|
| GitLab provider (when needed) | Low | 4h |
| Multi-provider support | Low | 6h |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Git API rate limits | Medium | High | Cache docs locally, batch updates |
| Token exposure | Low | Critical | Encrypt tokens, never log |
| Lock not released | Medium | Medium | Auto-timeout (30 min) |
| Docs desync | Low | High | Hash verification, auto-sync |
| Platform downtime | Low | High | Claude hooks fallback to cached |
| Merge conflicts | Low | Medium | Platform always pushes first |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI code consistency | 90%+ similar patterns | Code review sampling |
| Docs sync latency | < 5 seconds | Platform logs |
| Lock conflicts | 0 | Platform logs |
| Dev adoption | 100% | Hook installation check |
| Tech Lead satisfaction | Positive feedback | Survey |

---

## Next Steps

### Immediate Actions

1. **Setup Development Environment**
   - Create monorepo structure (apps/frontend, apps/backend)
   - Setup NestJS + Prisma backend
   - Setup Next.js frontend
   - Configure PostgreSQL (local Docker)

2. **Create GitHub Test Repo**
   - Create private repo
   - Add 6 docs files
   - Generate Personal Access Token

3. **Implement Core Features**
   - Start with GitHub service (Octokit) in NestJS
   - Then Project CRUD controllers
   - Then Lock mechanism
   - Then frontend dashboard + Docs editor

4. **Create Claude Code Hooks**
   - Install in ~/.claude/hooks/
   - Test with test repo

### Future Considerations

- Authentication (GitHub OAuth)
- GitLab provider (when Enterprise available)
- Multi-user roles (Admin, Editor, Viewer)
- Audit log for all changes
- Version history with diff view
- Webhook for PR labeling
- Slack/Discord notifications
- Analytics dashboard

---

## Unresolved Questions

1. **Hosting decision:** Cloud provider not yet decided by CEO. May affect architecture (serverless vs container).

2. **Auth timeline:** When is authentication needed? Current design is no-auth MVP.

3. **~~Offline support:~~** ✅ RESOLVED - Using `.docs/` hybrid approach:
   - If Platform unreachable: Hook fails, dev cannot start session (safe fallback)
   - Cached `.docs/` always available for reference
   - No conflict with git workflow

4. **Multi-project per repo:** Some repos may have multiple "projects" (monorepo). Need to clarify scope.

5. **Docs versioning strategy:** Keep all versions or only latest? Storage implications.

---

## Changelog

| Date | Changes |
|------|---------|
| 260103-1704 | Initial brainstorm |
| 260103-1751 | Updated: GitHub-only + Next.js/NestJS stack |
| 260103-1802 | Updated: Hybrid `.docs/` sync approach - Platform syncs to `.docs/` (gitignored), `docs/` remains git-tracked for GitHub viewing |

---

*Generated by AI Toolkit Brainstorm Agent*
*Session: 260103-1704*
