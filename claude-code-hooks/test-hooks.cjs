#!/usr/bin/env node
/**
 * AI Toolkit Hooks - Quick Test Script
 *
 * Run: node test-hooks.cjs
 *
 * Tests all hooks without needing Claude Code
 */

const { spawn, execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}[TEST]${colors.reset} ${msg}`),
  header: (msg) => {
    console.log('');
    console.log(`${colors.blue}${'━'.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}  ${msg}${colors.reset}`);
    console.log(`${colors.blue}${'━'.repeat(60)}${colors.reset}`);
  },
};

// Get hooks directory
const HOOKS_DIR = path.join(__dirname, '.claude', 'hooks');

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordResult(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    log.info(`${name}`);
  } else {
    results.failed++;
    log.fail(`${name}${details ? `: ${details}` : ''}`);
  }
}

// Test 1: Check files exist
function testFilesExist() {
  log.header('Test 1: Check Hook Files Exist');

  const files = [
    '.claude/settings.json',
    '.claude/hooks/utils.cjs',
    '.claude/hooks/session-start.cjs',
    '.claude/hooks/protect-docs.cjs',
  ];

  files.forEach((file) => {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    recordResult(`File exists: ${file}`, exists);
  });
}

// Test 2: Check settings.json is valid JSON
function testSettingsJson() {
  log.header('Test 2: Validate settings.json');

  try {
    const settingsPath = path.join(__dirname, '.claude', 'settings.json');
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const json = JSON.parse(content);

    recordResult('settings.json is valid JSON', true);
    recordResult('Has hooks config', !!json.hooks);
    recordResult('Has SessionStart hook', !!json.hooks?.SessionStart);
    recordResult('Has PreToolUse hook', !!json.hooks?.PreToolUse);
  } catch (error) {
    recordResult('settings.json is valid JSON', false, error.message);
  }
}

// Test 3: Test utils.cjs exports
function testUtils() {
  log.header('Test 3: Validate utils.cjs');

  try {
    const utils = require(path.join(HOOKS_DIR, 'utils.cjs'));

    recordResult('utils.cjs loads', true);
    recordResult('Has CONFIG', !!utils.CONFIG);
    recordResult('Has apiCall function', typeof utils.apiCall === 'function');
    recordResult('Has checkLockStatus function', typeof utils.checkLockStatus === 'function');
    recordResult('Has syncDocs function', typeof utils.syncDocs === 'function');
    recordResult('Has validateConfig function', typeof utils.validateConfig === 'function');
  } catch (error) {
    recordResult('utils.cjs loads', false, error.message);
  }
}

// Test 4: Test protect-docs.cjs blocking
function testProtectDocs() {
  log.header('Test 4: Test protect-docs.cjs');

  const protectDocsPath = path.join(HOOKS_DIR, 'protect-docs.cjs');

  // Test: Should block .docs/ write
  const testCases = [
    {
      name: 'Block write to .docs/test.md',
      input: { tool_input: { file_path: '.docs/test.md' } },
      expectBlock: true,
    },
    {
      name: 'Block write to /project/.docs/file.md',
      input: { tool_input: { file_path: '/project/.docs/file.md' } },
      expectBlock: true,
    },
    {
      name: 'Allow write to src/test.ts',
      input: { tool_input: { file_path: 'src/test.ts' } },
      expectBlock: false,
    },
    {
      name: 'Allow write to CLAUDE.md',
      input: { tool_input: { file_path: 'CLAUDE.md' } },
      expectBlock: false,
    },
    {
      name: 'Allow write to README.md',
      input: { tool_input: { file_path: 'README.md' } },
      expectBlock: false,
    },
  ];

  testCases.forEach(({ name, input, expectBlock }) => {
    try {
      // Use spawnSync with stdin input instead of echo (cross-platform)
      const result = spawnSync('node', [protectDocsPath], {
        input: JSON.stringify(input),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const exitCode = result.status;

      if (expectBlock) {
        // Should exit with code 2 (blocked)
        recordResult(name, exitCode === 2, exitCode === 2 ? '' : `Exit code: ${exitCode}`);
      } else {
        // Should exit with code 0 (allowed)
        recordResult(name, exitCode === 0, exitCode === 0 ? '' : `Exit code: ${exitCode}`);
      }
    } catch (error) {
      recordResult(name, false, `Error: ${error.message}`);
    }
  });
}

// Test 5: Test session-start.cjs runs
function testSessionStart() {
  log.header('Test 5: Test session-start.cjs');

  const sessionStartPath = path.join(HOOKS_DIR, 'session-start.cjs');

  // Test: Without config - should BLOCK with exit code 2
  try {
    const result = execSync(`node "${sessionStartPath}"`, {
      encoding: 'utf-8',
      env: {
        ...process.env,
        AI_TOOLKIT_API_KEY: '',
        AI_TOOLKIT_PROJECT_ID: '',
      },
      timeout: 10000,
    });

    // Should NOT reach here
    recordResult('Blocks when missing config', false, 'Expected exit 2 but got exit 0');
  } catch (error) {
    const exitCode = error.status;
    const stderr = error.stderr || '';

    recordResult('Blocks when missing config (exit 2)', exitCode === 2);
    recordResult('Shows SESSION BLOCKED message', stderr.includes('SESSION BLOCKED'));
    recordResult('Lists missing vars in error', stderr.includes('Missing:'));
  }
}

// Test 6: Test with mock API
function testWithMockEnv() {
  log.header('Test 6: Test with Mock Environment');

  // Clear require cache to get fresh CONFIG
  const utilsPath = path.join(HOOKS_DIR, 'utils.cjs');
  delete require.cache[require.resolve(utilsPath)];

  // Set test env vars BEFORE requiring
  process.env.AI_TOOLKIT_PLATFORM_URL = 'http://localhost:3001';
  process.env.AI_TOOLKIT_API_KEY = 'sk_test_key';
  process.env.AI_TOOLKIT_PROJECT_ID = 'cltest123';

  try {
    const utils = require(utilsPath);

    const configCheck = utils.validateConfig();
    recordResult('Config validation passes with env vars', configCheck.valid);

    recordResult('CONFIG.platformUrl set', utils.CONFIG.platformUrl === 'http://localhost:3001');
    recordResult('CONFIG.apiKey set', utils.CONFIG.apiKey === 'sk_test_key');
    recordResult('CONFIG.projectId set', utils.CONFIG.projectId === 'cltest123');
  } catch (error) {
    recordResult('Mock environment test', false, error.message);
  }
}

// Test 7: Test .env file loading (multi-project isolation)
function testEnvFileLoading() {
  log.header('Test 7: Test .env File Loading (Multi-Project)');

  // Create a temporary .env.ai-toolkit file
  const envFilePath = path.join(__dirname, '.env.ai-toolkit');
  const testEnvContent = `# Test env file
AI_TOOLKIT_PLATFORM_URL=http://test-from-file:4000
AI_TOOLKIT_API_KEY=sk_from_env_file
AI_TOOLKIT_PROJECT_ID=proj_from_file
`;

  try {
    // Write test .env file
    fs.writeFileSync(envFilePath, testEnvContent);

    // Clear require cache and env vars
    const utilsPath = path.join(HOOKS_DIR, 'utils.cjs');
    delete require.cache[require.resolve(utilsPath)];
    delete process.env.AI_TOOLKIT_PLATFORM_URL;
    delete process.env.AI_TOOLKIT_API_KEY;
    delete process.env.AI_TOOLKIT_PROJECT_ID;

    // Require utils - should load from .env file
    const utils = require(utilsPath);

    recordResult('.env file parsed', true);
    recordResult('CONFIG.platformUrl from file', utils.CONFIG.platformUrl === 'http://test-from-file:4000');
    recordResult('CONFIG.apiKey from file', utils.CONFIG.apiKey === 'sk_from_env_file');
    recordResult('CONFIG.projectId from file', utils.CONFIG.projectId === 'proj_from_file');

    // Test priority: env var > .env file
    delete require.cache[require.resolve(utilsPath)];
    process.env.AI_TOOLKIT_PROJECT_ID = 'proj_from_env_var';

    const utils2 = require(utilsPath);
    recordResult('Env var overrides .env file', utils2.CONFIG.projectId === 'proj_from_env_var');

  } catch (error) {
    recordResult('.env file loading', false, error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(envFilePath)) {
      fs.unlinkSync(envFilePath);
    }
  }
}

// Run all tests
async function main() {
  console.log('');
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}   AI Toolkit Hooks - Quick Test Suite${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log('');

  testFilesExist();
  testSettingsJson();
  testUtils();
  testProtectDocs();
  testSessionStart();
  testWithMockEnv();
  testEnvFileLoading();

  // Summary
  console.log('');
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}   Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log('');
  console.log(`   ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`   ${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`   Total:  ${results.passed + results.failed}`);
  console.log('');

  if (results.failed > 0) {
    console.log(`${colors.yellow}Failed tests:${colors.reset}`);
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`   - ${t.name}${t.details ? `: ${t.details}` : ''}`);
      });
    console.log('');
  }

  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}`);

  // Exit code based on results
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
