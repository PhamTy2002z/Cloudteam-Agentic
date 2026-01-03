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
