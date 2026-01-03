import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import type { App } from 'supertest/types';
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
