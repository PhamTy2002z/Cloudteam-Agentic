# Code Standards & Development Guidelines

## NestJS Architecture Patterns

### Module Organization

**Structure Pattern**:
```
module-name/
├── dto/                    # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── *-response.dto.ts
├── *.controller.ts         # HTTP request handlers
├── *.service.ts            # Business logic
├── *.module.ts             # Module definition
├── *.controller.spec.ts    # Controller tests
└── *.service.spec.ts       # Service tests
```

**Module Example**:
```typescript
@Module({
  imports: [DependencyModule],  // External modules
  controllers: [Controller],     // HTTP layer
  providers: [Service],          // Business logic
  exports: [Service],            // Exposed for other modules
})
export class FeatureModule {}
```

### Dependency Injection

**Service Declaration**:
```typescript
@Injectable()
export class ExampleService {
  constructor(
    private prisma: PrismaService,      // Database access
    private crypto: CryptoService,       // Utilities
    private config: ConfigService,       // Environment
  ) {}
}
```

**Best Practices**:
- Use constructor injection
- Inject services, NOT repositories directly
- Keep constructors minimal (only DI)
- Use `private readonly` cho immutable dependencies

### Controller Patterns

**REST Controller Example**:
```typescript
@Controller('resource')
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  @Post()
  create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

**HTTP Method Mapping**:
- `@Get()` - Read operations
- `@Post()` - Create operations
- `@Put()` / `@Patch()` - Update operations
- `@Delete()` - Delete operations

**Parameter Decorators**:
- `@Body()` - Request body
- `@Param()` - URL parameters
- `@Query()` - Query strings
- `@Headers()` - HTTP headers
- Custom decorators: `@CurrentProject()`

## TypeScript Conventions

### Type Safety

**Strict Mode** (enabled):
```json
{
  "strict": true,
  "strictNullChecks": true,
  "strictPropertyInitialization": true,
  "noImplicitAny": true,
  "noImplicitReturns": true
}
```

**Type Annotations**:
```typescript
// Explicit return types
async findOne(id: string): Promise<Project> {
  const project = await this.prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new NotFoundException(`Project ${id} not found`);
  }
  return project;
}

// Interface definitions
interface DocFile {
  fileName: string;
  content: string;
  sha?: string | null;
}

// Type guards
if (exception instanceof HttpException) {
  return exception.getStatus();
}
```

### Naming Conventions

**Files**:
- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Modules: `*.module.ts`
- DTOs: `*.dto.ts`
- Tests: `*.spec.ts`
- Interfaces: `*.interface.ts`

**Classes & Interfaces**:
- PascalCase: `ProjectsService`, `CreateProjectDto`
- Suffix với type: `Controller`, `Service`, `Module`, `Dto`

**Variables & Methods**:
- camelCase: `projectId`, `findOne()`, `getAllDocs()`
- Private members: `private readonly logger`
- Constants: `UPPER_SNAKE_CASE` (`DEFAULT_LOCK_TTL_MINUTES`)

**Database Models**:
- PascalCase: `Project`, `Doc`, `Lock`, `ApiKey`
- Fields: camelCase (`createdAt`, `lockedBy`)

## DTO (Data Transfer Objects)

### Validation Decorators

**Required Fields**:
```typescript
import { IsString, IsNotEmpty, IsUrl, MaxLength } from 'class-validator';
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
  token: string;
}
```

**Optional Fields**:
```typescript
export class AcquireLockDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lockedBy!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  reason?: string;
}
```

**Update DTOs** (PartialType):
```typescript
import { PartialType } from '@nestjs/mapped-types';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
// All fields become optional automatically
```

### Validation Rules

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@IsString()` | String type check | `name: string` |
| `@IsNotEmpty()` | Không được empty | `token: string` |
| `@IsOptional()` | Optional field | `reason?: string` |
| `@IsUrl()` | Valid URL format | `repoUrl: string` |
| `@MaxLength(n)` | Max string length | `@MaxLength(100)` |
| `@Min(n)` / `@Max(n)` | Number range | `@Min(1)` |
| `@IsInt()` | Integer check | `version: number` |
| `@Transform()` | Value transformation | `value.trim()` |

## Error Handling

### Exception Types

**Built-in Exceptions**:
```typescript
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

// Usage examples
throw new NotFoundException(`Project ${id} not found`);
throw new ConflictException('Project is already locked');
throw new UnauthorizedException('Invalid API key');
```

**Custom Exception Responses**:
```typescript
throw new ConflictException({
  message: 'Project is already locked',
  lockedBy: existingLock.lockedBy,
  lockedAt: existingLock.lockedAt,
});
```

### Global Exception Filter

**Filter Pattern**:
```typescript
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

### Error Response Format

**Standard Response**:
```json
{
  "statusCode": 404,
  "timestamp": "2026-01-03T10:30:00.000Z",
  "path": "/api/projects/invalid-id",
  "message": "Project invalid-id not found"
}
```

## Database Patterns (Prisma)

### Schema Conventions

**Model Definition**:
```prisma
model Project {
  id        String   @id @default(cuid())
  name      String
  repoUrl   String
  token     String   // Encrypted
  branch    String   @default("main")
  docsPath  String   @default("docs")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  docs    Doc[]
  locks   Lock[]
  apiKeys ApiKey[]
}
```

**Indexing Strategy**:
```prisma
model Doc {
  // Fields...

  @@unique([projectId, fileName])
  @@index([projectId])
}

model ApiKey {
  // Fields...

  @@index([projectId])
  @@index([key])
}
```

### Query Patterns

**Find with Relations**:
```typescript
const project = await this.prisma.project.findUnique({
  where: { id },
  include: {
    docs: true,
    locks: true,
    apiKeys: { where: { isActive: true } },
  },
});
```

**Find with Aggregations**:
```typescript
const projects = await this.prisma.project.findMany({
  include: {
    locks: true,
    _count: { select: { docs: true, apiKeys: true } },
  },
  orderBy: { updatedAt: 'desc' },
});
```

**Upsert Pattern** (insert or update):
```typescript
const doc = await this.prisma.doc.upsert({
  where: {
    projectId_fileName: { projectId, fileName },
  },
  update: {
    content,
    hash,
    version: { increment: 1 },
  },
  create: {
    projectId,
    fileName,
    content,
    hash,
  },
});
```

**Transaction Pattern**:
```typescript
return this.prisma.$transaction(
  async (tx) => {
    const existing = await tx.lock.findUnique({ where: { projectId } });
    if (existing) throw new ConflictException();

    return tx.lock.create({ data: { projectId, lockedBy } });
  },
  {
    isolationLevel: 'Serializable',
    timeout: 5000,
  }
);
```

### Cascading Deletes

```prisma
model Doc {
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  // When project deleted, all docs auto-deleted
}
```

## Security Patterns

### Encryption Service

**AES-256-GCM Pattern**:
```typescript
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const secret = this.config.get<string>('ENCRYPTION_KEY');
    if (!secret || secret.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
    this.key = createHash('sha256').update(secret).digest();
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Content Hashing

**SHA-256 Pattern**:
```typescript
computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
```

### API Key Guard

**Authentication Guard**:
```typescript
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

    request.project = key.project;
    return true;
  }
}
```

**Custom Decorator**:
```typescript
export const CurrentProject = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Project => {
    const request = ctx.switchToHttp().getRequest();
    return request.project;
  },
);
```

**Usage**:
```typescript
@UseGuards(ApiKeyGuard)
@Get()
async protectedRoute(@CurrentProject() project: Project) {
  // project auto-injected from guard
}
```

## Testing Patterns

### Unit Testing

**Service Test Structure**:
```typescript
describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CryptoService, useValue: mockCryptoService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should create a project', async () => {
    const dto: CreateProjectDto = { /* ... */ };
    mockPrismaService.project.create.mockResolvedValue(mockProject);

    const result = await service.create(dto);

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: dto.name }),
    });
    expect(result.id).toBeDefined();
  });
});
```

**Controller Test Pattern**:
```typescript
describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);

    jest.clearAllMocks();
  });

  it('should return all projects', async () => {
    mockProjectsService.findAll.mockResolvedValue([mockProject]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });
});
```

### Test Coverage Goals

- **Unit Tests**: > 80% line coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: User flows tested

### Mocking Strategies

**Mock Prisma**:
```typescript
const mockPrismaService = {
  project: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};
```

**Mock External Services**:
```typescript
const mockCryptoService = {
  encrypt: jest.fn().mockReturnValue('encrypted_value'),
  decrypt: jest.fn().mockReturnValue('plain_value'),
};
```

## Logging Standards

### Logger Usage

**NestJS Logger**:
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class ExampleService {
  private readonly logger = new Logger('ExampleService');

  async doSomething() {
    this.logger.log('Operation started');
    this.logger.warn('Potential issue detected');
    this.logger.error('Error occurred', stackTrace);
    this.logger.debug('Debug info', context);
  }
}
```

**Log Levels**:
- `log()` - General information
- `warn()` - Warnings, potential issues
- `error()` - Errors with stack traces
- `debug()` - Development debugging
- `verbose()` - Detailed operational info

### Sensitive Data Protection

**DO NOT LOG**:
- GitHub tokens (encrypted or plain)
- API keys
- Passwords
- Encryption keys
- Personal identifiable information (PII)

**Safe Logging**:
```typescript
this.logger.log(`Processing project ${projectId}`);
this.logger.error(`Failed to sync docs for project ${projectId}`);
```

## Configuration Management

### Environment Variables

**Required Variables**:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
ENCRYPTION_KEY="min-32-characters-secret-key"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

**ConfigService Usage**:
```typescript
@Injectable()
export class ExampleService {
  constructor(private config: ConfigService) {}

  getConfig() {
    const key = this.config.get<string>('ENCRYPTION_KEY');
    const port = this.config.get<number>('PORT', 3001); // default
  }
}
```

**Validation**:
```typescript
if (!secret || secret.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters');
}
```

## Performance Best Practices

### Database Optimization

**Use Indexes**:
```prisma
@@index([projectId])
@@index([key])
@@index([expiresAt])
```

**Select Specific Fields**:
```typescript
const projects = await this.prisma.project.findMany({
  select: { id: true, name: true },  // Only needed fields
});
```

**Avoid N+1 Queries**:
```typescript
// ❌ Bad (N+1 problem)
for (const project of projects) {
  const docs = await this.prisma.doc.findMany({ where: { projectId: project.id } });
}

// ✅ Good (single query with include)
const projects = await this.prisma.project.findMany({
  include: { docs: true },
});
```

### Async/Await Patterns

**Parallel Operations**:
```typescript
// Sequential (slow)
const project = await this.getProject(id);
const docs = await this.getDocs(id);

// Parallel (fast)
const [project, docs] = await Promise.all([
  this.getProject(id),
  this.getDocs(id),
]);
```

**Error Handling**:
```typescript
try {
  const result = await this.operation();
  return result;
} catch (error) {
  this.logger.error('Operation failed', error.stack);
  throw new InternalServerErrorException('Operation failed');
}
```

## Code Review Checklist

### Pre-Commit
- [ ] TypeScript compilation passes (`pnpm build`)
- [ ] All tests pass (`pnpm test`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] No console.log statements
- [ ] Sensitive data NOT logged

### Code Quality
- [ ] Functions single responsibility
- [ ] Variable names descriptive
- [ ] Complex logic commented
- [ ] Error handling implemented
- [ ] Input validation present

### Security
- [ ] Tokens encrypted before storage
- [ ] Input sanitized/validated
- [ ] SQL injection prevented (Prisma handles)
- [ ] API endpoints protected (if needed)
- [ ] No hardcoded secrets

### Testing
- [ ] Unit tests for services
- [ ] Controller tests present
- [ ] Edge cases covered
- [ ] Mocks properly configured
- [ ] Test descriptions clear

### Documentation
- [ ] Public APIs documented
- [ ] Complex logic explained
- [ ] Breaking changes noted
- [ ] Migration guide (if schema changes)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-03
**Maintainer**: Backend Team
**Applies To**: Phase 02 - Backend Core Services
