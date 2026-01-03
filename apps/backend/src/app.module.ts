import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { DocsModule } from './docs/docs.module';
import { LockModule } from './lock/lock.module';
import { GitHubModule } from './github/github.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    DocsModule,
    LockModule,
    GitHubModule,
  ],
})
export class AppModule {}
