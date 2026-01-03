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
    // Use transaction with serializable isolation to prevent race conditions
    return this.prisma.$transaction(
      async (tx) => {
        // Check for existing lock within transaction
        const existingLock = await tx.lock.findUnique({
          where: { projectId },
        });

        if (existingLock) {
          // Check if expired
          if (existingLock.expiresAt && existingLock.expiresAt < new Date()) {
            await tx.lock.delete({ where: { projectId } });
          } else {
            throw new ConflictException({
              message: 'Project is already locked',
              lockedBy: existingLock.lockedBy,
              lockedAt: existingLock.lockedAt,
            });
          }
        }

        // Verify project exists
        const project = await tx.project.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          throw new NotFoundException(`Project ${projectId} not found`);
        }

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + DEFAULT_LOCK_TTL_MINUTES);

        return tx.lock.create({
          data: {
            projectId,
            lockedBy,
            reason,
            expiresAt,
          },
        });
      },
      {
        isolationLevel: 'Serializable',
        timeout: 5000,
      },
    );
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
