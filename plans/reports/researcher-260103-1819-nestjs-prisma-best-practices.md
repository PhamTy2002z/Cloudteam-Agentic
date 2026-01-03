# NestJS + Prisma Best Practices 2025-2026

**Context**: AI Toolkit Sync Platform - centralized docs management with project CRUD, docs editor w/ locks, GitHub sync, API keys for Claude Code hooks

## 1. Project Structure (Monorepo)

**Recommended Tools**: Nx or Turborepo over Yarn Workspaces/PNPM

```
apps/
  api/                    # NestJS backend
libs/
  prisma/                 # Centralized DB layer
    schema.prisma
    src/prisma.service.ts
  common/                 # Shared types/interfaces
  core/                   # NestJS utilities/services
  github/                 # GitHub integration
  websocket/              # WebSocket logic
```

**Key Patterns**:
- Dedicated Prisma library for single source of truth
- Separate shared modules by concern (common, core, utils)
- Apps consume libs via DI

## 2. Prisma Setup

**Schema Design**:
```prisma
// libs/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client" // Custom path for monorepo
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id        String   @id @default(cuid())
  name      String
  docs      Doc[]
  apiKeys   ApiKey[]
  createdAt DateTime @default(now())
}

model Doc {
  id        String   @id @default(cuid())
  content   String
  lockedBy  String?
  lockedAt  DateTime?
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  @@index([projectId])
}
```

**Service Pattern**:
```typescript
// libs/prisma/src/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

**Connection Pooling**: Use `DATABASE_URL` with connection limit param:
```
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

**Migrations**:
- `prisma migrate dev` - development
- `prisma migrate deploy` - production
- Auto-run `prisma generate` post-schema changes (package.json postinstall hook)

## 3. WebSocket Gateway (Real-time Notifications)

**Setup**:
```typescript
// libs/websocket/src/notifications.gateway.ts
@WebSocketGateway({ cors: true })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly redis: RedisService) {}

  async handleConnection(client: Socket) {
    const userId = await this.authenticateSocket(client);
    client.join(`user:${userId}`);
  }

  private async authenticateSocket(client: Socket): Promise<string> {
    const token = client.handshake.auth.token;
    // Validate JWT, return userId
  }

  notifyDocLock(projectId: string, docId: string, userId: string) {
    this.server.to(`project:${projectId}`).emit('doc:locked', { docId, userId });
  }
}
```

**Scalability**:
- Use Redis adapter for multi-instance broadcasting:
```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

const redisAdapter = createAdapter(pubClient, subClient);
app.useWebSocketAdapter(new IoAdapter(app));
```
- Implement sticky sessions for load balancing
- Queue offline notifications using BullMQ/Redis

**Security**:
- JWT auth during handshake
- Guards for event-level authorization
- WSS (SSL/TLS) only
- Validate all incoming messages with DTOs

## 4. GitHub Integration (Octokit)

**Module Pattern**:
```typescript
// libs/github/src/github.module.ts
@Module({
  imports: [ConfigModule],
  providers: [GitHubService, OctokitProvider],
  exports: [GitHubService],
})
export class GitHubModule {}

// libs/github/src/github.service.ts
@Injectable()
export class GitHubService {
  constructor(
    @Inject('OCTOKIT') private octokit: Octokit,
    private cache: CacheManager,
  ) {}

  async syncDocs(repo: string, branch: string): Promise<void> {
    const cached = await this.cache.get(`sync:${repo}:${branch}`);
    if (cached) return cached;

    const { data } = await this.octokit.rest.repos.getContent({
      owner: 'org',
      repo,
      path: 'docs',
    });
    // Process & cache
  }
}
```

**Best Practices**:
- Use `nestjs-octokit` module for DI integration
- Store PATs/OAuth tokens in env vars (accessed via `@nestjs/config`)
- Adapter pattern for testability (mock adapters)
- Rate limiting with `@nestjs/throttler` or Octokit throttling plugin
- Cache frequently accessed data

## 5. API Design & Validation

**DTO Pattern**:
```typescript
// apps/api/src/projects/dto/create-project.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value.trim())
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

// Controller
@Post()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
async create(@Body() dto: CreateProjectDto) {
  return this.projectsService.create(dto);
}
```

**Global Validation**:
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}));
```

**API Keys for Claude Code Hooks**:
```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    return this.validateApiKey(apiKey);
  }
}
```

## 6. Error Handling & Logging

**Exception Filter**:
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
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

// main.ts
app.useGlobalFilters(new GlobalExceptionFilter(new Logger()));
```

**Logging Pattern**:
- Use Winston or Pino for structured logging
- Log levels: error, warn, info, debug
- Request ID tracking with middleware
- Centralized logging (e.g., CloudWatch, ELK stack)

---

## Unresolved Questions

1. Prefer PostgreSQL or MongoDB for doc content storage? (consider full-text search needs)
2. GitHub sync strategy: webhook-based or polling? (impacts rate limiting)
3. Doc lock TTL mechanism? (prevent orphaned locks)
4. Multi-tenancy approach for projects? (row-level security vs schema-per-tenant)
