import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/services/crypto.module';
import { ProjectsModule } from './projects/projects.module';
import { DocsModule } from './docs/docs.module';
import { LockModule } from './lock/lock.module';
import { GitHubModule } from './github/github.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    CryptoModule,
    ProjectsModule,
    DocsModule,
    LockModule,
    GitHubModule,
  ],
})
export class AppModule {}
