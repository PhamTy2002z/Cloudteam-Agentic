import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { LockService } from './lock.service';
import { AcquireLockDto } from './dto/acquire-lock.dto';
import { ExtendLockDto } from './dto/extend-lock.dto';

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
    @Body() dto: AcquireLockDto,
  ) {
    return this.lockService.acquireLock(projectId, dto.lockedBy, dto.reason);
  }

  @Delete()
  releaseLock(@Param('projectId') projectId: string) {
    return this.lockService.releaseLock(projectId);
  }

  @Post('extend')
  extendLock(
    @Param('projectId') projectId: string,
    @Body() dto: ExtendLockDto,
  ) {
    return this.lockService.extendLock(projectId, dto.minutes);
  }
}
