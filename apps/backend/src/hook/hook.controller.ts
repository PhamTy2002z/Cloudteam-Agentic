import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { HookService } from './hook.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('hook')
@UseGuards(ApiKeyGuard)
export class HookController {
  constructor(private readonly hookService: HookService) {}

  /**
   * Check project lock status
   * Used by check-platform.sh to determine if dev can start session
   */
  @Get('status/:projectId')
  getStatus(@Param('projectId') projectId: string) {
    return this.hookService.getStatus(projectId);
  }

  /**
   * Get docs hash for quick comparison
   * Used by check-platform.sh to determine if sync needed
   */
  @Get('docs/:projectId')
  getDocsHash(@Param('projectId') projectId: string) {
    return this.hookService.getDocsHash(projectId);
  }

  /**
   * Sync docs from platform
   * Returns all docs content for local .docs/ folder
   */
  @Post('sync/:projectId')
  syncDocs(@Param('projectId') projectId: string) {
    return this.hookService.syncDocs(projectId);
  }
}
