# Code Standards - AI Toolkit Sync Platform

**Last Updated:** 2026-01-04
**Phase:** Phase 06 Complete
**Enforcement:** ESLint (backend), Next.js linter (frontend), Jest (E2E), Vitest (Components)

---

## Project Structure Standards

### Monorepo Organization
```
ai-toolkit-sync-platform/
├── apps/
│   ├── backend/          # NestJS application
│   └── frontend/         # Next.js application
├── docs/                 # Project documentation (Markdown)
├── plans/                # Development plans and reports
├── scripts/              # Shared utilities, hooks
└── [root config files]   # Shared configuration
```

**Rules:**
- Each app is independently deployable
- No cross-app imports (apps/backend → apps/frontend is FORBIDDEN)
- Shared code goes in `packages/` (future)
- Root config files (tsconfig.base.json) are shared, not overridden

---

## Backend Standards (NestJS)

### Directory Structure
```
apps/backend/src/
├── [feature]/           # Feature modules (projects, docs, locks, api-keys)
│   ├── dto/             # Data Transfer Objects
│   │   ├── create-[feature].dto.ts
│   │   ├── update-[feature].dto.ts
│   │   └── [feature]-response.dto.ts
│   ├── entities/        # TypeScript interfaces (optional, Prisma generates types)
│   ├── [feature].controller.ts
│   ├── [feature].service.ts
│   └── [feature].module.ts
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards
│   ├── interceptors/    # Logging, transform interceptors
│   ├── pipes/           # Validation pipes
│   └── middleware/      # Custom middleware
├── prisma/              # Database module (global)
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts        # Root module
└── main.ts              # Bootstrap
```

### Naming Conventions
- **Files:** kebab-case (e.g., `projects.controller.ts`)
- **Classes:** PascalCase (e.g., `ProjectsService`)
- **Interfaces:** PascalCase with `I` prefix (e.g., `IProjectRepository`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_LOCK_TIMEOUT`)
- **Variables/Functions:** camelCase (e.g., `getUserById`)

### Module Structure Pattern
```typescript
// projects.module.ts
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService], // Export if used by other modules
})
export class ProjectsModule {}
```

### Controller Standards
```typescript
// projects.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() createDto: CreateProjectDto) {
    return this.projectsService.create(createDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // CRITICAL: Always use async/await for database operations
  // CRITICAL: Never return Prisma models directly, use DTOs
}
```

**Rules:**
- All routes prefixed with `/api` (set in `main.ts`)
- Use HTTP status codes correctly (201 for creation, 204 for deletion)
- Return DTOs, not Prisma models (prevents leaking internal fields)
- Validate all input with `class-validator`

### Service Standards
```typescript
// projects.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProjectDto) {
    // CRITICAL: Encrypt sensitive fields before saving
    const encryptedToken = await this.encryptToken(createDto.token);

    return this.prisma.project.create({
      data: {
        ...createDto,
        token: encryptedToken,
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  // CRITICAL: Always handle errors explicitly
  // CRITICAL: Use transactions for multi-step operations
}
```

**Rules:**
- Inject PrismaService via constructor
- Throw NestJS exceptions (NotFoundException, BadRequestException)
- Use transactions for operations affecting multiple models
- Never expose passwords/tokens in responses

### DTO Standards
```typescript
// dto/create-project.dto.ts
import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsUrl()
  repoUrl: string;

  @IsString()
  token: string; // Will be encrypted in service

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  docsPath?: string;
}
```

**Rules:**
- Use `class-validator` decorators for all fields
- Use `@IsOptional()` for optional fields
- Use `PartialType` from `@nestjs/mapped-types` for update DTOs
- Add JSDoc comments for complex validation

### Error Handling
```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Rules:**
- Use global exception filters for consistency
- Log all errors with context (user ID, request ID)
- Never expose stack traces in production
- Return user-friendly error messages

### Database Standards (Prisma)
```typescript
// Always use parameterized queries (Prisma does this by default)
const user = await prisma.user.findUnique({
  where: { id: userId }, // ✅ Safe
});

// Use transactions for multi-step operations
await prisma.$transaction([
  prisma.project.update({ where: { id }, data: { name } }),
  prisma.doc.updateMany({ where: { projectId: id }, data: { updatedAt: new Date() } }),
]);

// Use indexes for frequently queried fields
// ✅ Good: @@index([projectId]) in schema.prisma
// ❌ Bad: Querying unindexed fields in loops
```

**Rules:**
- Always use Prisma migrations (never manual SQL)
- Add indexes for foreign keys and frequently filtered fields
- Use `@@unique` for compound unique constraints
- Enable query logging in development

---

## Frontend Standards (Next.js)

### Directory Structure
```
apps/frontend/
├── app/                 # App Router pages
│   ├── (auth)/          # Route groups
│   │   ├── login/
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── [id]/        # Dynamic routes
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # Reusable components
│   ├── ui/              # Base components (Button, Input)
│   └── features/        # Feature components (ProjectCard)
├── lib/                 # Utilities
│   ├── api.ts           # API client
│   └── utils.ts         # Shared functions
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
└── types/               # TypeScript types
```

### Naming Conventions
- **Components:** PascalCase (e.g., `ProjectCard.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useProjects.ts`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Stores:** camelCase with `Store` suffix (e.g., `projectStore.ts`)

### Component Standards
```typescript
// components/features/ProjectCard.tsx
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
}

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-xl font-bold">{project.name}</h3>
      <button onClick={() => onEdit(project.id)}>Edit</button>
    </div>
  );
}

// CRITICAL: Use TypeScript interfaces for all props
// CRITICAL: Avoid inline styles, use Tailwind classes
```

**Rules:**
- Use functional components (no class components)
- Extract props to interfaces
- Use `children` prop for composition
- Avoid `any` type, use `unknown` if type is unclear

### State Management (Zustand)
```typescript
// stores/projectStore.ts
import { create } from 'zustand';
import { Project } from '@/types';

interface ProjectStore {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
}));
```

**Rules:**
- One store per feature domain
- Use immer middleware for complex state updates
- Avoid storing derived data (calculate in selectors)
- Persist authentication state to localStorage

### API Client (TanStack Query)
```typescript
// lib/api.ts
import { useQuery, useMutation } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });
}

export function useCreateProject() {
  return useMutation({
    mutationFn: async (data: CreateProjectDto) => {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
  });
}
```

**Rules:**
- Use TanStack Query for all server state
- Define query keys as constants
- Handle loading/error states in components
- Invalidate queries after mutations

### Styling (Tailwind CSS)
```typescript
// ✅ Good: Utility classes
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click me
</button>

// ✅ Good: Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// ❌ Bad: Inline styles
<button style={{ backgroundColor: 'blue', color: 'white' }}>
  Click me
</button>
```

**Rules:**
- Always use Tailwind utility classes
- Use `@apply` in globals.css for repeated patterns
- Follow mobile-first responsive design
- Use CSS variables for theme colors

---

## TypeScript Standards

### Type Safety
```typescript
// ✅ Good: Explicit types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad: Implicit any
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good: Use unknown for uncertain types
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}

// ✅ Good: Type guards
function isProject(obj: unknown): obj is Project {
  return typeof obj === 'object' && obj !== null && 'name' in obj;
}
```

**Rules:**
- Enable `strict: true` in tsconfig.json
- Avoid `any` type (use `unknown` instead)
- Use type guards for runtime type checking
- Prefer `interface` over `type` for object shapes

### Prisma Types
```typescript
// ✅ Good: Use Prisma generated types
import { Project, Prisma } from '@prisma/client';

function createProject(data: Prisma.ProjectCreateInput): Promise<Project> {
  return prisma.project.create({ data });
}

// ❌ Bad: Manual type definitions
interface Project {
  id: string;
  name: string;
  // ... duplicating Prisma schema
}
```

**Rules:**
- Always use Prisma generated types
- Use `Prisma.[Model]CreateInput` for create DTOs
- Use `Prisma.[Model]UpdateInput` for update DTOs
- Use `Prisma.[Model]Include` for relations

---

## Testing Standards

### Unit Tests (Jest)
```typescript
// projects.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, PrismaService],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a project', async () => {
    const dto = { name: 'Test', repoUrl: 'https://github.com/test' };
    const result = await service.create(dto);
    expect(result).toHaveProperty('id');
  });
});
```

**Rules:**
- Test all service methods
- Mock PrismaService in unit tests
- Use descriptive test names (should/when format)
- Aim for 80%+ code coverage

---

## Security Standards

### Input Validation
```typescript
// ✅ Good: Validate all inputs
@Post()
async create(@Body() createDto: CreateProjectDto) {
  // class-validator automatically validates
  return this.projectsService.create(createDto);
}

// ✅ Good: Sanitize user input
import { IsString, MaxLength, Matches } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s-]+$/) // Prevent XSS
  name: string;
}
```

**Rules:**
- Validate all user input with class-validator
- Sanitize HTML to prevent XSS
- Use parameterized queries (Prisma handles this)
- Implement rate limiting (100 req/min)

### Authentication
```typescript
// guards/api-key.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) return false;

    // Validate API key against database
    const isValid = await this.validateApiKey(apiKey);
    return isValid;
  }
}
```

**Rules:**
- Use guards for authentication
- Store API keys hashed (bcrypt)
- Implement CORS with specific origins
- Use HTTPS in production

---

## Git Standards

### Commit Messages
```
feat: add project CRUD endpoints
fix: resolve lock expiration race condition
docs: update API documentation
refactor: extract encryption service
test: add unit tests for DocsService
```

**Format:** `<type>: <description>`
**Types:** feat, fix, docs, refactor, test, chore

### Branch Strategy
- `main` - production-ready code
- `develop` - integration branch
- `feature/[name]` - new features
- `fix/[name]` - bug fixes

**Rules:**
- Never commit directly to main
- Squash commits before merging
- Delete branches after merge

---

## Documentation Standards

### Code Comments
```typescript
/**
 * Encrypts a GitHub Personal Access Token using AES-256-GCM.
 *
 * @param token - The plaintext GitHub PAT
 * @returns The encrypted token (base64 encoded)
 * @throws Error if ENCRYPTION_KEY is not set
 */
async function encryptToken(token: string): Promise<string> {
  // Implementation
}
```

**Rules:**
- Use JSDoc for public APIs
- Explain "why" not "what"
- Document all thrown exceptions
- Update docs when changing code

---

## Performance Standards

### Backend
- API response time \<200ms (p95)
- Use database indexes for frequently queried fields
- Implement pagination for list endpoints (default 20 items)
- Use Redis caching for expensive queries

### Frontend
- Bundle size \<500KB gzipped
- Lighthouse score \>90
- Use `next/image` for optimized images
- Lazy load non-critical components

---

## Unresolved Questions

None at this time. Phase 02 will clarify encryption implementation details.
