import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { DocsService } from './docs.service';
import { UpdateDocDto } from './dto/update-doc.dto';
import { SyncDocsDto } from './dto/sync-docs.dto';

@Controller('projects/:projectId/docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.docsService.findAllByProject(projectId);
  }

  @Get(':fileName')
  findOne(
    @Param('projectId') projectId: string,
    @Param('fileName') fileName: string,
  ) {
    return this.docsService.findOne(projectId, fileName);
  }

  @Put(':fileName')
  update(
    @Param('projectId') projectId: string,
    @Param('fileName') fileName: string,
    @Body() dto: UpdateDocDto,
  ) {
    return this.docsService.update(projectId, fileName, dto);
  }

  @Post('sync')
  syncFromGitHub(
    @Param('projectId') projectId: string,
    @Body() dto: SyncDocsDto,
  ) {
    return this.docsService.syncFromGitHub(projectId, {
      path: dto.path,
      recursive: dto.recursive,
    });
  }

  @Post(':fileName/push')
  pushToGitHub(
    @Param('projectId') projectId: string,
    @Param('fileName') fileName: string,
  ) {
    return this.docsService.pushToGitHub(projectId, fileName);
  }
}
