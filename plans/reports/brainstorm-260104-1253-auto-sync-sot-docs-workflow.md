# Brainstorm Report: Auto-Sync SOT Docs for AI Code Generation

**Date**: 2026-01-04
**Status**: Ready for Implementation
**Author**: Claude Code (Brainstorm Session)
**Updated**: 2026-01-04 14:21

---

## Problem Statement

Khi dev clone source code và dùng AI (Claude Code) để generate code:
- Techlead update docs (standards, architecture, guidelines)
- Dev pull code nhưng AI session vẫn dùng context cũ
- **Result**: Code generated không comply với docs mới

**Goal**: AI tự động sync docs mới vào local trước khi generate code.

---

## Requirements

| Requirement | Decision |
|-------------|----------|
| Block level | Không block - AI tự sync |
| AI Tool | Claude Code CLI |
| Trigger | Session start only |
| Conflict handling | Warn, không force overwrite |
| Dev code tay | Không bị ảnh hưởng |
| SOT ownership | **Chỉ techlead** được update SOT docs |
| Branch strategy | Main-only SOT, branch-agnostic |

---

## Source of Truth (SOT) Files

4 files cần enforce sync:

| File | Purpose |
|------|---------|
| `code-standards.md` | Coding conventions, naming rules |
| `system-architecture.md` | Technical patterns, decisions |
| `project-overview-pdr.md` | Business scope, requirements |
| `design-guidelines.md` | UI/UX guidelines |

**Excluded** (derived/reference):
- `codebase-summary.md` - AI có thể tự đọc codebase
- `deployment-guide.md` - Ops-focused
- `project-roadmap.md` - Planning doc
- `CLAUDE.md` - Không cần enforce

---

## Solution: Leverage Existing Infrastructure

### ✅ Already Implemented

Platform **đã có sẵn** các components cần thiết:

| Component | Status | Location |
|-----------|--------|----------|
| `.docs/` gitignored | ✅ | `.gitignore:44` |
| Hook Service API | ✅ | `apps/backend/src/hook/hook.service.ts` |
| Sync Script | ✅ | `scripts/check-platform.sh` |
| Hash-based sync | ✅ | `.docs/.sync-hash` mechanism |
| Lock check | ✅ | Integrated in script |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                    │
├─────────────────────────────────────────────────────────────┤
│  Platform DB → GitHub (origin/main) → Local (.docs/)        │
│                      ↓                                       │
│         scripts/check-platform.sh (SessionStart)             │
└─────────────────────────────────────────────────────────────┘

Priority:
  1. .docs/ (platform sync) → PRIMARY
  2. ./docs/ (git) → FALLBACK
```

### Existing Script: `scripts/check-platform.sh`

```bash
# Already implements:
1. Check lock status via API (/api/hook/status/:projectId)
2. Compare hash (local .sync-hash vs remote)
3. Sync docs to .docs/ folder (/api/hook/sync/:projectId)
4. Offline mode fallback (use cached .docs/)
5. Clear error messages with colors
```

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHLEAD WORKFLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. Update SOT docs via Platform Web UI                      │
│  2. Platform auto-commit to GitHub (origin/main)             │
│  3. WebSocket broadcast to all connected clients             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DEV WORKFLOW                              │
├─────────────────────────────────────────────────────────────┤
│  1. Dev clone/pull repo về local                             │
│  2. Dev mở Claude Code CLI                                   │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │     SESSION START HOOK (scripts/check-platform.sh)    │   │
│  ├───────────────────────────────────────────────────────┤   │
│  │  a. Check lock status (is techlead editing?)          │   │
│  │  b. Compare hash (local vs remote)                    │   │
│  │  c. If diff → sync docs to .docs/                     │   │
│  │  d. If offline → use cached .docs/ + warn             │   │
│  │  e. Output: "Ready for Claude Code session!"          │   │
│  └───────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  3. Claude Code đọc SOT docs từ .docs/ (latest)              │
│  4. Dev yêu cầu generate code                                │
│  5. AI generate code COMPLY với docs mới                     │
└─────────────────────────────────────────────────────────────┘
```

---

## What Needs To Be Done

### 1. Configure Claude Code SessionStart Hook

```json
// ~/.claude/settings.json (hoặc project .claude/settings.json)
{
  "hooks": {
    "SessionStart": [{
      "command": "bash ./scripts/check-platform.sh",
      "timeout": 15000
    }]
  }
}
```

### 2. Set Environment Variables

```bash
# ~/.bashrc or ~/.zshrc or project .env
export AI_TOOLKIT_PLATFORM_URL="http://localhost:3001"  # or production URL
export AI_TOOLKIT_API_KEY="sk_xxx"                       # from Platform
export AI_TOOLKIT_PROJECT_ID="clxxx"                     # from Platform
```

### 3. Update CLAUDE.md

Add instruction for AI to read from `.docs/`:

```markdown
## Source of Truth

**IMPORTANT:** Read SOT docs from `.docs/` folder (platform-synced).
Fallback to `./docs/` if `.docs/` not available.

Priority:
1. `.docs/code-standards.md`
2. `.docs/system-architecture.md`
3. `.docs/project-overview-pdr.md`
4. `.docs/design-guidelines.md`
```

---

## Branch Handling Strategy

### Main-Only SOT (Selected)

```
main branch     → SOT docs (enforced by platform)
feature branch  → Inherit từ platform, không tự modify
```

| Scenario | Behavior |
|----------|----------|
| Dev ở main | `.docs/` = latest từ platform ✓ |
| Dev ở feature branch | `.docs/` = latest từ platform ✓ |
| Feature branch có docs changes | Platform SOT vẫn được dùng |
| Techlead merge docs to main | Platform auto-sync to all |

**Rationale**:
- `.docs/` independent từ git branch state
- Techlead là single owner của SOT
- Simple mental model

---

## Existing Script Analysis

### `scripts/check-platform.sh` Features

| Feature | Implementation |
|---------|----------------|
| Lock check | `GET /api/hook/status/:projectId` |
| Hash compare | Local `.docs/.sync-hash` vs API response |
| Sync docs | `POST /api/hook/sync/:projectId` → write to `.docs/` |
| Offline mode | Use cached `.docs/` with warning |
| Retry logic | 3 retries with 1s delay |
| Colored output | Green/Yellow/Red for INFO/WARN/ERROR |

### Script Flow

```
main()
  ├─ check_lock()
  │   ├─ API call → if locked → exit 1
  │   └─ If offline → check cached .docs/ exists
  └─ check_sync()
      ├─ Get remote hash
      ├─ Compare with local .sync-hash
      └─ If diff → sync_docs()
          ├─ mkdir -p .docs/
          ├─ Download each doc file
          └─ Save .sync-hash
```

---

## Risks & Mitigations

| Risk | Mitigation (Already Implemented) |
|------|----------------------------------|
| Platform unavailable | Offline mode with cached `.docs/` |
| Lock conflict | Exit with clear message |
| API timeout | 10s timeout + 3 retries |
| Missing env vars | Clear error messages with instructions |

---

## Success Metrics

- [ ] AI-generated code complies với latest docs
- [ ] Zero manual intervention từ dev
- [ ] Session start time < 5s (API call + sync)
- [ ] Offline mode works seamlessly
- [ ] Clear warnings khi using cached docs

---

## Implementation Checklist

### ✅ Already Done
- [x] `.docs/` in `.gitignore`
- [x] Backend Hook API (`/api/hook/*`)
- [x] `scripts/check-platform.sh` script
- [x] Hash-based sync mechanism
- [x] Lock check integration

### 🔲 To Do
- [ ] Add SessionStart hook to Claude Code settings
- [ ] Document env vars in team onboarding
- [ ] Update CLAUDE.md with `.docs/` priority
- [ ] Test end-to-end: techlead update → dev session start

---

## Configuration Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_TOOLKIT_PLATFORM_URL` | Yes | Platform API URL |
| `AI_TOOLKIT_API_KEY` | Yes | API key from Platform |
| `AI_TOOLKIT_PROJECT_ID` | Yes | Project ID from Platform |

### File Structure

```
project/
├── .docs/                    # Platform-synced (gitignored)
│   ├── code-standards.md
│   ├── system-architecture.md
│   ├── project-overview-pdr.md
│   ├── design-guidelines.md
│   └── .sync-hash            # Hash for quick comparison
├── docs/                     # Git-tracked (fallback)
│   └── ...
├── scripts/
│   └── check-platform.sh     # Existing sync script
└── .claude/
    └── settings.json         # SessionStart hook config
```

---

## Next Steps

1. ✅ Script đã sẵn sàng
2. Configure SessionStart hook trong Claude Code settings
3. Set environment variables cho team
4. Update CLAUDE.md với `.docs/` priority
5. Test với scenario: techlead update → dev session start
6. Document trong team onboarding

---

## Unresolved Questions

None - solution uses existing infrastructure, no new development needed.
