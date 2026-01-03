import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './common/services/crypto.module';
import { ProjectsModule } from './projects/projects.module';
import { DocsModule } from './docs/docs.module';
import { LockModule } from './lock/lock.module';
import { GitHubModule } from './github/github.module';
import { WebSocketModule } from './websocket/websocket.module';
import { HookModule } from './hook/hook.module';

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
    WebSocketModule,
    ProjectsModule,
    DocsModule,
    LockModule,
    GitHubModule,
    HookModule,
  ],
})
export class AppModule {}
