import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { LockService } from './lock.service';

@Controller('projects/:projectId/lock')
export class LockController {
  constructor(private readonly lockService: LockService) {}

  @Get()
  getLock(@Param('projectId') projectId: string) {
    return this.lockService.getLock(projectId);
  }

  @Post()
  acquireLock(
    @Param('projectId') projectId: string,
    @Body('lockedBy') lockedBy: string,
    @Body('reason') reason?: string,
  ) {
    return this.lockService.acquireLock(projectId, lockedBy, reason);
  }

  @Delete()
  releaseLock(@Param('projectId') projectId: string) {
    return this.lockService.releaseLock(projectId);
  }

  @Post('extend')
  extendLock(
    @Param('projectId') projectId: string,
    @Body('minutes') minutes?: number,
  ) {
    return this.lockService.extendLock(projectId, minutes);
  }
}
