import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GitHubService } from '../github/github.service';
import { UpdateDocDto } from './dto/update-doc.dto';

@Injectable()
export class DocsService {
  constructor(
    private prisma: PrismaService,
    private github: GitHubService,
  ) {}

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

    const remoteDocs = await this.github.getAllDocs(
      project.token,
      project.repoUrl,
      project.docsPath,
      project.branch,
    );

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

    const doc = await this.findOne(projectId, fileName);

    await this.github.pushDoc(
      project.token,
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
    const combinedHash = docs.map((d) => d.hash).sort().join('');
    return this.github.computeHash(combinedHash);
  }
}
