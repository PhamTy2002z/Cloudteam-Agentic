import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Doc } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubService } from '../github/github.service';
import { CryptoService } from '../common/services/crypto.service';
import { UpdateDocDto } from './dto/update-doc.dto';

@Injectable()
export class DocsService {
  constructor(
    private prisma: PrismaService,
    private github: GitHubService,
    private crypto: CryptoService,
  ) {}

  // Check if token is encrypted (has format iv:authTag:encrypted)
  private isEncrypted(token: string): boolean {
    const parts = token.split(':');
    return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
  }

  // Get decrypted token, handles both encrypted and legacy raw tokens
  private getDecryptedToken(token: string): string {
    if (this.isEncrypted(token)) {
      return this.crypto.decrypt(token);
    }
    // Legacy: token is stored as plain text
    return token;
  }

  async findAllByProject(projectId: string) {
    return this.prisma.doc.findMany({
      where: { projectId },
      orderBy: { fileName: 'asc' },
    });
  }

  async findOne(projectId: string, fileName: string) {
    const doc = await this.prisma.doc.findUnique({
      where: {
        projectId_fileName: { projectId, fileName },
      },
    });

    if (!doc) {
      throw new NotFoundException(`Doc ${fileName} not found`);
    }

    return doc;
  }

  async update(projectId: string, fileName: string, dto: UpdateDocDto) {
    const hash = this.github.computeHash(dto.content);

    return this.prisma.doc.upsert({
      where: {
        projectId_fileName: { projectId, fileName },
      },
      update: {
        content: dto.content,
        hash,
        version: { increment: 1 },
      },
      create: {
        projectId,
        fileName,
        content: dto.content,
        hash,
      },
    });
  }

  async syncFromGitHub(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const decryptedToken = this.getDecryptedToken(project.token);

    let remoteDocs;
    try {
      remoteDocs = await this.github.getAllDocs(
        decryptedToken,
        project.repoUrl,
        project.docsPath,
        project.branch,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('Bad credentials') || message.includes('401')) {
        throw new BadRequestException('Invalid GitHub token. Please update your token in Settings.');
      }
      if (message.includes('Not Found') || message.includes('404')) {
        throw new BadRequestException(`Folder "${project.docsPath}" not found in repository.`);
      }
      throw new BadRequestException(`GitHub sync failed: ${message}`);
    }

    const results = [];
    for (const doc of remoteDocs) {
      const hash = this.github.computeHash(doc.content);
      const result = await this.prisma.doc.upsert({
        where: {
          projectId_fileName: { projectId, fileName: doc.fileName },
        },
        update: {
          content: doc.content,
          hash,
        },
        create: {
          projectId,
          fileName: doc.fileName,
          content: doc.content,
          hash,
        },
      });
      results.push(result);
    }

    return results;
  }

  async pushToGitHub(projectId: string, fileName: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const decryptedToken = this.getDecryptedToken(project.token);
    const doc = await this.findOne(projectId, fileName);

    await this.github.pushDoc(
      decryptedToken,
      project.repoUrl,
      project.docsPath,
      fileName,
      doc.content,
      `Update ${fileName} via AI Toolkit Platform`,
      project.branch,
    );

    return { success: true };
  }

  async getDocsHash(projectId: string): Promise<string> {
    const docs = await this.findAllByProject(projectId);
    const combinedHash = docs.map((d: Doc) => d.hash).sort().join('');
    return this.github.computeHash(combinedHash);
  }
}
