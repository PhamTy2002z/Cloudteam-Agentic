<#
.SYNOPSIS
    AI Toolkit Sync Platform - Claude Code Hooks Installer (Windows)

.DESCRIPTION
    Installs Claude Code hooks for AI Toolkit Sync Platform integration.

.PARAMETER TargetProject
    Target project directory. Defaults to current directory.

.EXAMPLE
    .\install.ps1
    .\install.ps1 -TargetProject "C:\Projects\MyApp"
#>

param(
    [string]$TargetProject = (Get-Location).Path
)

# Colors
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Green }
function Write-Warn { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Err { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Step { Write-Host "[STEP] $args" -ForegroundColor Cyan }

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HooksSource = Join-Path $ScriptDir ".claude"

# Target paths
$TargetClaude = Join-Path $TargetProject ".claude"
$TargetHooks = Join-Path $TargetClaude "hooks"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "   AI Toolkit Sync Platform - Hooks Installer" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""

# Validate source exists
if (-not (Test-Path $HooksSource)) {
    Write-Err "Source hooks not found: $HooksSource"
    exit 1
}

Write-Info "Source: $HooksSource"
Write-Info "Target: $TargetProject"
Write-Host ""

# Step 1: Create .claude directory structure
Write-Step "Creating .claude directory structure..."

if (-not (Test-Path $TargetHooks)) {
    New-Item -ItemType Directory -Path $TargetHooks -Force | Out-Null
}
Write-Info "  Created $TargetHooks"

# Step 2: Copy hooks files
Write-Step "Copying hook files..."

Copy-Item (Join-Path $HooksSource "hooks\utils.cjs") $TargetHooks -Force
Write-Info "  Copied utils.cjs"

Copy-Item (Join-Path $HooksSource "hooks\session-start.cjs") $TargetHooks -Force
Write-Info "  Copied session-start.cjs"

Copy-Item (Join-Path $HooksSource "hooks\protect-docs.cjs") $TargetHooks -Force
Write-Info "  Copied protect-docs.cjs"

# Step 3: Merge or copy settings.json
Write-Step "Configuring settings.json..."

$TargetSettings = Join-Path $TargetClaude "settings.json"
$SourceSettings = Join-Path $HooksSource "settings.json"

if (Test-Path $TargetSettings) {
    Write-Warn "  Existing settings.json found"
    Write-Warn "  Please manually merge hooks configuration from:"
    Write-Warn "  $SourceSettings"
    Copy-Item $SourceSettings (Join-Path $TargetClaude "settings.hooks.json") -Force
    Write-Info "  Copied to: settings.hooks.json"
} else {
    Copy-Item $SourceSettings $TargetSettings -Force
    Write-Info "  Created settings.json"
}

# Step 4: Create .docs directory
Write-Step "Creating .docs directory..."

$DocsDir = Join-Path $TargetProject ".docs"
if (-not (Test-Path $DocsDir)) {
    New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
}
Write-Info "  Created .docs/"

# Step 5: Update .gitignore
Write-Step "Updating .gitignore..."

$GitIgnore = Join-Path $TargetProject ".gitignore"
if (Test-Path $GitIgnore) {
    $content = Get-Content $GitIgnore -Raw
    if ($content -notmatch "\.docs/") {
        Add-Content $GitIgnore "`n# Platform-synced docs (read-only)`n.docs/"
        Write-Info "  Added .docs/ to .gitignore"
    } else {
        Write-Info "  .docs/ already in .gitignore"
    }
} else {
    Set-Content $GitIgnore "# Platform-synced docs (read-only)`n.docs/"
    Write-Info "  Created .gitignore with .docs/"
}

# Step 6: Create example .env
Write-Step "Creating example environment file..."

$EnvExample = Join-Path $TargetProject ".env.ai-toolkit.example"
@"
# AI Toolkit Sync Platform Configuration
# Copy this to .env or set as system environment variables

# Platform API URL
AI_TOOLKIT_PLATFORM_URL=http://localhost:3001

# Your API Key (get from: Project Settings > API Keys > Generate)
AI_TOOLKIT_API_KEY=sk_your_api_key_here

# Project ID (visible in project URL)
AI_TOOLKIT_PROJECT_ID=clxxx_your_project_id
"@ | Set-Content $EnvExample
Write-Info "  Created .env.ai-toolkit.example"

# Done
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "   ✅ Installation Complete!" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Info "Next steps:"
Write-Host ""
Write-Host "  1. Set environment variables (PowerShell):" -ForegroundColor White
Write-Host '     $env:AI_TOOLKIT_PLATFORM_URL = "http://localhost:3001"' -ForegroundColor Yellow
Write-Host '     $env:AI_TOOLKIT_API_KEY = "sk_your_api_key"' -ForegroundColor Yellow
Write-Host '     $env:AI_TOOLKIT_PROJECT_ID = "clxxx_project_id"' -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Update your CLAUDE.md to reference .docs/:" -ForegroundColor White
Write-Host "     ## Documentation" -ForegroundColor Yellow
Write-Host "     Read .docs/*.md before making code changes." -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Verify hooks with: /hooks command in Claude Code" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host ""
