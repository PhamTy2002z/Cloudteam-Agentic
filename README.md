# AI Toolkit Sync Platform

Centralized docs management for AI-assisted development teams.

## Problem

Multi-developer teams using AI coding assistants (Claude Code) produce inconsistent code due to:
- Different prompts → different code styles
- No centralized "source of truth" for AI context
- Docs can be accidentally modified

## Solution

Web platform that:
- Centralizes 6 docs files as source of truth
- Only Tech Lead can modify docs via Platform
- Auto-syncs to all dev workstations via `.docs/` folder
- Locks project when docs being updated
- Integrates with Claude Code via hooks

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Shadcn/ui + Monaco Editor
- **Backend:** NestJS + Prisma + PostgreSQL
- **Real-time:** WebSocket (NestJS Gateway)
- **Git Integration:** GitHub (Octokit)

## Project Structure

```
ai-toolkit-sync-platform/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # Next.js app
├── docs/                  # Project documentation
├── scripts/              # Claude Code hooks & utilities
└── package.json          # Monorepo config
```

## Development

```bash
# Install dependencies
npm install

# Start dev servers (backend + frontend)
npm run dev

# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## Documentation

See `./docs/` for:
- `project-overview-pdr.md` - Product requirements
- `code-standards.md` - Coding conventions
- `system-architecture.md` - Technical architecture
- `design-guidelines.md` - UI/UX standards
