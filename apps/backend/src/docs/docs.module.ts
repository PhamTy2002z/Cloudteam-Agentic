import { Module } from '@nestjs/common';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { GitHubModule } from '../github/github.module';
import { CryptoModule } from '../common/services/crypto.module';

@Module({
  imports: [GitHubModule, CryptoModule],
  controllers: [DocsController],
  providers: [DocsService],
  exports: [DocsService],
})
export class DocsModule {}
