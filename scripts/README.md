# Claude Code Hooks

Scripts to integrate with Claude Code for docs protection.

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

## Dependencies

- `curl` - HTTP client
- `jq` - JSON parser (install: `brew install jq` on macOS)
