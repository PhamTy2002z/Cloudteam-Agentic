import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocsService } from '../docs/docs.service';
import { LockService } from '../lock/lock.service';

export interface HookStatusResponse {
  locked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  expiresAt?: string;
}

export interface HookDocsHashResponse {
  hash: string;
  docsCount: number;
}

export interface HookSyncResponse {
  docs: Array<{
    fileName: string;
    content: string;
    hash: string;
  }>;
  hash: string;
}

@Injectable()
export class HookService {
  constructor(
    private prisma: PrismaService,
    private docsService: DocsService,
    private lockService: LockService,
  ) {}

  async getStatus(projectId: string): Promise<HookStatusResponse> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const lock = await this.lockService.getLock(projectId);

    if (!lock) {
      return { locked: false };
    }

    return {
      locked: true,
      lockedBy: lock.lockedBy,
      lockedAt: lock.lockedAt.toISOString(),
      expiresAt: lock.expiresAt?.toISOString(),
    };
  }

  async getDocsHash(projectId: string): Promise<HookDocsHashResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const docs = await this.docsService.findAllByProject(projectId);
    const hash = await this.docsService.getDocsHash(projectId);

    return {
      hash,
      docsCount: docs.length,
    };
  }

  async syncDocs(projectId: string): Promise<HookSyncResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // First sync from GitHub to ensure we have latest
    await this.docsService.syncFromGitHub(projectId);

    // Get all docs
    const docs = await this.docsService.findAllByProject(projectId);
    const hash = await this.docsService.getDocsHash(projectId);

    return {
      docs: docs.map((doc) => ({
        fileName: doc.fileName,
        content: doc.content,
        hash: doc.hash,
      })),
      hash,
    };
  }
}
