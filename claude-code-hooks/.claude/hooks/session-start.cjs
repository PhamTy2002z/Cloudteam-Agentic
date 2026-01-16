#!/usr/bin/env node
/**
 * AI Toolkit Sync Platform - SessionStart Hook
 *
 * This hook runs when Claude Code session starts and:
 * 1. Checks if project is locked (by TechLead editing docs)
 * 2. Compares local docs hash with Platform
 * 3. Auto-syncs docs if outdated
 *
 * Exit codes:
 * - 0: Success (stdout added to Claude context)
 * - 1: Non-blocking error (warning shown to user)
 * - 2: Blocking error (session blocked) - NOT used here, we warn instead
 *
 * Environment Variables:
 * - AI_TOOLKIT_PLATFORM_URL: Platform API URL
 * - AI_TOOLKIT_API_KEY: API key for authentication
 * - AI_TOOLKIT_PROJECT_ID: Project ID to sync
 * - CLAUDE_PROJECT_DIR: Project root directory (set by Claude)
 */

const path = require('path');
const {
  validateConfig,
  checkLockStatus,
  getDocsHash,
  syncDocs,
  getLocalHash,
  hasLocalDocs,
} = require('./utils.cjs');

async function main() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const output = [];

  // ASCII art header
  output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  output.push('       AI Toolkit Sync Platform - Session Start');
  output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  output.push('');

  // Validate configuration
  const configCheck = validateConfig();
  if (!configCheck.valid) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('🚫 SESSION BLOCKED - Configuration Required');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error(`   Missing: ${configCheck.missing.join(', ')}`);
    console.error('');
    console.error('   To configure, create .env.ai-toolkit file in project root:');
    console.error('');
    configCheck.missing.forEach(v => {
      console.error(`   ${v}=your_value_here`);
    });
    console.error('');
    console.error('   Or set environment variables:');
    console.error('');
    configCheck.missing.forEach(v => {
      if (process.platform === 'win32') {
        console.error(`   $env:${v} = "your_value_here"`);
      } else {
        console.error(`   export ${v}="your_value_here"`);
      }
    });
    console.error('');
    console.error('   Get your API Key and Project ID from:');
    console.error('   → AI Toolkit Platform → Project Settings → API Keys');
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');

    // Output JSON for Claude to understand
    const blockOutput = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        permissionDecision: 'deny',
        permissionDecisionReason: `AI Toolkit not configured. Missing: ${configCheck.missing.join(', ')}. Please create .env.ai-toolkit file or set environment variables before starting Claude Code session.`,
      },
    };
    console.log(JSON.stringify(blockOutput, null, 2));

    process.exit(2); // Blocking error - session cannot start
  }

  // Step 1: Check lock status
  output.push('📋 Checking project lock status...');

  const lockStatus = await checkLockStatus();

  if (lockStatus.offline) {
    output.push('   ⚠️  Platform unreachable (offline mode)');
    output.push(`   Error: ${lockStatus.error}`);
    output.push('');
  } else if (lockStatus.locked) {
    output.push('');
    output.push('🔒 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    output.push('   PROJECT IS LOCKED');
    output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    output.push('');
    output.push(`   Locked by: ${lockStatus.lockedBy}`);
    output.push(`   Since: ${lockStatus.lockedAt}`);
    if (lockStatus.expiresAt) {
      output.push(`   Expires: ${lockStatus.expiresAt}`);
    }
    output.push('');
    output.push('   ⚠️  TechLead is currently updating documentation.');
    output.push('   ⚠️  Docs may change during this session.');
    output.push('   ⚠️  Consider waiting for lock release before coding.');
    output.push('');
    output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    output.push('');
  } else {
    output.push('   ✅ Project is unlocked');
    output.push('');
  }

  // Step 2: Check docs sync status
  output.push('📄 Checking docs sync status...');

  const localHash = getLocalHash(projectDir);
  const remoteHashInfo = await getDocsHash();

  if (remoteHashInfo.error) {
    output.push(`   ⚠️  Cannot check remote hash: ${remoteHashInfo.error}`);

    if (hasLocalDocs(projectDir)) {
      output.push('   Using cached .docs/ (offline mode)');
    } else {
      output.push('   ❌ No cached docs available');
      output.push('   Please connect to Platform and sync docs first.');
    }
    output.push('');
  } else {
    const remoteHash = remoteHashInfo.hash;
    output.push(`   Local hash:  ${localHash || '(none)'}`);
    output.push(`   Remote hash: ${remoteHash}`);
    output.push('');

    // Step 3: Sync if needed
    if (localHash !== remoteHash) {
      output.push('📥 Docs are OUTDATED - syncing from Platform...');
      output.push('');

      const syncResult = await syncDocs(projectDir);

      if (syncResult.success) {
        output.push('   ✅ Sync completed successfully!');
        output.push('');
        output.push('   Synced files:');
        syncResult.syncedFiles.forEach(f => {
          output.push(`   - .docs/${f}`);
        });
        output.push('');
        output.push(`   New hash: ${syncResult.hash}`);
      } else {
        output.push(`   ❌ Sync failed: ${syncResult.error}`);

        if (hasLocalDocs(projectDir)) {
          output.push('   Using cached .docs/ (may be outdated)');
        }
      }
      output.push('');
    } else {
      output.push('   ✅ Docs are up to date');
      output.push('');
    }
  }

  // Summary
  output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (hasLocalDocs(projectDir)) {
    output.push('✅ Ready for Claude Code session');
    output.push('');
    output.push('📚 Documentation loaded from .docs/:');
    output.push('   - Read .docs/*.md before making code changes');
    output.push('   - .docs/ is READ-ONLY (managed by Platform)');
    output.push('   - Contact TechLead to update documentation');
  } else {
    output.push('⚠️  No documentation available');
    output.push('');
    output.push('   Please configure AI Toolkit and sync docs first.');
  }

  output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  output.push('');

  // Output to stdout (added to Claude context)
  console.log(output.join('\n'));
  process.exit(0);
}

main().catch((error) => {
  console.error(`SessionStart hook error: ${error.message}`);
  process.exit(1);
});
