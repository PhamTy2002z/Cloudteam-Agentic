import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  async create(dto: CreateProjectDto) {
    const encryptedToken = this.crypto.encrypt(dto.token);
    return this.prisma.project.create({
      data: {
        name: dto.name,
        repoUrl: dto.repoUrl,
        token: encryptedToken,
        branch: dto.branch || 'main',
        docsPath: dto.docsPath || 'docs',
      },
    });
  }

  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: {
        locks: true,
        _count: { select: { docs: true, apiKeys: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    // Exclude token from response for security
    return projects.map(({ token, ...rest }) => rest);
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        docs: true,
        locks: true,
        apiKeys: { where: { isActive: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    // Exclude token from response for security
    const { token, ...rest } = project;
    return rest;
  }

  // Internal method to get project with token for service use
  private async findOneWithToken(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async generateApiKey(projectId: string, name: string) {
    await this.findOne(projectId);
    const key = `sk_${randomBytes(32).toString('hex')}`;

    return this.prisma.apiKey.create({
      data: {
        projectId,
        key,
        name,
      },
    });
  }

  async revokeApiKey(keyId: string) {
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });
  }

  async getDecryptedToken(projectId: string): Promise<string> {
    const project = await this.findOneWithToken(projectId);
    return this.crypto.decrypt(project.token);
  }
}
