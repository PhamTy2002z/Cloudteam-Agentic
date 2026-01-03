import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Hook API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let projectId: string;
  const apiKey = 'sk_test_hook_key';

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

    // Create test project with API key and docs
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
          create: { key: apiKey, name: 'Test Key' },
        },
      },
    });
    projectId = project.id;
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
