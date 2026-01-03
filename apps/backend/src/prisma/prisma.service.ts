import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Clean database for E2E testing - deletes all data in correct order
   * DANGER: Only use in test environment
   */
  async cleanDatabase() {
    // Production guard - prevent accidental data wipe
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase() cannot be called in production');
    }

    // Delete in order respecting foreign key constraints
    await this.lock.deleteMany();
    await this.apiKey.deleteMany();
    await this.doc.deleteMany();
    await this.project.deleteMany();
  }
}
