#!/bin/bash
#
# AI Toolkit Sync Platform - Claude Code Hooks Installer
#
# Usage:
#   ./install.sh                    # Install to current project
#   ./install.sh /path/to/project   # Install to specific project
#
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SOURCE="$SCRIPT_DIR/.claude"

# Target project directory
TARGET_PROJECT="${1:-$(pwd)}"
TARGET_CLAUDE="$TARGET_PROJECT/.claude"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   AI Toolkit Sync Platform - Hooks Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Validate source exists
if [ ! -d "$HOOKS_SOURCE" ]; then
  log_error "Source hooks not found: $HOOKS_SOURCE"
  exit 1
fi

log_info "Source: $HOOKS_SOURCE"
log_info "Target: $TARGET_PROJECT"
echo ""

# Step 1: Create .claude directory structure
log_step "Creating .claude directory structure..."

mkdir -p "$TARGET_CLAUDE/hooks"
log_info "  Created $TARGET_CLAUDE/hooks/"

# Step 2: Copy hooks files
log_step "Copying hook files..."

cp "$HOOKS_SOURCE/hooks/utils.cjs" "$TARGET_CLAUDE/hooks/"
log_info "  Copied utils.cjs"

cp "$HOOKS_SOURCE/hooks/session-start.cjs" "$TARGET_CLAUDE/hooks/"
log_info "  Copied session-start.cjs"

cp "$HOOKS_SOURCE/hooks/protect-docs.cjs" "$TARGET_CLAUDE/hooks/"
log_info "  Copied protect-docs.cjs"

# Step 3: Merge or copy settings.json
log_step "Configuring settings.json..."

if [ -f "$TARGET_CLAUDE/settings.json" ]; then
  log_warn "  Existing settings.json found"
  log_warn "  Please manually merge hooks configuration from:"
  log_warn "  $HOOKS_SOURCE/settings.json"
  log_info "  Copied to: $TARGET_CLAUDE/settings.hooks.json"
  cp "$HOOKS_SOURCE/settings.json" "$TARGET_CLAUDE/settings.hooks.json"
else
  cp "$HOOKS_SOURCE/settings.json" "$TARGET_CLAUDE/settings.json"
  log_info "  Created settings.json"
fi

# Step 4: Create .docs directory
log_step "Creating .docs directory..."

mkdir -p "$TARGET_PROJECT/.docs"
log_info "  Created .docs/"

# Step 5: Update .gitignore
log_step "Updating .gitignore..."

GITIGNORE="$TARGET_PROJECT/.gitignore"
if [ -f "$GITIGNORE" ]; then
  if ! grep -q "^\.docs/$" "$GITIGNORE" 2>/dev/null; then
    echo "" >> "$GITIGNORE"
    echo "# Platform-synced docs (read-only)" >> "$GITIGNORE"
    echo ".docs/" >> "$GITIGNORE"
    log_info "  Added .docs/ to .gitignore"
  else
    log_info "  .docs/ already in .gitignore"
  fi
else
  echo "# Platform-synced docs (read-only)" > "$GITIGNORE"
  echo ".docs/" >> "$GITIGNORE"
  log_info "  Created .gitignore with .docs/"
fi

# Step 6: Create example .env
log_step "Creating example environment file..."

ENV_EXAMPLE="$TARGET_PROJECT/.env.ai-toolkit.example"
cat > "$ENV_EXAMPLE" << 'EOF'
# AI Toolkit Sync Platform Configuration
# Copy this to .env or add to your shell profile (~/.bashrc, ~/.zshrc)

# Platform API URL
AI_TOOLKIT_PLATFORM_URL=http://localhost:3001

# Your API Key (get from: Project Settings > API Keys > Generate)
AI_TOOLKIT_API_KEY=sk_your_api_key_here

# Project ID (visible in project URL)
AI_TOOLKIT_PROJECT_ID=clxxx_your_project_id
EOF
log_info "  Created .env.ai-toolkit.example"

# Done
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ✅ Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "Next steps:"
echo ""
echo "  1. Configure environment variables:"
echo "     ${YELLOW}export AI_TOOLKIT_PLATFORM_URL=\"http://localhost:3001\"${NC}"
echo "     ${YELLOW}export AI_TOOLKIT_API_KEY=\"sk_your_api_key\"${NC}"
echo "     ${YELLOW}export AI_TOOLKIT_PROJECT_ID=\"clxxx_project_id\"${NC}"
echo ""
echo "  2. Update your CLAUDE.md to reference .docs/:"
echo "     ${YELLOW}## Documentation${NC}"
echo "     ${YELLOW}Read .docs/*.md before making code changes.${NC}"
echo ""
echo "  3. Verify hooks with: ${YELLOW}/hooks${NC} command in Claude Code"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
