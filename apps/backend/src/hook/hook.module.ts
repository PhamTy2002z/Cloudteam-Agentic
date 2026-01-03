import { Module } from '@nestjs/common';
import { HookController } from './hook.controller';
import { HookService } from './hook.service';
import { DocsModule } from '../docs/docs.module';
import { LockModule } from '../lock/lock.module';

@Module({
  imports: [DocsModule, LockModule],
  controllers: [HookController],
  providers: [HookService],
})
export class HookModule {}
