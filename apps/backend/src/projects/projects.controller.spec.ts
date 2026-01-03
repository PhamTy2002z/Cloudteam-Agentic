import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    repoUrl: 'https://github.com/test/repo',
    token: 'ghp_test_token',
    branch: 'main',
    docsPath: 'docs',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    generateApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const dto: CreateProjectDto = {
        name: 'New Project',
        repoUrl: 'https://github.com/test/new-repo',
        token: 'ghp_new_token',
      };

      mockProjectsService.create.mockResolvedValue({ ...mockProject, ...dto });

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe(dto.name);
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const projects = [mockProject, { ...mockProject, id: 'project-456' }];
      mockProjectsService.findAll.mockResolvedValue(projects);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne('project-123');

      expect(service.findOne).toHaveBeenCalledWith('project-123');
      expect(result.id).toBe('project-123');
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const dto: UpdateProjectDto = { name: 'Updated Name' };
      mockProjectsService.update.mockResolvedValue({
        ...mockProject,
        name: 'Updated Name',
      });

      const result = await controller.update('project-123', dto);

      expect(service.update).toHaveBeenCalledWith('project-123', dto);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockProjectsService.remove.mockResolvedValue(mockProject);

      const result = await controller.remove('project-123');

      expect(service.remove).toHaveBeenCalledWith('project-123');
      expect(result.id).toBe('project-123');
    });
  });

  describe('generateApiKey', () => {
    it('should generate an API key', async () => {
      const mockApiKey = {
        id: 'key-123',
        projectId: 'project-123',
        key: 'sk_test_key',
        name: 'Test Key',
      };

      mockProjectsService.generateApiKey.mockResolvedValue(mockApiKey);

      const result = await controller.generateApiKey('project-123', 'Test Key');

      expect(service.generateApiKey).toHaveBeenCalledWith(
        'project-123',
        'Test Key',
      );
      expect(result.name).toBe('Test Key');
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const revokedKey = { id: 'key-123', isActive: false };
      mockProjectsService.revokeApiKey.mockResolvedValue(revokedKey);

      const result = await controller.revokeApiKey('key-123');

      expect(service.revokeApiKey).toHaveBeenCalledWith('key-123');
      expect(result.isActive).toBe(false);
    });
  });
});
