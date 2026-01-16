/**
 * Shared utilities for AI Toolkit Sync Platform hooks
 *
 * Configuration Priority (highest to lowest):
 * 1. Environment variables (AI_TOOLKIT_*)
 * 2. Project .env file (.env.ai-toolkit or .env)
 * 3. Default values
 *
 * Environment Variables:
 * - AI_TOOLKIT_PLATFORM_URL: Platform API URL (default: http://localhost:3001)
 * - AI_TOOLKIT_API_KEY: API key for authentication
 * - AI_TOOLKIT_PROJECT_ID: Project ID to sync
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Load .env file and return parsed key-value pairs
 * Does NOT override existing process.env values
 * @param {string} envPath - Path to .env file
 * @returns {object} - Parsed env vars
 */
function loadEnvFile(envPath) {
  const result = {};
  if (!fs.existsSync(envPath)) return result;

  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }
  } catch (e) {
    // Ignore errors reading .env file
  }

  return result;
}

/**
 * Get project root directory
 * Uses CLAUDE_PROJECT_DIR env var or walks up from current dir
 * @returns {string} - Project root path
 */
function getProjectRoot() {
  // Claude Code sets this env var
  if (process.env.CLAUDE_PROJECT_DIR) {
    return process.env.CLAUDE_PROJECT_DIR;
  }

  // Fallback: walk up looking for .claude folder
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, '.claude'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  return process.cwd();
}

// Load project-specific .env files
const PROJECT_ROOT = getProjectRoot();
const envFiles = [
  path.join(PROJECT_ROOT, '.env.ai-toolkit'),  // Project-specific AI Toolkit config
  path.join(PROJECT_ROOT, '.env'),              // General .env fallback
];

// Load env files (later files have lower priority)
const projectEnv = {};
for (const envFile of envFiles.reverse()) {
  Object.assign(projectEnv, loadEnvFile(envFile));
}

// Configuration with priority: process.env > .env file > defaults
const CONFIG = {
  platformUrl: process.env.AI_TOOLKIT_PLATFORM_URL || projectEnv.AI_TOOLKIT_PLATFORM_URL || 'http://localhost:3001',
  apiKey: process.env.AI_TOOLKIT_API_KEY || projectEnv.AI_TOOLKIT_API_KEY || '',
  projectId: process.env.AI_TOOLKIT_PROJECT_ID || projectEnv.AI_TOOLKIT_PROJECT_ID || '',
  projectRoot: PROJECT_ROOT,
  timeout: 10000, // 10 seconds
  maxRetries: 3,
};

/**
 * Make HTTP request to Platform API
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method
 * @returns {Promise<object>} - Parsed JSON response
 */
async function apiCall(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(`/api/hook/${endpoint}`, CONFIG.platformUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: method,
      timeout: CONFIG.timeout,
      headers: {
        'X-API-Key': CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`API error: ${res.statusCode} - ${data}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Check if project is locked
 * @returns {Promise<{locked: boolean, lockedBy?: string, lockedAt?: string}>}
 */
async function checkLockStatus() {
  try {
    const response = await apiCall(`status/${CONFIG.projectId}`);
    return response;
  } catch (error) {
    // If API fails, assume unlocked (offline mode)
    return { locked: false, offline: true, error: error.message };
  }
}

/**
 * Get docs hash from Platform
 * @returns {Promise<{hash: string, docsCount: number}>}
 */
async function getDocsHash() {
  try {
    const response = await apiCall(`docs/${CONFIG.projectId}`);
    return response;
  } catch (error) {
    return { hash: null, error: error.message };
  }
}

/**
 * Sync docs from Platform to local .docs/ folder
 * @param {string} projectDir - Project root directory
 * @returns {Promise<{success: boolean, syncedFiles: string[], hash: string}>}
 */
async function syncDocs(projectDir) {
  try {
    const response = await apiCall(`sync/${CONFIG.projectId}`, 'POST');
    const docsDir = path.join(projectDir, '.docs');

    // Create .docs/ if not exists
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const syncedFiles = [];

    // Write each doc file
    for (const doc of response.docs) {
      const filePath = path.join(docsDir, doc.fileName);
      fs.writeFileSync(filePath, doc.content, 'utf-8');
      syncedFiles.push(doc.fileName);
    }

    // Save hash for quick comparison
    fs.writeFileSync(path.join(docsDir, '.sync-hash'), response.hash, 'utf-8');

    return { success: true, syncedFiles, hash: response.hash };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get local docs hash from .docs/.sync-hash
 * @param {string} projectDir - Project root directory
 * @returns {string|null}
 */
function getLocalHash(projectDir) {
  try {
    const hashFile = path.join(projectDir, '.docs', '.sync-hash');
    if (fs.existsSync(hashFile)) {
      return fs.readFileSync(hashFile, 'utf-8').trim();
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

/**
 * Check if .docs/ folder exists and has files
 * @param {string} projectDir - Project root directory
 * @returns {boolean}
 */
function hasLocalDocs(projectDir) {
  try {
    const docsDir = path.join(projectDir, '.docs');
    if (!fs.existsSync(docsDir)) return false;

    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
    return files.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Validate required configuration
 * @returns {{valid: boolean, missing: string[]}}
 */
function validateConfig() {
  const missing = [];

  if (!CONFIG.apiKey) missing.push('AI_TOOLKIT_API_KEY');
  if (!CONFIG.projectId) missing.push('AI_TOOLKIT_PROJECT_ID');

  return {
    valid: missing.length === 0,
    missing,
  };
}

module.exports = {
  CONFIG,
  apiCall,
  checkLockStatus,
  getDocsHash,
  syncDocs,
  getLocalHash,
  hasLocalDocs,
  validateConfig,
};
