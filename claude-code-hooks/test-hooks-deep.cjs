#!/usr/bin/env node
/**
 * AI Toolkit Hooks - Deep Edge Case Test Suite
 *
 * Run: node test-hooks-deep.cjs
 *
 * Comprehensive edge case testing for all hooks
 */

const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  pass: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  header: (msg) => {
    console.log('');
    console.log(`${colors.blue}${'━'.repeat(70)}${colors.reset}`);
    console.log(`${colors.blue}  ${msg}${colors.reset}`);
    console.log(`${colors.blue}${'━'.repeat(70)}${colors.reset}`);
  },
  section: (msg) => {
    console.log('');
    console.log(`${colors.magenta}▶ ${msg}${colors.reset}`);
  },
};

// Get hooks directory
const HOOKS_DIR = path.join(__dirname, '.claude', 'hooks');
const PROTECT_DOCS_PATH = path.join(HOOKS_DIR, 'protect-docs.cjs');
const SESSION_START_PATH = path.join(HOOKS_DIR, 'session-start.cjs');
const UTILS_PATH = path.join(HOOKS_DIR, 'utils.cjs');

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
    log.pass(name);
  } else {
    results.failed++;
    log.fail(`${name}${details ? ` (${details})` : ''}`);
  }
}

// Helper: Run protect-docs.cjs with JSON input
function runProtectDocs(input) {
  const result = spawnSync('node', [PROTECT_DOCS_PATH], {
    input: JSON.stringify(input),
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  return {
    exitCode: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

// Helper: Clear require cache for fresh module load
function clearRequireCache(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
}

// Helper: Create temporary .env file
function createTempEnvFile(content, filename = '.env.ai-toolkit') {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// Helper: Clean up temp files
function cleanupTempFiles() {
  const files = [
    '.env.ai-toolkit',
    '.env',
    '.env.test',
    '.env.malformed',
  ];

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE 1: protect-docs.cjs - Path Protection Edge Cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function testProtectDocsBlockScenarios() {
  log.header('TEST 1: protect-docs.cjs - Block Scenarios (Exit 2)');

  const blockCases = [
    {
      name: 'Basic .docs path',
      path: '.docs/test.md',
    },
    {
      name: 'Nested .docs path',
      path: '.docs/subfolder/deep/file.md',
    },
    {
      name: 'Absolute path with .docs',
      path: '/absolute/path/.docs/file.md',
    },
    {
      name: 'Windows path with backslashes',
      path: 'C:\\Windows\\path\\.docs\\file.md',
    },
    {
      name: 'Just folder path',
      path: '.docs/',
    },
    {
      name: 'Without trailing slash',
      path: '.docs',
    },
    {
      name: 'Mid-path .docs',
      path: 'project/.docs/readme.md',
    },
    {
      name: 'Parent directory escape',
      path: '../.docs/escape.md',
    },
    {
      name: 'Multiple slashes',
      path: '.docs///test.md',
    },
    {
      name: 'Mixed slashes (Windows)',
      path: '.docs\\subfolder/file.md',
    },
  ];

  blockCases.forEach(({ name, path: filePath }) => {
    const result = runProtectDocs({ tool_input: { file_path: filePath } });
    recordResult(
      `BLOCK: ${name} (${filePath})`,
      result.exitCode === 2,
      result.exitCode !== 2 ? `Exit code: ${result.exitCode}` : ''
    );
  });
}

function testProtectDocsAllowScenarios() {
  log.header('TEST 2: protect-docs.cjs - Allow Scenarios (Exit 0)');

  const allowCases = [
    {
      name: 'Normal source file',
      path: 'src/test.ts',
    },
    {
      name: 'Allowed file (CLAUDE.md)',
      path: 'CLAUDE.md',
    },
    {
      name: 'Relative allowed file',
      path: './CLAUDE.md',
    },
    {
      name: 'docs folder (not .docs)',
      path: 'docs/readme.md',
    },
    {
      name: 'Similar folder (.documentation)',
      path: '.documentation/file.md',
    },
    {
      name: '.docs in filename',
      path: 'my.docs.file.md',
    },
    {
      name: 'Contains "docs" string',
      path: 'nodocs/file.md',
    },
    {
      name: 'README.md',
      path: 'README.md',
    },
    {
      name: 'Deep nested normal path',
      path: 'src/components/ui/button.tsx',
    },
  ];

  allowCases.forEach(({ name, path: filePath }) => {
    const result = runProtectDocs({ tool_input: { file_path: filePath } });
    recordResult(
      `ALLOW: ${name} (${filePath})`,
      result.exitCode === 0,
      result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : ''
    );
  });
}

function testProtectDocsEdgeCases() {
  log.header('TEST 3: protect-docs.cjs - Edge Cases & Error Handling');

  const edgeCases = [
    {
      name: 'Empty path',
      input: { tool_input: { file_path: '' } },
      expectedExit: 0,
    },
    {
      name: 'Missing file_path key',
      input: { tool_input: {} },
      expectedExit: 0,
    },
    {
      name: 'Missing tool_input',
      input: {},
      expectedExit: 0,
    },
    {
      name: 'Null file_path',
      input: { tool_input: { file_path: null } },
      expectedExit: 0,
    },
    {
      name: 'Undefined file_path',
      input: { tool_input: { file_path: undefined } },
      expectedExit: 0,
    },
  ];

  edgeCases.forEach(({ name, input, expectedExit }) => {
    const result = runProtectDocs(input);
    recordResult(
      name,
      result.exitCode === expectedExit,
      result.exitCode !== expectedExit ? `Exit code: ${result.exitCode}, expected: ${expectedExit}` : ''
    );
  });

  // Test invalid JSON
  log.section('Invalid JSON Input');
  const invalidJsonResult = spawnSync('node', [PROTECT_DOCS_PATH], {
    input: '{invalid json',
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  recordResult(
    'Invalid JSON (graceful handling)',
    invalidJsonResult.status === 0,
    invalidJsonResult.status !== 0 ? `Exit code: ${invalidJsonResult.status}` : ''
  );

  // Test no stdin
  log.section('No stdin input');
  const noStdinResult = spawnSync('node', [PROTECT_DOCS_PATH], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  recordResult(
    'No stdin input (graceful handling)',
    noStdinResult.status === 0,
    noStdinResult.status !== 0 ? `Exit code: ${noStdinResult.status}` : ''
  );
}

function testProtectDocsCaseSensitivity() {
  log.header('TEST 4: protect-docs.cjs - Case Sensitivity');

  const caseCases = [
    {
      name: 'Uppercase .DOCS',
      path: '.DOCS/file.md',
      shouldBlock: false, // Current implementation is case-sensitive
    },
    {
      name: 'Mixed case .Docs',
      path: '.Docs/file.md',
      shouldBlock: false,
    },
    {
      name: 'Lowercase .docs (normal)',
      path: '.docs/file.md',
      shouldBlock: true,
    },
  ];

  caseCases.forEach(({ name, path: filePath, shouldBlock }) => {
    const result = runProtectDocs({ tool_input: { file_path: filePath } });
    const expectedExit = shouldBlock ? 2 : 0;
    recordResult(
      name,
      result.exitCode === expectedExit,
      `Exit code: ${result.exitCode}, expected: ${expectedExit}`
    );
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE 2: utils.cjs - Config Loading Edge Cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function testUtilsConfigDefaults() {
  log.header('TEST 5: utils.cjs - Config Defaults (No Env, No File)');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  // Clear all env vars
  delete process.env.AI_TOOLKIT_PLATFORM_URL;
  delete process.env.AI_TOOLKIT_API_KEY;
  delete process.env.AI_TOOLKIT_PROJECT_ID;

  const utils = require(UTILS_PATH);

  recordResult(
    'Default platformUrl',
    utils.CONFIG.platformUrl === 'http://localhost:3001'
  );
  recordResult(
    'Default apiKey (empty)',
    utils.CONFIG.apiKey === ''
  );
  recordResult(
    'Default projectId (empty)',
    utils.CONFIG.projectId === ''
  );
  recordResult(
    'Timeout is set',
    utils.CONFIG.timeout === 10000
  );
  recordResult(
    'MaxRetries is set',
    utils.CONFIG.maxRetries === 3
  );
}

function testUtilsConfigEnvVars() {
  log.header('TEST 6: utils.cjs - Config from Environment Variables');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  process.env.AI_TOOLKIT_PLATFORM_URL = 'https://env-var.example.com';
  process.env.AI_TOOLKIT_API_KEY = 'sk_env_key_123';
  process.env.AI_TOOLKIT_PROJECT_ID = 'proj_env_456';

  const utils = require(UTILS_PATH);

  recordResult(
    'platformUrl from env var',
    utils.CONFIG.platformUrl === 'https://env-var.example.com'
  );
  recordResult(
    'apiKey from env var',
    utils.CONFIG.apiKey === 'sk_env_key_123'
  );
  recordResult(
    'projectId from env var',
    utils.CONFIG.projectId === 'proj_env_456'
  );
}

function testUtilsConfigEnvFile() {
  log.header('TEST 7: utils.cjs - Config from .env.ai-toolkit File');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  // Clear env vars
  delete process.env.AI_TOOLKIT_PLATFORM_URL;
  delete process.env.AI_TOOLKIT_API_KEY;
  delete process.env.AI_TOOLKIT_PROJECT_ID;

  const envContent = `# AI Toolkit Config
AI_TOOLKIT_PLATFORM_URL=https://file.example.com
AI_TOOLKIT_API_KEY=sk_file_key_789
AI_TOOLKIT_PROJECT_ID=proj_file_012
`;

  createTempEnvFile(envContent, '.env.ai-toolkit');

  const utils = require(UTILS_PATH);

  recordResult(
    'platformUrl from .env.ai-toolkit',
    utils.CONFIG.platformUrl === 'https://file.example.com'
  );
  recordResult(
    'apiKey from .env.ai-toolkit',
    utils.CONFIG.apiKey === 'sk_file_key_789'
  );
  recordResult(
    'projectId from .env.ai-toolkit',
    utils.CONFIG.projectId === 'proj_file_012'
  );

  cleanupTempFiles();
}

function testUtilsConfigEnvFileFallback() {
  log.header('TEST 8: utils.cjs - Config from .env File (Fallback)');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  delete process.env.AI_TOOLKIT_PLATFORM_URL;
  delete process.env.AI_TOOLKIT_API_KEY;
  delete process.env.AI_TOOLKIT_PROJECT_ID;

  const envContent = `AI_TOOLKIT_PLATFORM_URL=https://dotenv.example.com
AI_TOOLKIT_API_KEY=sk_dotenv_key
AI_TOOLKIT_PROJECT_ID=proj_dotenv
`;

  createTempEnvFile(envContent, '.env');

  const utils = require(UTILS_PATH);

  recordResult(
    'platformUrl from .env',
    utils.CONFIG.platformUrl === 'https://dotenv.example.com'
  );
  recordResult(
    'apiKey from .env',
    utils.CONFIG.apiKey === 'sk_dotenv_key'
  );
  recordResult(
    'projectId from .env',
    utils.CONFIG.projectId === 'proj_dotenv'
  );

  cleanupTempFiles();
}

function testUtilsConfigPriority() {
  log.header('TEST 9: utils.cjs - Config Priority (Env Var > File)');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  // Create .env file
  createTempEnvFile(`AI_TOOLKIT_PROJECT_ID=proj_from_file`, '.env.ai-toolkit');

  // Set env var (should override file)
  process.env.AI_TOOLKIT_PROJECT_ID = 'proj_from_env_var';

  const utils = require(UTILS_PATH);

  recordResult(
    'Env var overrides .env file',
    utils.CONFIG.projectId === 'proj_from_env_var'
  );

  cleanupTempFiles();
}

function testUtilsEnvFileWithComments() {
  log.header('TEST 10: utils.cjs - .env File with Comments');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  delete process.env.AI_TOOLKIT_API_KEY;

  const envContent = `# This is a comment
AI_TOOLKIT_API_KEY=sk_valid_key
# Another comment
`;

  createTempEnvFile(envContent, '.env.ai-toolkit');

  const utils = require(UTILS_PATH);

  recordResult(
    'Parses .env with comments',
    utils.CONFIG.apiKey === 'sk_valid_key'
  );

  cleanupTempFiles();
}

function testUtilsEnvFileWithQuotes() {
  log.header('TEST 11: utils.cjs - .env File with Quotes');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  delete process.env.AI_TOOLKIT_API_KEY;
  delete process.env.AI_TOOLKIT_PROJECT_ID;

  const envContent = `AI_TOOLKIT_API_KEY="sk_double_quotes"
AI_TOOLKIT_PROJECT_ID='proj_single_quotes'
`;

  createTempEnvFile(envContent, '.env.ai-toolkit');

  const utils = require(UTILS_PATH);

  recordResult(
    'Strips double quotes',
    utils.CONFIG.apiKey === 'sk_double_quotes'
  );
  recordResult(
    'Strips single quotes',
    utils.CONFIG.projectId === 'proj_single_quotes'
  );

  cleanupTempFiles();
}

function testUtilsEnvFileWithEmptyValues() {
  log.header('TEST 12: utils.cjs - .env File with Empty Values');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  delete process.env.AI_TOOLKIT_API_KEY;

  const envContent = `AI_TOOLKIT_API_KEY=
AI_TOOLKIT_PROJECT_ID=
`;

  createTempEnvFile(envContent, '.env.ai-toolkit');

  const utils = require(UTILS_PATH);

  recordResult(
    'Handles empty value (empty string)',
    utils.CONFIG.apiKey === ''
  );
  recordResult(
    'Handles empty projectId',
    utils.CONFIG.projectId === ''
  );

  cleanupTempFiles();
}

function testUtilsEnvFileWithSpecialChars() {
  log.header('TEST 13: utils.cjs - .env File with Special Characters');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  delete process.env.AI_TOOLKIT_API_KEY;

  const envContent = `AI_TOOLKIT_API_KEY=sk_key_with_underscores_123
AI_TOOLKIT_PROJECT_ID=proj-with-dashes-456
`;

  createTempEnvFile(envContent, '.env.ai-toolkit');

  const utils = require(UTILS_PATH);

  recordResult(
    'Handles underscores',
    utils.CONFIG.apiKey === 'sk_key_with_underscores_123'
  );
  recordResult(
    'Handles dashes',
    utils.CONFIG.projectId === 'proj-with-dashes-456'
  );

  cleanupTempFiles();
}

function testUtilsEnvFileMalformed() {
  log.header('TEST 14: utils.cjs - Malformed .env File (Graceful Fallback)');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  delete process.env.AI_TOOLKIT_API_KEY;

  const envContent = `INVALID LINE WITHOUT EQUALS
AI_TOOLKIT_API_KEY=valid_key
ANOTHER_INVALID
`;

  createTempEnvFile(envContent, '.env.ai-toolkit');

  const utils = require(UTILS_PATH);

  recordResult(
    'Ignores malformed lines, loads valid ones',
    utils.CONFIG.apiKey === 'valid_key'
  );

  cleanupTempFiles();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE 3: utils.cjs - validateConfig
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function testUtilsValidateConfig() {
  log.header('TEST 15: utils.cjs - validateConfig()');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  // Test: All config present
  log.section('All config present');
  process.env.AI_TOOLKIT_API_KEY = 'sk_valid';
  process.env.AI_TOOLKIT_PROJECT_ID = 'proj_valid';

  let utils = require(UTILS_PATH);
  let validation = utils.validateConfig();

  recordResult(
    'Valid when all config present',
    validation.valid === true && validation.missing.length === 0
  );

  // Test: Missing apiKey
  log.section('Missing apiKey');
  clearRequireCache(UTILS_PATH);
  delete process.env.AI_TOOLKIT_API_KEY;
  process.env.AI_TOOLKIT_PROJECT_ID = 'proj_valid';

  utils = require(UTILS_PATH);
  validation = utils.validateConfig();

  recordResult(
    'Invalid when missing apiKey',
    validation.valid === false && validation.missing.includes('AI_TOOLKIT_API_KEY')
  );

  // Test: Missing projectId
  log.section('Missing projectId');
  clearRequireCache(UTILS_PATH);
  process.env.AI_TOOLKIT_API_KEY = 'sk_valid';
  delete process.env.AI_TOOLKIT_PROJECT_ID;

  utils = require(UTILS_PATH);
  validation = utils.validateConfig();

  recordResult(
    'Invalid when missing projectId',
    validation.valid === false && validation.missing.includes('AI_TOOLKIT_PROJECT_ID')
  );

  // Test: Empty strings
  log.section('Empty strings');
  clearRequireCache(UTILS_PATH);
  process.env.AI_TOOLKIT_API_KEY = '';
  process.env.AI_TOOLKIT_PROJECT_ID = '';

  utils = require(UTILS_PATH);
  validation = utils.validateConfig();

  recordResult(
    'Invalid when empty strings',
    validation.valid === false && validation.missing.length === 2
  );

  // Cleanup
  delete process.env.AI_TOOLKIT_API_KEY;
  delete process.env.AI_TOOLKIT_PROJECT_ID;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE 4: session-start.cjs - Execution Tests
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function testSessionStartBasic() {
  log.header('TEST 16: session-start.cjs - Basic Execution');

  // Test 1: Without config - should BLOCK (exit 2)
  try {
    const result = execSync(`node "${SESSION_START_PATH}"`, {
      encoding: 'utf-8',
      env: {
        ...process.env,
        AI_TOOLKIT_API_KEY: '',
        AI_TOOLKIT_PROJECT_ID: '',
      },
      timeout: 15000,
    });

    // Should NOT reach here - expect exit code 2
    recordResult(
      'Blocks when missing config (exit 2)',
      false,
      'Expected exit 2 but got exit 0'
    );

  } catch (error) {
    const exitCode = error.status;
    const stderr = error.stderr || '';

    recordResult(
      'Blocks when missing config (exit 2)',
      exitCode === 2
    );

    recordResult(
      'Shows SESSION BLOCKED message',
      stderr.includes('SESSION BLOCKED') || stderr.includes('Configuration Required')
    );

    recordResult(
      'Lists missing config vars',
      stderr.includes('AI_TOOLKIT_API_KEY') && stderr.includes('AI_TOOLKIT_PROJECT_ID')
    );
  }
}

function testSessionStartGracefulAPIError() {
  log.header('TEST 17: session-start.cjs - Graceful API Error Handling');

  try {
    const result = execSync(`node "${SESSION_START_PATH}"`, {
      encoding: 'utf-8',
      env: {
        ...process.env,
        AI_TOOLKIT_PLATFORM_URL: 'http://invalid-unreachable-host.local:9999',
        AI_TOOLKIT_API_KEY: 'sk_test_key',
        AI_TOOLKIT_PROJECT_ID: 'proj_test',
      },
      timeout: 15000,
    });

    recordResult(
      'Handles unreachable API gracefully',
      result.includes('offline mode') || result.includes('unreachable')
    );

  } catch (error) {
    // execSync throws on non-zero exit, but we still want to check output
    if (error.stdout && error.stdout.includes('offline mode')) {
      recordResult('Handles unreachable API gracefully', true);
    } else {
      recordResult('Handles unreachable API gracefully', false, error.message);
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE 5: settings.json Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function testSettingsJson() {
  log.header('TEST 18: settings.json - Structure Validation');

  const settingsPath = path.join(__dirname, '.claude', 'settings.json');

  try {
    const content = fs.readFileSync(settingsPath, 'utf-8');
    const json = JSON.parse(content);

    recordResult('Valid JSON syntax', true);
    recordResult('Has hooks config', !!json.hooks);
    recordResult('Has SessionStart hook', !!json.hooks?.SessionStart);
    recordResult('Has PreToolUse hook', !!json.hooks?.PreToolUse);

    // Validate SessionStart structure
    const sessionStart = json.hooks?.SessionStart?.[0];
    recordResult(
      'SessionStart hook has command',
      sessionStart?.hooks?.[0]?.type === 'command'
    );

    // Validate PreToolUse structure
    const preToolUse = json.hooks?.PreToolUse?.[0];
    recordResult(
      'PreToolUse has Write|Edit matcher',
      preToolUse?.matcher === 'Write|Edit'
    );
    recordResult(
      'PreToolUse hook has command',
      preToolUse?.hooks?.[0]?.type === 'command'
    );

  } catch (error) {
    recordResult('Valid JSON syntax', false, error.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST SUITE 6: Additional Edge Cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function testUtilsHasLocalDocs() {
  log.header('TEST 19: utils.cjs - hasLocalDocs() Function');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  const utils = require(UTILS_PATH);
  const testDir = __dirname;

  // Test: No .docs folder
  const docsDir = path.join(testDir, '.docs');
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }

  recordResult(
    'Returns false when no .docs folder',
    utils.hasLocalDocs(testDir) === false
  );

  // Test: .docs folder with .md files
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'test.md'), '# Test');

  clearRequireCache(UTILS_PATH);
  const utils2 = require(UTILS_PATH);

  recordResult(
    'Returns true when .docs has .md files',
    utils2.hasLocalDocs(testDir) === true
  );

  // Cleanup
  fs.rmSync(docsDir, { recursive: true, force: true });
}

function testUtilsGetLocalHash() {
  log.header('TEST 20: utils.cjs - getLocalHash() Function');

  cleanupTempFiles();
  clearRequireCache(UTILS_PATH);

  const utils = require(UTILS_PATH);
  const testDir = __dirname;
  const docsDir = path.join(testDir, '.docs');

  // Test: No .sync-hash file
  if (fs.existsSync(docsDir)) {
    fs.rmSync(docsDir, { recursive: true, force: true });
  }

  recordResult(
    'Returns null when no .sync-hash',
    utils.getLocalHash(testDir) === null
  );

  // Test: .sync-hash exists
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, '.sync-hash'), 'abc123hash');

  recordResult(
    'Returns hash when .sync-hash exists',
    utils.getLocalHash(testDir) === 'abc123hash'
  );

  // Cleanup
  fs.rmSync(docsDir, { recursive: true, force: true });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN TEST RUNNER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  console.log('');
  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.blue}   AI Toolkit Hooks - Deep Edge Case Test Suite${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);

  // Run all test suites
  testProtectDocsBlockScenarios();
  testProtectDocsAllowScenarios();
  testProtectDocsEdgeCases();
  testProtectDocsCaseSensitivity();

  testUtilsConfigDefaults();
  testUtilsConfigEnvVars();
  testUtilsConfigEnvFile();
  testUtilsConfigEnvFileFallback();
  testUtilsConfigPriority();
  testUtilsEnvFileWithComments();
  testUtilsEnvFileWithQuotes();
  testUtilsEnvFileWithEmptyValues();
  testUtilsEnvFileWithSpecialChars();
  testUtilsEnvFileMalformed();

  testUtilsValidateConfig();

  testSessionStartBasic();
  testSessionStartGracefulAPIError();

  testSettingsJson();

  testUtilsHasLocalDocs();
  testUtilsGetLocalHash();

  // Cleanup
  cleanupTempFiles();

  // Summary
  console.log('');
  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.blue}   Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);
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
        console.log(`   ${colors.red}✗${colors.reset} ${t.name}${t.details ? `: ${t.details}` : ''}`);
      });
    console.log('');
  }

  console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}`);
  console.log('');

  // Exit code based on results
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
