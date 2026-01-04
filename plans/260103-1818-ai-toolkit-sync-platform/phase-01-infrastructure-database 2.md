# Phase 01: Infrastructure & Database

---
phase: 01
title: Infrastructure & Database
status: pending
effort: 4h
parallelization: Can run alone (first phase)
depends_on: []
blocks: [phase-02, phase-03]
---

## Overview

Set up monorepo structure, Prisma schema, PostgreSQL via Docker, and base configurations.

## File Ownership (Exclusive to This Phase)

```
/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── apps/
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── nest-cli.json
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── migrations/
    │   └── src/prisma/
    │       ├── prisma.service.ts
    │       └── prisma.module.ts
    └── frontend/
        ├── package.json
        └── tsconfig.json
```

## Implementation Steps

### Step 1: Initialize Monorepo (30m)

**1.1 Create root package.json**

```json
// package.json
{
  "name": "ai-toolkit-sync-platform",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "db:migrate": "pnpm --filter backend prisma migrate dev",
    "db:generate": "pnpm --filter backend prisma generate",
    "db:studio": "pnpm --filter backend prisma studio"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

**1.2 Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
```

**1.3 Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

### Step 2: Setup Docker PostgreSQL (30m)

**2.1 Create docker-compose.yml**

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    container_name: aitoolkit-db
    environment:
      POSTGRES_USER: aitoolkit
      POSTGRES_PASSWORD: aitoolkit_dev
      POSTGRES_DB: aitoolkit
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aitoolkit"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**2.2 Create .env.example**

```env
# Database
DATABASE_URL="postgresql://aitoolkit:aitoolkit_dev@localhost:5432/aitoolkit?schema=public"

# API
PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# GitHub (optional for dev)
GITHUB_TOKEN=ghp_xxx
```

### Step 3: Initialize Backend (NestJS) (45m)

**3.1 Create apps/backend/package.json**

```json
{
  "name": "backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "node dist/main",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/websockets": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.3.0",
    "@prisma/client": "^5.10.0",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "@octokit/rest": "^20.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@types/node": "^20.11.0",
    "prisma": "^5.10.0",
    "typescript": "^5.4.0"
  }
}
```

**3.2 Create apps/backend/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "./dist",
    "rootDir": "./src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**3.3 Create apps/backend/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

### Step 4: Create Prisma Schema (45m)

**4.1 Create apps/backend/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id        String   @id @default(cuid())
  name      String
  repoUrl   String
  token     String   // Encrypted GitHub PAT
  branch    String   @default("main")
  docsPath  String   @default("docs")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  docs    Doc[]
  locks   Lock[]
  apiKeys ApiKey[]
}

model Doc {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fileName  String
  content   String   @db.Text
  hash      String
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([projectId, fileName])
  @@index([projectId])
}

model Lock {
  id        String    @id @default(cuid())
  projectId String    @unique
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  lockedBy  String
  lockedAt  DateTime  @default(now())
  expiresAt DateTime?
  reason    String?

  @@index([projectId])
  @@index([expiresAt])
}

model ApiKey {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  key       String   @unique
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([projectId])
  @@index([key])
}
```

### Step 5: Create PrismaService (30m)

**5.1 Create apps/backend/src/prisma/prisma.service.ts**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'production') {
      // Use for testing - delete in reverse dependency order
      await this.apiKey.deleteMany();
      await this.lock.deleteMany();
      await this.doc.deleteMany();
      await this.project.deleteMany();
    }
  }
}
```

**5.2 Create apps/backend/src/prisma/prisma.module.ts**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Step 6: Initialize Frontend (Next.js) (30m)

**6.1 Create apps/frontend/package.json**

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.0",
    "@monaco-editor/react": "^4.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.0"
  }
}
```

**6.2 Create apps/frontend/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    },
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 7: Update .gitignore (15m)

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Prisma
apps/backend/prisma/migrations/*_migration.sql

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Testing
coverage/
.nyc_output/
```

---

## Verification Steps

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client
pnpm db:generate

# 4. Run initial migration
pnpm db:migrate --name init

# 5. Verify database connection
pnpm db:studio
```

## Success Criteria

- [ ] `docker-compose up -d` starts PostgreSQL successfully
- [ ] `pnpm install` completes without errors
- [ ] `pnpm db:generate` creates Prisma client
- [ ] `pnpm db:migrate --name init` creates tables
- [ ] `pnpm db:studio` opens Prisma Studio at localhost:5555

## Handoff to Next Phases

**Phase 02 can start when:**
- PrismaService is available for injection
- Database schema is migrated

**Phase 03 can start when:**
- Frontend package.json dependencies are installed
- TypeScript configuration is complete

---

## Conflict Prevention

This phase owns ALL infrastructure files. Other phases must NOT modify:
- Root `package.json`, `tsconfig.base.json`
- `docker-compose.yml`
- `prisma/schema.prisma` (schema changes require Phase 01 update)
- `prisma.service.ts`, `prisma.module.ts`
