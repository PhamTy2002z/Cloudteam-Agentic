# Phase 06: Integration & Testing

---
phase: 06
title: Integration & Testing
status: pending
effort: 4h
parallelization: Must run AFTER all other phases
depends_on: [phase-01, phase-02, phase-03, phase-04, phase-05]
blocks: []
---

## Overview

Implement E2E tests, integration tests, and verify full system functionality.

## File Ownership (Exclusive to This Phase)

```
apps/backend/
├── test/
│   ├── jest-e2e.json
│   ├── app.e2e-spec.ts
│   ├── projects.e2e-spec.ts
│   ├── lock.e2e-spec.ts
│   └── hook.e2e-spec.ts
└── jest.config.js

apps/frontend/
├── __tests__/
│   ├── components/
│   │   ├── project-card.test.tsx
│   │   └── lock-status.test.tsx
│   └── hooks/
│       ├── use-projects.test.ts
│       └── use-lock.test.ts
├── vitest.config.ts
└── playwright.config.ts

e2e/
├── full-flow.spec.ts
└── fixtures/
    └── test-project.json
```

## Implementation Steps

### Step 1: Backend Jest Configuration (30m)

**1.1 Create apps/backend/jest.config.js**

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.module.ts'],
  coverageDirectory: './coverage',
  testTimeout: 30000,
};
```

**1.2 Create apps/backend/test/jest-e2e.json**

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

### Step 2: Backend E2E Tests (1.5h)

**2.1 Create apps/backend/test/app.e2e-spec.ts**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('Health Check', () => {
    it('should be running', () => {
      expect(app).toBeDefined();
    });
  });
});
```

**2.2 Create apps/backend/test/projects.e2e-spec.ts**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('POST /api/projects', () => {
    it('should create a project', async () => {
      const createDto = {
        name: 'Test Project',
        repoUrl: 'https://github.com/test/repo',
        token: 'ghp_test_token',
        branch: 'main',
        docsPath: 'docs',
      };

      const response = await request(app.getHttpServer())
        .post('/api/projects')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createDto.name);
      expect(response.body.repoUrl).toBe(createDto.repoUrl);
      projectId = response.body.id;
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({ name: 'Missing fields' })
        .expect(400);
    });
  });

  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a single project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get('/api/projects/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project', async () => {
      const updateDto = { name: 'Updated Project Name' };

      const response = await request(app.getHttpServer())
        .put(`/api/projects/${projectId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .expect(404);
    });
  });
});
```

**2.3 Create apps/backend/test/lock.e2e-spec.ts**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Lock (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Lock Test Project',
        repoUrl: 'https://github.com/test/lock-test',
        token: 'ghp_test',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('GET /api/projects/:id/lock', () => {
    it('should return null when no lock exists', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}/lock`)
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('POST /api/projects/:id/lock', () => {
    it('should acquire a lock', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/lock`)
        .send({ lockedBy: 'TestUser', reason: 'Testing' })
        .expect(201);

      expect(response.body.lockedBy).toBe('TestUser');
      expect(response.body.reason).toBe('Testing');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should reject duplicate lock', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/projects/${projectId}/lock`)
        .send({ lockedBy: 'AnotherUser' })
        .expect(409);

      expect(response.body.message).toContain('already locked');
    });
  });

  describe('DELETE /api/projects/:id/lock', () => {
    it('should release a lock', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}/lock`)
        .expect(200);

      expect(response.body.released).toBe(true);
    });

    it('should handle releasing non-existent lock', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}/lock`)
        .expect(200);

      expect(response.body.released).toBe(false);
    });
  });
});
```

**2.4 Create apps/backend/test/hook.e2e-spec.ts**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Hook API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let projectId: string;
  let apiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();

    // Create test project with API key
    const project = await prisma.project.create({
      data: {
        name: 'Hook Test Project',
        repoUrl: 'https://github.com/test/hook-test',
        token: 'ghp_test',
        docs: {
          create: [
            { fileName: 'README.md', content: '# Test', hash: 'abc123' },
            { fileName: 'GUIDE.md', content: '# Guide', hash: 'def456' },
          ],
        },
        apiKeys: {
          create: { key: 'sk_test_hook_key', name: 'Test Key' },
        },
      },
    });
    projectId = project.id;
    apiKey = 'sk_test_hook_key';
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      await request(app.getHttpServer())
        .get(`/api/hook/status/${projectId}`)
        .expect(401);
    });

    it('should reject requests with invalid API key', async () => {
      await request(app.getHttpServer())
        .get(`/api/hook/status/${projectId}`)
        .set('X-API-Key', 'invalid_key')
        .expect(401);
    });
  });

  describe('GET /api/hook/status/:projectId', () => {
    it('should return unlocked status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/hook/status/${projectId}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.locked).toBe(false);
    });

    it('should return locked status after lock acquired', async () => {
      // Acquire lock
      await prisma.lock.create({
        data: {
          projectId,
          lockedBy: 'TechLead',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/hook/status/${projectId}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.locked).toBe(true);
      expect(response.body.lockedBy).toBe('TechLead');

      // Clean up
      await prisma.lock.deleteMany({ where: { projectId } });
    });
  });

  describe('GET /api/hook/docs/:projectId', () => {
    it('should return docs hash', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/hook/docs/${projectId}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('hash');
      expect(response.body.docsCount).toBe(2);
    });
  });

  describe('POST /api/hook/sync/:projectId', () => {
    it('should return all docs', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/hook/sync/${projectId}`)
        .set('X-API-Key', apiKey)
        .expect(201);

      expect(response.body.docs).toHaveLength(2);
      expect(response.body).toHaveProperty('hash');
      expect(response.body.docs[0]).toHaveProperty('fileName');
      expect(response.body.docs[0]).toHaveProperty('content');
    });
  });
});
```

### Step 3: Frontend Test Configuration (30m)

**3.1 Create apps/frontend/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**3.2 Create apps/frontend/__tests__/setup.ts**

```typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/projects',
  useParams: () => ({}),
}));

// Mock zustand
vi.mock('zustand');
```

### Step 4: Frontend Component Tests (1h)

**4.1 Create apps/frontend/__tests__/components/project-card.test.tsx**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectCard } from '@/components/project-card';
import type { Project } from '@/lib/api';

const mockProject: Project = {
  id: 'test-1',
  name: 'Test Project',
  repoUrl: 'https://github.com/test/repo',
  branch: 'main',
  docsPath: 'docs',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  locks: [],
};

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows unlocked badge when no lock', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('shows locked badge when lock exists', () => {
    const lockedProject: Project = {
      ...mockProject,
      locks: [
        {
          id: 'lock-1',
          projectId: 'test-1',
          lockedBy: 'TechLead',
          lockedAt: new Date().toISOString(),
        },
      ],
    };

    render(<ProjectCard project={lockedProject} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('shows Open Editor button when unlocked', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Open Editor')).toBeInTheDocument();
  });

  it('shows View Only button when locked', () => {
    const lockedProject: Project = {
      ...mockProject,
      locks: [
        {
          id: 'lock-1',
          projectId: 'test-1',
          lockedBy: 'TechLead',
          lockedAt: new Date().toISOString(),
        },
      ],
    };

    render(<ProjectCard project={lockedProject} />);
    expect(screen.getByText('View Only')).toBeInTheDocument();
  });
});
```

**4.2 Create apps/frontend/__tests__/components/lock-status.test.tsx**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LockStatus } from '@/components/lock-status';

describe('LockStatus', () => {
  it('renders unlocked when no lock', () => {
    render(<LockStatus lock={null} />);
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('renders locked when lock exists', () => {
    const lock = {
      id: 'lock-1',
      projectId: 'test-1',
      lockedBy: 'TechLead',
      lockedAt: new Date().toISOString(),
    };

    render(<LockStatus lock={lock} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });
});
```

### Step 5: Integration Test Checklist (30m)

**5.1 Create TESTING.md in root**

```markdown
# Integration Testing Checklist

## Prerequisites
- [ ] PostgreSQL running via Docker
- [ ] Backend started on port 3001
- [ ] Frontend started on port 3000
- [ ] Test project created with API key

## Backend Tests

```bash
cd apps/backend
pnpm test:e2e
```

Expected results:
- [ ] All project CRUD tests pass
- [ ] All lock tests pass
- [ ] All hook API tests pass
- [ ] API key authentication works

## Frontend Tests

```bash
cd apps/frontend
pnpm test
```

Expected results:
- [ ] ProjectCard renders correctly
- [ ] LockStatus shows correct state
- [ ] Hook tests pass

## Manual Integration Tests

### 1. Project Lifecycle
- [ ] Create project from dashboard
- [ ] View project in list
- [ ] Open editor for project
- [ ] Update project settings
- [ ] Delete project

### 2. Lock Mechanism
- [ ] Lock acquired when opening editor
- [ ] Lock displayed in dashboard
- [ ] Lock banner shows for locked projects
- [ ] Lock released when closing editor
- [ ] WebSocket broadcasts lock events

### 3. Docs Management
- [ ] Sync docs from GitHub
- [ ] Edit doc in Monaco editor
- [ ] Save doc (Ctrl+S)
- [ ] Push doc to GitHub
- [ ] Preview updates in real-time

### 4. Hook Integration
- [ ] check-platform.sh detects lock
- [ ] check-platform.sh syncs docs
- [ ] protect-docs.sh blocks .docs/ writes
- [ ] Offline mode uses cached docs

### 5. WebSocket Real-time
- [ ] Connection established on page load
- [ ] Lock events received by other clients
- [ ] Reconnection after disconnect

## E2E Flow Test

1. Start fresh database
2. Create project via API
3. Generate API key
4. Run check-platform.sh (should sync)
5. Open editor (lock acquired)
6. Run check-platform.sh in another terminal (should fail - locked)
7. Close editor (lock released)
8. Run check-platform.sh again (should succeed)

## Performance Checks

- [ ] Projects list loads < 1s
- [ ] Editor loads < 2s
- [ ] Lock check API < 200ms
- [ ] WebSocket reconnects within 5s
```

---

## Verification Steps

```bash
# Run all backend tests
cd apps/backend && pnpm test:e2e

# Run all frontend tests
cd apps/frontend && pnpm test

# Manual verification
# Follow TESTING.md checklist
```

## Success Criteria

- [ ] All backend E2E tests pass
- [ ] All frontend component tests pass
- [ ] Manual integration checklist complete
- [ ] No console errors in browser
- [ ] WebSocket connections stable
- [ ] Hook scripts work end-to-end

---

## Test Coverage Goals

| Area | Target |
|------|--------|
| Backend Controllers | 80% |
| Backend Services | 70% |
| Frontend Components | 60% |
| Frontend Hooks | 50% |
| E2E Critical Paths | 100% |

---

## Known Limitations

1. **GitHub API mocking**: Tests skip actual GitHub calls
2. **WebSocket testing**: Manual verification recommended
3. **Hook scripts**: Require real Platform connection for full test

## Future Test Additions

- [ ] Playwright E2E tests
- [ ] Load testing for WebSocket
- [ ] Security penetration testing
- [ ] Accessibility testing (a11y)
