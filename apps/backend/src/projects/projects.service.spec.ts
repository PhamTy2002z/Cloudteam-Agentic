import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    repoUrl: 'https://github.com/test/repo',
    token: 'encrypted_token',
    branch: 'main',
    docsPath: 'docs',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    apiKey: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCryptoService = {
    encrypt: jest.fn().mockReturnValue('encrypted_token'),
    decrypt: jest.fn().mockReturnValue('ghp_test_token'),
    computeHash: jest.fn().mockReturnValue('hash123'),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project with all fields', async () => {
      const dto: CreateProjectDto = {
        name: 'New Project',
        repoUrl: 'https://github.com/test/new-repo',
        token: 'ghp_new_token',
        branch: 'develop',
        docsPath: 'documentation',
      };

      mockPrismaService.project.create.mockResolvedValue({
        ...mockProject,
        ...dto,
      });

      const result = await service.create(dto);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          repoUrl: dto.repoUrl,
          token: 'encrypted_token',
          branch: dto.branch,
          docsPath: dto.docsPath,
        },
      });
      expect(result.name).toBe(dto.name);
    });

    it('should create a project with default branch and docsPath', async () => {
      const dto: CreateProjectDto = {
        name: 'New Project',
        repoUrl: 'https://github.com/test/new-repo',
        token: 'ghp_new_token',
      };

      mockPrismaService.project.create.mockResolvedValue({
        ...mockProject,
        name: dto.name,
        repoUrl: dto.repoUrl,
        token: dto.token,
      });

      await service.create(dto);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          repoUrl: dto.repoUrl,
          token: 'encrypted_token',
          branch: 'main',
          docsPath: 'docs',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all projects with locks and counts', async () => {
      const projects = [
        { ...mockProject, locks: [], _count: { docs: 5, apiKeys: 2 } },
        { ...mockProject, id: 'project-456', locks: [], _count: { docs: 3, apiKeys: 1 } },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll();

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        include: {
          locks: true,
          _count: { select: { docs: true, apiKeys: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no projects exist', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const projectWithRelations = {
        ...mockProject,
        docs: [],
        locks: [],
        apiKeys: [],
      };

      mockPrismaService.project.findUnique.mockResolvedValue(projectWithRelations);

      const result = await service.findOne('project-123');

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        include: {
          docs: true,
          locks: true,
          apiKeys: { where: { isActive: true } },
        },
      });
      expect(result.id).toBe('project-123');
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Project non-existent not found',
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const dto: UpdateProjectDto = { name: 'Updated Name' };
      const updatedProject = { ...mockProject, name: 'Updated Name' };

      mockPrismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        docs: [],
        locks: [],
        apiKeys: [],
      });
      mockPrismaService.project.update.mockResolvedValue(updatedProject);

      const result = await service.update('project-123', dto);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-123' },
        data: dto,
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when updating non-existent project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        docs: [],
        locks: [],
        apiKeys: [],
      });
      mockPrismaService.project.delete.mockResolvedValue(mockProject);

      const result = await service.remove('project-123');

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-123' },
      });
      expect(result.id).toBe('project-123');
    });

    it('should throw NotFoundException when deleting non-existent project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateApiKey', () => {
    it('should generate an API key for a project', async () => {
      const mockApiKey = {
        id: 'key-123',
        projectId: 'project-123',
        key: 'sk_test_key',
        name: 'Test Key',
        isActive: true,
        createdAt: new Date(),
      };

      mockPrismaService.project.findUnique.mockResolvedValue({
        ...mockProject,
        docs: [],
        locks: [],
        apiKeys: [],
      });
      mockPrismaService.apiKey.create.mockResolvedValue(mockApiKey);

      const result = await service.generateApiKey('project-123', 'Test Key');

      expect(prisma.apiKey.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-123',
          key: expect.stringMatching(/^sk_[a-f0-9]{64}$/),
          name: 'Test Key',
        },
      });
      expect(result.name).toBe('Test Key');
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.generateApiKey('non-existent', 'Test Key'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const revokedKey = {
        id: 'key-123',
        isActive: false,
      };

      mockPrismaService.apiKey.update.mockResolvedValue(revokedKey);

      const result = await service.revokeApiKey('key-123');

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });
  });
});
