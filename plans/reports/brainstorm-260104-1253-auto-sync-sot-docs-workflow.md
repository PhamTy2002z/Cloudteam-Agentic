# Brainstorm Report: Auto-Sync SOT Docs for AI Code Generation

**Date**: 2026-01-04
**Status**: Proposal
**Author**: Claude Code (Brainstorm Session)

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
| Conflict handling | Remote wins (force overwrite) |
| Dev code tay | Không bị ảnh hưởng |
| SOT ownership | **Chỉ techlead** được update SOT docs |

---

## Source of Truth (SOT) Files

4 files cần enforce sync:

| File | Purpose |
|------|---------|
| `docs/code-standards.md` | Coding conventions, naming rules |
| `docs/system-architecture.md` | Technical patterns, decisions |
| `docs/project-overview-pdr.md` | Business scope, requirements |
| `docs/design-guidelines.md` | UI/UX guidelines |

**Excluded** (derived/reference):
- `codebase-summary.md` - AI có thể tự đọc codebase
- `deployment-guide.md` - Ops-focused
- `project-roadmap.md` - Planning doc
- `CLAUDE.md` - Không cần enforce

---

## Solution: Auto-Sync on Session Start

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHLEAD WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│  1. Update SOT docs                                         │
│  2. Commit & Push lên origin/main                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DEV WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│  1. Dev clone/pull repo về local                            │
│  2. Dev mở Claude Code CLI                                  │
│                              │                              │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           SESSION START HOOK (Auto-Sync)              │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  a. git fetch origin main --quiet                     │  │
│  │  b. Compare local vs origin/main cho 4 SOT files      │  │
│  │  c. Nếu có diff → checkout origin/main version        │  │
│  │  d. Output: "Synced X files from remote"              │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│                              ▼                              │
│  3. Claude Code đọc SOT docs (version mới nhất)             │
│  4. Dev yêu cầu generate code                               │
│  5. AI generate code COMPLY với docs mới                    │
│  6. Dev code tay bình thường (không bị block)               │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Components

```
~/.claude/hooks/
└── docs-auto-sync.cjs    # SessionStart hook

Config:
- SOT_FILES: [
    "code-standards.md",
    "system-architecture.md",
    "project-overview-pdr.md",
    "design-guidelines.md"
  ]
- DOCS_DIR: "./docs"
- REMOTE_BRANCH: "origin/main"
```

### Hook Logic (Pseudocode)

```javascript
// docs-auto-sync.cjs (SessionStart hook)

const SOT_FILES = [
  "docs/code-standards.md",
  "docs/system-architecture.md",
  "docs/project-overview-pdr.md",
  "docs/design-guidelines.md"
];

async function main() {
  // 1. Fetch latest from remote
  exec("git fetch origin main --quiet");

  // 2. Check each SOT file for diff
  const outdatedFiles = [];
  for (const file of SOT_FILES) {
    const localHash = exec(`git hash-object ${file}`);
    const remoteHash = exec(`git rev-parse origin/main:${file}`);
    if (localHash !== remoteHash) {
      outdatedFiles.push(file);
    }
  }

  // 3. Sync outdated files
  if (outdatedFiles.length > 0) {
    for (const file of outdatedFiles) {
      exec(`git checkout origin/main -- ${file}`);
    }
    console.log(`✓ Synced ${outdatedFiles.length} SOT docs from remote`);
    console.log(`  Files: ${outdatedFiles.join(", ")}`);
  }
}
```

---

## Alternatives Considered

### Option A: Version Hash Check (Rejected)
- Techlead bump version manually
- Hook check hash mismatch → block
- **Rejected**: Cần manual step từ techlead

### Option B: Remote Sync Check on Every Tool Call (Rejected)
- Check remote mỗi lần AI generate code
- **Rejected**: Latency overhead, network dependency

### Option C: Timestamp Validation (Rejected)
- Compare docs modified time vs session start
- **Rejected**: False positives, chỉ detect sau pull

### Option D: Auto-Sync on Session Start (Selected)
- Fetch + sync 1 lần khi session start
- **Selected**: Simple, no manual steps, no latency per tool call

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Session start only | Avoid latency per tool call |
| Remote wins | Techlead is source of truth |
| 4 SOT files | Balance between enforcement và flexibility |
| No blocking | Dev code tay không bị ảnh hưởng |
| Git-based sync | Leverage existing infrastructure |

---

## Local Changes Handling Strategy

**Context:** Chỉ techlead được update SOT docs → Dev không nên có local changes.

| Option | Behavior | Verdict |
|--------|----------|---------|
| A. Ghi đè | Force sync, mất local changes | **✓ Selected** |
| B. Stash | Backup local → sync → dev merge sau | Overkill |
| C. Skip + Warn | Giữ local, AI có thể dùng docs cũ | ❌ Vi phạm goal |

**Decision: Option A - Force Overwrite**

Lý do:
- Dev không được phép edit SOT docs
- Nếu có local changes → unauthorized edit → mất là expected
- Simple, no conditions, no edge cases

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Network unavailable | Fail gracefully, use local version + warn |
| Git conflicts | Force checkout remote version (no merge) |
| Large docs slow fetch | Only fetch, không pull full repo |
| Dev có local changes | **Ghi đè luôn** (dev không được edit SOT) |

---

## Success Metrics

- [ ] AI-generated code complies với latest docs
- [ ] Zero manual intervention từ dev
- [ ] Session start time < 2s overhead
- [ ] No false positives blocking dev work

---

## Next Steps

1. Implement `docs-auto-sync.cjs` hook
2. Add to `~/.claude/settings.json` SessionStart hooks
3. Test với scenario: techlead update → dev session start
4. Document trong team onboarding

---

## Unresolved Questions

1. Nếu dev đang ở branch khác (không phải main), có nên sync không?
2. Có cần config SOT files per-project hay global?
