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
