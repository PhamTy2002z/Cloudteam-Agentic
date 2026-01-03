import { Test, TestingModule } from '@nestjs/testing';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { UpdateDocDto } from './dto/update-doc.dto';

describe('DocsController', () => {
  let controller: DocsController;
  let service: DocsService;

  const mockDoc = {
    id: 'doc-123',
    projectId: 'project-123',
    fileName: 'README.md',
    content: '# Test Content',
    hash: 'abc123',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocsService = {
    findAllByProject: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    syncFromGitHub: jest.fn(),
    pushToGitHub: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocsController],
      providers: [{ provide: DocsService, useValue: mockDocsService }],
    }).compile();

    controller = module.get<DocsController>(DocsController);
    service = module.get<DocsService>(DocsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all docs for a project', async () => {
      const docs = [mockDoc, { ...mockDoc, id: 'doc-456', fileName: 'GUIDE.md' }];
      mockDocsService.findAllByProject.mockResolvedValue(docs);

      const result = await controller.findAll('project-123');

      expect(service.findAllByProject).toHaveBeenCalledWith('project-123');
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a doc by projectId and fileName', async () => {
      mockDocsService.findOne.mockResolvedValue(mockDoc);

      const result = await controller.findOne('project-123', 'README.md');

      expect(service.findOne).toHaveBeenCalledWith('project-123', 'README.md');
      expect(result.fileName).toBe('README.md');
    });
  });

  describe('update', () => {
    it('should update a doc', async () => {
      const dto: UpdateDocDto = { content: '# Updated Content' };
      mockDocsService.update.mockResolvedValue({
        ...mockDoc,
        content: dto.content,
      });

      const result = await controller.update('project-123', 'README.md', dto);

      expect(service.update).toHaveBeenCalledWith(
        'project-123',
        'README.md',
        dto,
      );
      expect(result.content).toBe(dto.content);
    });
  });

  describe('syncFromGitHub', () => {
    it('should sync docs from GitHub', async () => {
      const syncedDocs = [mockDoc, { ...mockDoc, id: 'doc-456' }];
      mockDocsService.syncFromGitHub.mockResolvedValue(syncedDocs);

      const result = await controller.syncFromGitHub('project-123');

      expect(service.syncFromGitHub).toHaveBeenCalledWith('project-123');
      expect(result).toHaveLength(2);
    });
  });

  describe('pushToGitHub', () => {
    it('should push doc to GitHub', async () => {
      mockDocsService.pushToGitHub.mockResolvedValue({ success: true });

      const result = await controller.pushToGitHub('project-123', 'README.md');

      expect(service.pushToGitHub).toHaveBeenCalledWith(
        'project-123',
        'README.md',
      );
      expect(result).toEqual({ success: true });
    });
  });
});
