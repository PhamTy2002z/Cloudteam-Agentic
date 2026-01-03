# Phase 02: Backend Core Services

---
phase: 02
title: Backend Core Services
status: done
effort: 8h (actual: 10h including security fixes)
parallelization: Can run in PARALLEL with Phase 03
depends_on: [phase-01]
blocks: [phase-05, phase-06]
review_date: 2026-01-03
completion_date: 2026-01-03
review_report: plans/reports/code-reviewer-260103-2013-phase02-backend-review.md
critical_issues_fixed: 5
high_priority_issues_fixed: 4
---

## Overview

Implement NestJS controllers, services, and modules for Projects, Docs, Lock, and GitHub integration.

## File Ownership (Exclusive to This Phase)

```
apps/backend/src/
├── main.ts
├── app.module.ts
├── projects/
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   ├── projects.module.ts
│   └── dto/
│       ├── create-project.dto.ts
│       ├── update-project.dto.ts
│       └── project-response.dto.ts
├── docs/
│   ├── docs.controller.ts
│   ├── docs.service.ts
│   ├── docs.module.ts
│   └── dto/
│       ├── update-doc.dto.ts
│       └── sync-docs.dto.ts
├── lock/
│   ├── lock.controller.ts
│   ├── lock.service.ts
│   └── lock.module.ts
├── github/
│   ├── github.service.ts
│   └── github.module.ts
└── common/
    ├── guards/
    │   └── api-key.guard.ts
    ├── filters/
    │   └── global-exception.filter.ts
    └── decorators/
        └── api-key.decorator.ts
```

## Implementation Steps

### Step 1: Application Bootstrap (30m)

**1.1 Create apps/backend/src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}

bootstrap();
```

**1.2 Create apps/backend/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { DocsModule } from './docs/docs.module';
import { LockModule } from './lock/lock.module';
import { GitHubModule } from './github/github.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    DocsModule,
    LockModule,
    GitHubModule,
  ],
})
export class AppModule {}
```

### Step 2: Common Utilities (45m)

**2.1 Create apps/backend/src/common/filters/global-exception.filter.ts**

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

**2.2 Create apps/backend/src/common/guards/api-key.guard.ts**

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const key = await this.prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { project: true },
    });

    if (!key || !key.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Attach project to request for use in controllers
    request.project = key.project;
    return true;
  }
}
```

**2.3 Create apps/backend/src/common/decorators/api-key.decorator.ts**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Project } from '@prisma/client';

export const CurrentProject = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Project => {
    const request = ctx.switchToHttp().getRequest();
    return request.project;
  },
);
```

### Step 3: Projects Module (1.5h)

**3.1 Create apps/backend/src/projects/dto/create-project.dto.ts**

```typescript
import { IsString, IsNotEmpty, MaxLength, IsUrl, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value.trim())
  name: string;

  @IsUrl()
  @IsNotEmpty()
  repoUrl: string;

  @IsString()
  @IsNotEmpty()
  token: string; // GitHub PAT

  @IsString()
  @IsOptional()
  branch?: string = 'main';

  @IsString()
  @IsOptional()
  docsPath?: string = 'docs';
}
```

**3.2 Create apps/backend/src/projects/dto/update-project.dto.ts**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

**3.3 Create apps/backend/src/projects/projects.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        repoUrl: dto.repoUrl,
        token: dto.token, // TODO: encrypt in production
        branch: dto.branch || 'main',
        docsPath: dto.docsPath || 'docs',
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        locks: true,
        _count: { select: { docs: true, apiKeys: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        docs: true,
        locks: true,
        apiKeys: { where: { isActive: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id); // Verify exists
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists
    return this.prisma.project.delete({ where: { id } });
  }

  async generateApiKey(projectId: string, name: string) {
    await this.findOne(projectId);

    const key = `sk_${randomBytes(32).toString('hex')}`;

    return this.prisma.apiKey.create({
      data: {
        projectId,
        key,
        name,
      },
    });
  }

  async revokeApiKey(keyId: string) {
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }
}
```

**3.4 Create apps/backend/src/projects/projects.controller.ts**

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/api-keys')
  generateApiKey(
    @Param('id') projectId: string,
    @Body('name') name: string,
  ) {
    return this.projectsService.generateApiKey(projectId, name);
  }

  @Delete('api-keys/:keyId')
  revokeApiKey(@Param('keyId') keyId: string) {
    return this.projectsService.revokeApiKey(keyId);
  }
}
```

**3.5 Create apps/backend/src/projects/projects.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

### Step 4: GitHub Service (1h)

**4.1 Create apps/backend/src/github/github.service.ts**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { createHash } from 'crypto';

export interface DocFile {
  fileName: string;
  content: string;
  sha?: string | null;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger('GitHubService');

  private createClient(token: string): Octokit {
    return new Octokit({ auth: token });
  }

  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }
    return { owner: match[1], repo: match[2] };
  }

  async getDocFile(
    token: string,
    repoUrl: string,
    docsPath: string,
    fileName: string,
    branch = 'main',
  ): Promise<DocFile> {
    const octokit = this.createClient(token);
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const path = `${docsPath}/${fileName}`;

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error(`${path} is not a file`);
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        fileName,
        content,
        sha: data.sha,
      };
    } catch (error) {
      this.logger.error(`Failed to get ${path}: ${error.message}`);
      throw error;
    }
  }

  async getAllDocs(
    token: string,
    repoUrl: string,
    docsPath: string,
    branch = 'main',
  ): Promise<DocFile[]> {
    const octokit = this.createClient(token);
    const { owner, repo } = this.parseRepoUrl(repoUrl);

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: docsPath,
        ref: branch,
      });

      if (!Array.isArray(data)) {
        throw new Error(`${docsPath} is not a directory`);
      }

      const mdFiles = data.filter(
        (item) => item.type === 'file' && item.name.endsWith('.md'),
      );

      const docs: DocFile[] = [];
      for (const file of mdFiles) {
        const doc = await this.getDocFile(
          token,
          repoUrl,
          docsPath,
          file.name,
          branch,
        );
        docs.push(doc);
      }

      return docs;
    } catch (error) {
      this.logger.error(`Failed to list ${docsPath}: ${error.message}`);
      throw error;
    }
  }

  async pushDoc(
    token: string,
    repoUrl: string,
    docsPath: string,
    fileName: string,
    content: string,
    message: string,
    branch = 'main',
    sha?: string,
  ): Promise<void> {
    const octokit = this.createClient(token);
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const path = `${docsPath}/${fileName}`;

    // Get current SHA if not provided
    let currentSha = sha;
    if (!currentSha) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });
        if (!Array.isArray(data)) {
          currentSha = data.sha;
        }
      } catch {
        // File doesn't exist, that's fine for new files
      }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha: currentSha,
    });

    this.logger.log(`Pushed ${path} to ${owner}/${repo}`);
  }

  computeHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }
}
```

**4.2 Create apps/backend/src/github/github.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { GitHubService } from './github.service';

@Module({
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
```

### Step 5: Docs Module (1.5h)

**5.1 Create apps/backend/src/docs/dto/update-doc.dto.ts**

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateDocDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
```

**5.2 Create apps/backend/src/docs/docs.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubService } from '../github/github.service';
import { UpdateDocDto } from './dto/update-doc.dto';

@Injectable()
export class DocsService {
  constructor(
    private prisma: PrismaService,
    private github: GitHubService,
  ) {}

  async findAllByProject(projectId: string) {
    return this.prisma.doc.findMany({
      where: { projectId },
      orderBy: { fileName: 'asc' },
    });
  }

  async findOne(projectId: string, fileName: string) {
    const doc = await this.prisma.doc.findUnique({
      where: {
        projectId_fileName: { projectId, fileName },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Doc ${fileName} not found`);
    }

    return doc;
  }

  async update(projectId: string, fileName: string, dto: UpdateDocDto) {
    const hash = this.github.computeHash(dto.content);

    return this.prisma.doc.upsert({
      where: {
        projectId_fileName: { projectId, fileName },
      },
      update: {
        content: dto.content,
        hash,
        version: { increment: 1 },
      },
      create: {
        projectId,
        fileName,
        content: dto.content,
        hash,
      },
    });
  }

  async syncFromGitHub(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const remoteDocs = await this.github.getAllDocs(
      project.token,
      project.repoUrl,
      project.docsPath,
      project.branch,
    );

    const results = [];
    for (const doc of remoteDocs) {
      const hash = this.github.computeHash(doc.content);
      const result = await this.prisma.doc.upsert({
        where: {
          projectId_fileName: { projectId, fileName: doc.fileName },
        },
        update: {
          content: doc.content,
          hash,
        },
        create: {
          projectId,
          fileName: doc.fileName,
          content: doc.content,
          hash,
        },
      });
      results.push(result);
    }

    return results;
  }

  async pushToGitHub(projectId: string, fileName: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const doc = await this.findOne(projectId, fileName);

    await this.github.pushDoc(
      project.token,
      project.repoUrl,
      project.docsPath,
      fileName,
      doc.content,
      `Update ${fileName} via AI Toolkit Platform`,
      project.branch,
    );

    return { success: true };
  }

  async getDocsHash(projectId: string): Promise<string> {
    const docs = await this.findAllByProject(projectId);
    const combinedHash = docs.map((d) => d.hash).sort().join('');
    return this.github.computeHash(combinedHash);
  }
}
```

**5.3 Create apps/backend/src/docs/docs.controller.ts**

```typescript
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { DocsService } from './docs.service';
import { UpdateDocDto } from './dto/update-doc.dto';

@Controller('projects/:projectId/docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.docsService.findAllByProject(projectId);
  }

  @Get(':fileName')
  findOne(
    @Param('projectId') projectId: string,
    @Param('fileName') fileName: string,
  ) {
    return this.docsService.findOne(projectId, fileName);
  }

  @Put(':fileName')
  update(
    @Param('projectId') projectId: string,
    @Param('fileName') fileName: string,
    @Body() dto: UpdateDocDto,
  ) {
    return this.docsService.update(projectId, fileName, dto);
  }

  @Post('sync')
  syncFromGitHub(@Param('projectId') projectId: string) {
    return this.docsService.syncFromGitHub(projectId);
  }

  @Post(':fileName/push')
  pushToGitHub(
    @Param('projectId') projectId: string,
    @Param('fileName') fileName: string,
  ) {
    return this.docsService.pushToGitHub(projectId, fileName);
  }
}
```

**5.4 Create apps/backend/src/docs/docs.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { GitHubModule } from '../github/github.module';

@Module({
  imports: [GitHubModule],
  controllers: [DocsController],
  providers: [DocsService],
  exports: [DocsService],
})
export class DocsModule {}
```

### Step 6: Lock Module (1h)

**6.1 Create apps/backend/src/lock/lock.service.ts**

```typescript
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LOCK_TTL_MINUTES = 30;

@Injectable()
export class LockService {
  constructor(private prisma: PrismaService) {}

  async getLock(projectId: string) {
    const lock = await this.prisma.lock.findUnique({
      where: { projectId },
    });

    // Check if lock has expired
    if (lock?.expiresAt && lock.expiresAt < new Date()) {
      await this.releaseLock(projectId);
      return null;
    }

    return lock;
  }

  async acquireLock(projectId: string, lockedBy: string, reason?: string) {
    // Check for existing lock
    const existingLock = await this.getLock(projectId);
    if (existingLock) {
      throw new ConflictException({
        message: 'Project is already locked',
        lockedBy: existingLock.lockedBy,
        lockedAt: existingLock.lockedAt,
      });
    }

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // Create lock with TTL
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + DEFAULT_LOCK_TTL_MINUTES);

    return this.prisma.lock.create({
      data: {
        projectId,
        lockedBy,
        reason,
        expiresAt,
      },
    });
  }

  async releaseLock(projectId: string) {
    const lock = await this.prisma.lock.findUnique({
      where: { projectId },
    });

    if (!lock) {
      return { released: false, message: 'No lock exists' };
    }

    await this.prisma.lock.delete({
      where: { projectId },
    });

    return { released: true };
  }

  async extendLock(projectId: string, minutes = DEFAULT_LOCK_TTL_MINUTES) {
    const lock = await this.getLock(projectId);
    if (!lock) {
      throw new NotFoundException('No active lock found');
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);

    return this.prisma.lock.update({
      where: { projectId },
      data: { expiresAt },
    });
  }

  async isLocked(projectId: string): Promise<boolean> {
    const lock = await this.getLock(projectId);
    return lock !== null;
  }
}
```

**6.2 Create apps/backend/src/lock/lock.controller.ts**

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { LockService } from './lock.service';

@Controller('projects/:projectId/lock')
export class LockController {
  constructor(private readonly lockService: LockService) {}

  @Get()
  getLock(@Param('projectId') projectId: string) {
    return this.lockService.getLock(projectId);
  }

  @Post()
  acquireLock(
    @Param('projectId') projectId: string,
    @Body('lockedBy') lockedBy: string,
    @Body('reason') reason?: string,
  ) {
    return this.lockService.acquireLock(projectId, lockedBy, reason);
  }

  @Delete()
  releaseLock(@Param('projectId') projectId: string) {
    return this.lockService.releaseLock(projectId);
  }

  @Post('extend')
  extendLock(
    @Param('projectId') projectId: string,
    @Body('minutes') minutes?: number,
  ) {
    return this.lockService.extendLock(projectId, minutes);
  }
}
```

**6.3 Create apps/backend/src/lock/lock.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { LockController } from './lock.controller';
import { LockService } from './lock.service';

@Module({
  controllers: [LockController],
  providers: [LockService],
  exports: [LockService],
})
export class LockModule {}
```

---

## Verification Steps

```bash
# Start database
docker-compose up -d

# Start backend in dev mode
cd apps/backend && pnpm dev

# Test endpoints
curl http://localhost:3001/api/projects
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","repoUrl":"https://github.com/test/repo","token":"ghp_xxx"}'
```

## Success Criteria

**Implementation Status:**
- [x] `pnpm dev` starts NestJS without errors
- [x] `GET /api/projects` returns empty array
- [x] `POST /api/projects` creates project
- [x] `POST /api/projects/:id/lock` acquires lock
- [x] `DELETE /api/projects/:id/lock` releases lock
- [x] `POST /api/projects/:id/api-keys` generates API key
- [x] GlobalExceptionFilter handles errors properly
- [x] 83 tests passing across 7 test suites
- [x] TypeScript compilation successful
- [x] Build process successful

**Critical Security Fixes Applied:**
- [x] GitHub token encryption (AES-256-GCM) via CryptoService
- [x] SHA-256 content hashing (replaced MD5)
- [x] Lock acquisition race condition fixed (Prisma Serializable transaction)
- [x] Input validation DTOs for lock endpoints
- [x] Token exposure prevented in API responses
- [x] API key hashing with bcrypt
- [x] Rate limiting (100 req/min) with @nestjs/throttler
- [x] Parallel GitHub API calls in getAllDocs()
- [x] Transaction wrapper for document sync

**Review Summary:**
- Build: ✅ PASSING
- Tests: ✅ 83/83 passing
- Security: ✅ ALL CRITICAL ISSUES RESOLVED
- Quality: ✅ PRODUCTION-READY
- Full report: plans/reports/code-reviewer-260103-2013-phase02-backend-review.md

## Handoff to Phase 05

**Phase 05 depends on:**
- LockService exported for WebSocket gateway ✅
- DocsService exported for hook API ✅
- ApiKeyGuard ready for hook authentication ✅ (with bcrypt hashing)
- CryptoService for token encryption/decryption ✅

**Status:** ✅ READY FOR PHASE 05

---

## Conflict Prevention

This phase owns ALL backend service files. Phase 05 will add:
- `websocket/` module (new directory)
- `hook/` module (new directory)

Phase 02 must NOT touch those directories.
