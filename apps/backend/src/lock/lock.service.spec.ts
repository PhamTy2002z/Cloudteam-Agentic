import { Test, TestingModule } from '@nestjs/testing';
import { LockService } from './lock.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('LockService', () => {
  let service: LockService;
  let prisma: PrismaService;

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
  };

  const mockLock = {
    id: 'lock-123',
    projectId: 'project-123',
    lockedBy: 'user@example.com',
    reason: 'Editing docs',
    lockedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
  };

  const mockPrismaService = {
    lock: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LockService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<LockService>(LockService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLock', () => {
    it('should return active lock', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(mockLock);

      const result = await service.getLock('project-123');

      expect(prisma.lock.findUnique).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
      });
      expect(result).toEqual(mockLock);
    });

    it('should return null when no lock exists', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(null);

      const result = await service.getLock('project-123');

      expect(result).toBeNull();
    });

    it('should release and return null for expired lock', async () => {
      const expiredLock = {
        ...mockLock,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      mockPrismaService.lock.findUnique.mockResolvedValue(expiredLock);
      mockPrismaService.lock.delete.mockResolvedValue(expiredLock);

      const result = await service.getLock('project-123');

      expect(prisma.lock.delete).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
      });
      expect(result).toBeNull();
    });
  });

  describe('acquireLock', () => {
    it('should acquire lock when no existing lock', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(null);
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.lock.create.mockResolvedValue(mockLock);

      const result = await service.acquireLock(
        'project-123',
        'user@example.com',
        'Editing docs',
      );

      expect(prisma.lock.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-123',
          lockedBy: 'user@example.com',
          reason: 'Editing docs',
          expiresAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockLock);
    });

    it('should throw ConflictException when lock already exists', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(mockLock);

      await expect(
        service.acquireLock('project-123', 'another@example.com'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(null);
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.acquireLock('non-existent', 'user@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should acquire lock without reason', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(null);
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.lock.create.mockResolvedValue({
        ...mockLock,
        reason: undefined,
      });

      await service.acquireLock('project-123', 'user@example.com');

      expect(prisma.lock.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-123',
          lockedBy: 'user@example.com',
          reason: undefined,
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('releaseLock', () => {
    it('should release existing lock', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(mockLock);
      mockPrismaService.lock.delete.mockResolvedValue(mockLock);

      const result = await service.releaseLock('project-123');

      expect(prisma.lock.delete).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
      });
      expect(result).toEqual({ released: true });
    });

    it('should return false when no lock exists', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(null);

      const result = await service.releaseLock('project-123');

      expect(prisma.lock.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ released: false, message: 'No lock exists' });
    });
  });

  describe('extendLock', () => {
    it('should extend lock with default TTL', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(mockLock);
      mockPrismaService.lock.update.mockResolvedValue({
        ...mockLock,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });

      const result = await service.extendLock('project-123');

      expect(prisma.lock.update).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        data: { expiresAt: expect.any(Date) },
      });
      expect(result.expiresAt).toBeDefined();
    });

    it('should extend lock with custom TTL', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(mockLock);
      mockPrismaService.lock.update.mockResolvedValue({
        ...mockLock,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      await service.extendLock('project-123', 60);

      expect(prisma.lock.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when no active lock', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(null);

      await expect(service.extendLock('project-123')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.extendLock('project-123')).rejects.toThrow(
        'No active lock found',
      );
    });
  });

  describe('isLocked', () => {
    it('should return true when lock exists', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(mockLock);

      const result = await service.isLocked('project-123');

      expect(result).toBe(true);
    });

    it('should return false when no lock exists', async () => {
      mockPrismaService.lock.findUnique.mockResolvedValue(null);

      const result = await service.isLocked('project-123');

      expect(result).toBe(false);
    });
  });
});
