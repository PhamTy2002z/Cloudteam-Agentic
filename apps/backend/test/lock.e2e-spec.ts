import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import type { App } from 'supertest/types';
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
