#!/usr/bin/env node
/**
 * AI Toolkit Sync Platform - PreToolUse Hook (Protect Docs)
 *
 * This hook runs before Write/Edit operations and:
 * 1. Blocks writes to .docs/ folder (Platform-synced, read-only)
 * 2. Optionally blocks writes to docs/ folder (source of truth)
 *
 * Input: JSON from stdin with tool_input containing file_path
 *
 * Exit codes:
 * - 0: Allow operation
 * - 2: Block operation (stderr shown to Claude)
 *
 * JSON Output (optional):
 * {
 *   "hookSpecificOutput": {
 *     "hookEventName": "PreToolUse",
 *     "permissionDecision": "deny",
 *     "permissionDecisionReason": "..."
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROTECTED_FOLDERS = [
  '.docs/',   // Platform-synced folder (always protected)
  // 'docs/', // Uncomment to also protect source docs folder
];

const ALLOWED_FILES = [
  'CLAUDE.md',       // Allow CLAUDE.md in root
  './CLAUDE.md',
];

/**
 * Read JSON input from stdin (synchronous for reliability)
 * @returns {object}
 */
function readStdin() {
  try {
    // Use synchronous read for reliability in hook context
    const fs = require('fs');
    const data = fs.readFileSync(0, 'utf-8'); // fd 0 = stdin

    if (!data || data.trim() === '') {
      return {};
    }

    return JSON.parse(data);
  } catch (e) {
    // If stdin is not available or empty, return empty object
    if (e.code === 'EAGAIN' || e.code === 'EOF') {
      return {};
    }
    throw new Error(`Invalid JSON input: ${e.message}`);
  }
}

/**
 * Check if path is protected
 * @param {string} filePath - Target file path
 * @returns {{protected: boolean, folder: string, reason: string}}
 */
function isProtectedPath(filePath) {
  if (!filePath) {
    return { protected: false };
  }

  // Normalize path for comparison
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check if explicitly allowed
  for (const allowed of ALLOWED_FILES) {
    if (normalizedPath === allowed || normalizedPath.endsWith(`/${allowed}`)) {
      return { protected: false };
    }
  }

  // Check against protected folders
  for (const folder of PROTECTED_FOLDERS) {
    // Remove trailing slash for flexible matching
    const folderName = folder.replace(/\/$/, '');

    // Match: starts with ".docs/", contains "/.docs/", equals ".docs", or ends with "/.docs"
    const isMatch = normalizedPath.startsWith(`${folderName}/`) ||
                    normalizedPath.includes(`/${folderName}/`) ||
                    normalizedPath === folderName ||
                    normalizedPath.endsWith(`/${folderName}`);

    if (isMatch) {
      let reason;

      if (folder === '.docs/') {
        reason = `.docs/ folder is managed by AI Toolkit Sync Platform.
This folder contains documentation synced from the central Platform.
Only the Tech Lead can modify docs via the Platform web interface.

To update documentation:
1. Contact your Tech Lead
2. They will update docs via Platform
3. Docs will auto-sync to your .docs/ folder on next session`;
      } else if (folder === 'docs/') {
        reason = `docs/ folder is the source of truth managed by Platform.
Direct modifications may cause sync conflicts.
Claude should read from .docs/ instead.`;
      } else {
        reason = `${folder} is a protected folder.`;
      }

      return {
        protected: true,
        folder: folder,
        reason: reason,
      };
    }
  }

  return { protected: false };
}

function main() {
  try {
    const input = readStdin();

    // Get file path from tool input
    const filePath = input.tool_input?.file_path || '';

    // Check if path is protected
    const check = isProtectedPath(filePath);

    if (check.protected) {
      // Output JSON for Claude to understand
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: check.reason,
        },
      };

      console.log(JSON.stringify(output, null, 2));

      // Also output to stderr for user visibility
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🚫 WRITE BLOCKED - Protected Folder');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      console.error(`   File: ${filePath}`);
      console.error(`   Folder: ${check.folder}`);
      console.error('');
      console.error(check.reason.split('\n').map(l => `   ${l}`).join('\n'));
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');

      // Exit 2 = blocking error
      process.exit(2);
    }

    // Allow operation
    process.exit(0);

  } catch (error) {
    // Non-blocking error - allow operation but warn
    console.error(`[protect-docs hook] Error: ${error.message}`);
    process.exit(0);
  }
}

main();
