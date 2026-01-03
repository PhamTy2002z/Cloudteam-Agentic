import { Test, TestingModule } from '@nestjs/testing';
import { LockController } from './lock.controller';
import { LockService } from './lock.service';
import { AcquireLockDto } from './dto/acquire-lock.dto';
import { ExtendLockDto } from './dto/extend-lock.dto';

describe('LockController', () => {
  let controller: LockController;
  let service: LockService;

  const mockLock = {
    id: 'lock-123',
    projectId: 'project-123',
    lockedBy: 'user@example.com',
    reason: 'Editing docs',
    lockedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };

  const mockLockService = {
    getLock: jest.fn(),
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
    extendLock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LockController],
      providers: [{ provide: LockService, useValue: mockLockService }],
    }).compile();

    controller = module.get<LockController>(LockController);
    service = module.get<LockService>(LockService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLock', () => {
    it('should return lock status', async () => {
      mockLockService.getLock.mockResolvedValue(mockLock);

      const result = await controller.getLock('project-123');

      expect(service.getLock).toHaveBeenCalledWith('project-123');
      expect(result).toEqual(mockLock);
    });

    it('should return null when no lock exists', async () => {
      mockLockService.getLock.mockResolvedValue(null);

      const result = await controller.getLock('project-123');

      expect(result).toBeNull();
    });
  });

  describe('acquireLock', () => {
    it('should acquire a lock', async () => {
      const dto: AcquireLockDto = { lockedBy: 'user@example.com', reason: 'Editing docs' };
      mockLockService.acquireLock.mockResolvedValue(mockLock);

      const result = await controller.acquireLock('project-123', dto);

      expect(service.acquireLock).toHaveBeenCalledWith(
        'project-123',
        'user@example.com',
        'Editing docs',
      );
      expect(result).toEqual(mockLock);
    });

    it('should acquire a lock without reason', async () => {
      const dto: AcquireLockDto = { lockedBy: 'user@example.com' };
      mockLockService.acquireLock.mockResolvedValue({
        ...mockLock,
        reason: undefined,
      });

      const result = await controller.acquireLock('project-123', dto);

      expect(service.acquireLock).toHaveBeenCalledWith(
        'project-123',
        'user@example.com',
        undefined,
      );
      expect(result.lockedBy).toBe('user@example.com');
    });
  });

  describe('releaseLock', () => {
    it('should release a lock', async () => {
      mockLockService.releaseLock.mockResolvedValue({ released: true });

      const result = await controller.releaseLock('project-123');

      expect(service.releaseLock).toHaveBeenCalledWith('project-123');
      expect(result).toEqual({ released: true });
    });
  });

  describe('extendLock', () => {
    it('should extend a lock with default TTL', async () => {
      const dto: ExtendLockDto = {};
      const extendedLock = {
        ...mockLock,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      };
      mockLockService.extendLock.mockResolvedValue(extendedLock);

      const result = await controller.extendLock('project-123', dto);

      expect(service.extendLock).toHaveBeenCalledWith('project-123', undefined);
      expect(result.expiresAt).toBeDefined();
    });

    it('should extend a lock with custom TTL', async () => {
      const dto: ExtendLockDto = { minutes: 60 };
      const extendedLock = {
        ...mockLock,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      };
      mockLockService.extendLock.mockResolvedValue(extendedLock);

      const result = await controller.extendLock('project-123', dto);

      expect(service.extendLock).toHaveBeenCalledWith('project-123', 60);
      expect(result).toEqual(extendedLock);
    });
  });
});
