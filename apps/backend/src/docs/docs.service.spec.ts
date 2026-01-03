import { Test, TestingModule } from '@nestjs/testing';
import { DocsService } from './docs.service';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubService } from '../github/github.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateDocDto } from './dto/update-doc.dto';

describe('DocsService', () => {
  let service: DocsService;
  let prisma: PrismaService;
  let github: GitHubService;

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    repoUrl: 'https://github.com/test/repo',
    token: 'ghp_test_token',
    branch: 'main',
    docsPath: 'docs',
  };

  const mockDoc = {
    id: 'doc-123',
    projectId: 'project-123',
    fileName: 'README.md',
    content: '# Test Content',
    hash: 'abc123',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    doc: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  const mockGitHubService = {
    computeHash: jest.fn(),
    getAllDocs: jest.fn(),
    pushDoc: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GitHubService, useValue: mockGitHubService },
      ],
    }).compile();

    service = module.get<DocsService>(DocsService);
    prisma = module.get<PrismaService>(PrismaService);
    github = module.get<GitHubService>(GitHubService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByProject', () => {
    it('should return all docs for a project', async () => {
      const docs = [mockDoc, { ...mockDoc, id: 'doc-456', fileName: 'GUIDE.md' }];
      mockPrismaService.doc.findMany.mockResolvedValue(docs);

      const result = await service.findAllByProject('project-123');

      expect(prisma.doc.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        orderBy: { fileName: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no docs exist', async () => {
      mockPrismaService.doc.findMany.mockResolvedValue([]);

      const result = await service.findAllByProject('project-123');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a doc by projectId and fileName', async () => {
      mockPrismaService.doc.findUnique.mockResolvedValue(mockDoc);

      const result = await service.findOne('project-123', 'README.md');

      expect(prisma.doc.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_fileName: { projectId: 'project-123', fileName: 'README.md' },
        },
      });
      expect(result.fileName).toBe('README.md');
    });

    it('should throw NotFoundException when doc not found', async () => {
      mockPrismaService.doc.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('project-123', 'NONEXISTENT.md'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne('project-123', 'NONEXISTENT.md'),
      ).rejects.toThrow('Doc NONEXISTENT.md not found');
    });
  });

  describe('update', () => {
    it('should update existing doc', async () => {
      const dto: UpdateDocDto = { content: '# Updated Content' };
      const updatedDoc = { ...mockDoc, content: dto.content, version: 2 };

      mockGitHubService.computeHash.mockReturnValue('newhash123');
      mockPrismaService.doc.upsert.mockResolvedValue(updatedDoc);

      const result = await service.update('project-123', 'README.md', dto);

      expect(github.computeHash).toHaveBeenCalledWith(dto.content);
      expect(prisma.doc.upsert).toHaveBeenCalledWith({
        where: {
          projectId_fileName: { projectId: 'project-123', fileName: 'README.md' },
        },
        update: {
          content: dto.content,
          hash: 'newhash123',
          version: { increment: 1 },
        },
        create: {
          projectId: 'project-123',
          fileName: 'README.md',
          content: dto.content,
          hash: 'newhash123',
        },
      });
      expect(result.content).toBe(dto.content);
    });

    it('should create new doc if not exists', async () => {
      const dto: UpdateDocDto = { content: '# New Doc' };
      const newDoc = {
        ...mockDoc,
        fileName: 'NEW.md',
        content: dto.content,
        version: 1,
      };

      mockGitHubService.computeHash.mockReturnValue('newhash456');
      mockPrismaService.doc.upsert.mockResolvedValue(newDoc);

      const result = await service.update('project-123', 'NEW.md', dto);

      expect(result.fileName).toBe('NEW.md');
    });
  });

  describe('syncFromGitHub', () => {
    it('should sync docs from GitHub', async () => {
      const remoteDocs = [
        { fileName: 'README.md', content: '# Remote README', sha: 'sha1' },
        { fileName: 'GUIDE.md', content: '# Remote Guide', sha: 'sha2' },
      ];

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockGitHubService.getAllDocs.mockResolvedValue(remoteDocs);
      mockGitHubService.computeHash.mockReturnValue('hash123');
      mockPrismaService.doc.upsert.mockResolvedValue(mockDoc);

      const result = await service.syncFromGitHub('project-123');

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-123' },
      });
      expect(github.getAllDocs).toHaveBeenCalledWith(
        mockProject.token,
        mockProject.repoUrl,
        mockProject.docsPath,
        mockProject.branch,
      );
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.syncFromGitHub('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.syncFromGitHub('non-existent')).rejects.toThrow(
        'Project non-existent not found',
      );
    });

    it('should handle empty docs directory', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockGitHubService.getAllDocs.mockResolvedValue([]);

      const result = await service.syncFromGitHub('project-123');

      expect(result).toEqual([]);
    });
  });

  describe('pushToGitHub', () => {
    it('should push doc to GitHub', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.doc.findUnique.mockResolvedValue(mockDoc);
      mockGitHubService.pushDoc.mockResolvedValue(undefined);

      const result = await service.pushToGitHub('project-123', 'README.md');

      expect(github.pushDoc).toHaveBeenCalledWith(
        mockProject.token,
        mockProject.repoUrl,
        mockProject.docsPath,
        'README.md',
        mockDoc.content,
        'Update README.md via AI Toolkit Platform',
        mockProject.branch,
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.pushToGitHub('non-existent', 'README.md'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when doc not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.doc.findUnique.mockResolvedValue(null);

      await expect(
        service.pushToGitHub('project-123', 'NONEXISTENT.md'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDocsHash', () => {
    it('should compute combined hash of all docs', async () => {
      const docs = [
        { ...mockDoc, hash: 'hash1' },
        { ...mockDoc, id: 'doc-456', hash: 'hash2' },
      ];

      mockPrismaService.doc.findMany.mockResolvedValue(docs);
      mockGitHubService.computeHash.mockReturnValue('combinedhash');

      const result = await service.getDocsHash('project-123');

      expect(github.computeHash).toHaveBeenCalledWith('hash1hash2');
      expect(result).toBe('combinedhash');
    });

    it('should return hash for empty docs', async () => {
      mockPrismaService.doc.findMany.mockResolvedValue([]);
      mockGitHubService.computeHash.mockReturnValue('emptyhash');

      const result = await service.getDocsHash('project-123');

      expect(github.computeHash).toHaveBeenCalledWith('');
      expect(result).toBe('emptyhash');
    });
  });
});
