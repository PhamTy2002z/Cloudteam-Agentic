import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LOCK_TTL_MINUTES = 30;

@Injectable()
export class LockService {
  constructor(private prisma: PrismaService) {}

  async getLock(projectId: string) {
    const lock = await this.prisma.lock.findUnique({
      where: { projectId },
    });

    if (lock?.expiresAt && lock.expiresAt < new Date()) {
      await this.releaseLock(projectId);
      return null;
    }

    return lock;
  }

  async acquireLock(projectId: string, lockedBy: string, reason?: string) {
    const existingLock = await this.getLock(projectId);
    if (existingLock) {
      throw new ConflictException({
        message: 'Project is already locked',
        lockedBy: existingLock.lockedBy,
        lockedAt: existingLock.lockedAt,
      });
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + DEFAULT_LOCK_TTL_MINUTES);

    return this.prisma.lock.create({
      data: {
        projectId,
        lockedBy,
        reason,
        expiresAt,
      },
    });
  }

  async releaseLock(projectId: string) {
    const lock = await this.prisma.lock.findUnique({
      where: { projectId },
    });

    if (!lock) {
      return { released: false, message: 'No lock exists' };
    }

    await this.prisma.lock.delete({
      where: { projectId },
    });

    return { released: true };
  }

  async extendLock(projectId: string, minutes = DEFAULT_LOCK_TTL_MINUTES) {
    const lock = await this.getLock(projectId);
    if (!lock) {
      throw new NotFoundException('No active lock found');
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + minutes);

    return this.prisma.lock.update({
      where: { projectId },
      data: { expiresAt },
    });
  }

  async isLocked(projectId: string): Promise<boolean> {
    const lock = await this.getLock(projectId);
    return lock !== null;
  }
}
