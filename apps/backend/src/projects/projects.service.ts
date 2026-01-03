import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        repoUrl: dto.repoUrl,
        token: dto.token,
        branch: dto.branch || 'main',
        docsPath: dto.docsPath || 'docs',
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        locks: true,
        _count: { select: { docs: true, apiKeys: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
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
}
