# Claude Code Hooks for AI Toolkit Sync Platform

Bộ hooks tích hợp Claude Code với AI Toolkit Sync Platform để đảm bảo:
- ✅ Luôn sync docs mới nhất trước khi AI bắt đầu
- ✅ Block writes vào `.docs/` folder (read-only từ Platform)
- ✅ Kiểm tra lock status trước mỗi session

## Installation

### 1. Copy hooks vào project

```bash
# Copy thư mục hooks vào .claude/
cp -r claude-code-hooks/.claude/hooks /path/to/your-project/.claude/

# Hoặc copy toàn bộ .claude folder
cp -r claude-code-hooks/.claude /path/to/your-project/
```

### 2. Cấu hình Environment Variables

Thêm vào `~/.bashrc`, `~/.zshrc`, hoặc project `.env`:

```bash
export AI_TOOLKIT_PLATFORM_URL="http://localhost:3001"
export AI_TOOLKIT_API_KEY="sk_your_api_key_here"
export AI_TOOLKIT_PROJECT_ID="clxxx_your_project_id"
```

**Lấy giá trị từ Platform:**
- **API Key**: Project Settings → API Keys → Generate
- **Project ID**: Hiển thị trong URL của project

### 3. Cập nhật CLAUDE.md

Thêm vào project `CLAUDE.md`:

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

### 4. Cập nhật .gitignore

```gitignore
# Platform-synced docs (Claude reads from here)
.docs/
```

## Hook Files

| File | Event | Mô tả |
|------|-------|-------|
| `session-start.cjs` | SessionStart | Check lock + sync docs khi session bắt đầu |
| `protect-docs.cjs` | PreToolUse | Block writes vào .docs/ folder |
| `settings.json` | - | Cấu hình hooks |

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                       HOOK EXECUTION FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

  $ claude
      │
      ▼
  [SessionStart Hook]
      │
      ├─── 1. Check if project is LOCKED
      │         │
      │    ┌────┴────┐
      │    │         │
      │    ▼         ▼
      │ [LOCKED]  [UNLOCKED]
      │    │         │
      │    ▼         ▼
      │  Warning    Continue
      │  in context
      │         │
      ├─── 2. Compare docs hash (local vs remote)
      │         │
      │    ┌────┴────┐
      │    │         │
      │    ▼         ▼
      │ [OUTDATED] [UP-TO-DATE]
      │    │         │
      │    ▼         ▼
      │  Auto-sync  Skip
      │    │         │
      │    └────┬────┘
      │         │
      ▼         ▼
  Claude starts với LATEST docs ✅
      │
      │
  [During Session - PreToolUse Hook]
      │
      ├─── On Write/Edit operations
      │         │
      │    Check if target is .docs/
      │         │
      │    ┌────┴────┐
      │    │         │
      │    ▼         ▼
      │  [.docs/]  [Other]
      │    │         │
      │    ▼         ▼
      │  BLOCK ❌   Allow ✅
      │  exit 2
```

## Troubleshooting

### "API key required" error
Đảm bảo đã set `AI_TOOLKIT_API_KEY` environment variable.

### "Project not found" error
Kiểm tra `AI_TOOLKIT_PROJECT_ID` đúng với project ID trên Platform.

### "Project locked" warning
TechLead đang update docs. Warning được thêm vào context, Claude sẽ nhận biết.

### Offline mode
Nếu Platform không reachable, hooks sẽ sử dụng cached `.docs/`.
Lần sync đầu tiên cần kết nối Platform.

### Check hooks registration
Chạy `/hooks` trong Claude Code để kiểm tra hooks đã được đăng ký.

### Debug mode
```bash
claude --debug
```

## Dependencies

- Node.js 18+ (cho .cjs scripts)
- curl (cho API calls)
- jq (JSON parser) - optional, dùng Node.js thay thế

## File Structure

```
claude-code-hooks/
├── README.md
└── .claude/
    ├── settings.json           # Hook configuration
    └── hooks/
        ├── session-start.cjs   # SessionStart hook
        ├── protect-docs.cjs    # PreToolUse hook (Write/Edit)
        └── utils.cjs           # Shared utilities
```

## License

MIT - Cloudteam Agentic
