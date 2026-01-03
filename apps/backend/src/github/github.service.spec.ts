import { Test, TestingModule } from '@nestjs/testing';
import { GitHubService, DocFile } from './github.service';

describe('GitHubService', () => {
  let service: GitHubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GitHubService],
    }).compile();

    service = module.get<GitHubService>(GitHubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseRepoUrl (private method via reflection)', () => {
    it('should parse HTTPS GitHub URL', () => {
      const result = (service as any).parseRepoUrl(
        'https://github.com/owner/repo',
      );
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse HTTPS GitHub URL with .git suffix', () => {
      const result = (service as any).parseRepoUrl(
        'https://github.com/owner/repo.git',
      );
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should parse SSH GitHub URL', () => {
      const result = (service as any).parseRepoUrl(
        'git@github.com:owner/repo.git',
      );
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should throw error for invalid URL', () => {
      expect(() => {
        (service as any).parseRepoUrl('invalid-url');
      }).toThrow('Invalid GitHub URL: invalid-url');
    });

    it('should throw error for non-GitHub URL', () => {
      expect(() => {
        (service as any).parseRepoUrl('https://gitlab.com/owner/repo');
      }).toThrow('Invalid GitHub URL');
    });
  });

  describe('computeHash', () => {
    it('should compute MD5 hash of content', () => {
      const hash = service.computeHash('test content');
      expect(hash).toBe('9473fdd0d880a43c21b7778d34872157');
    });

    it('should return different hash for different content', () => {
      const hash1 = service.computeHash('content 1');
      const hash2 = service.computeHash('content 2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return same hash for same content', () => {
      const hash1 = service.computeHash('same content');
      const hash2 = service.computeHash('same content');
      expect(hash1).toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = service.computeHash('');
      expect(hash).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should handle unicode content', () => {
      const hash = service.computeHash('Hello World');
      expect(hash).toHaveLength(32);
    });

    it('should produce 32-character hex string', () => {
      const hash = service.computeHash('any content');
      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('createClient (private method)', () => {
    it('should create Octokit client with token', () => {
      const client = (service as any).createClient('test-token');
      expect(client).toBeDefined();
      expect(client.repos).toBeDefined();
    });
  });

  describe('getDocFile', () => {
    it('should throw error for invalid repo URL', async () => {
      await expect(
        service.getDocFile(
          'token',
          'invalid-url',
          'docs',
          'README.md',
          'main',
        ),
      ).rejects.toThrow('Invalid GitHub URL');
    });
  });

  describe('getAllDocs', () => {
    it('should throw error for invalid repo URL', async () => {
      await expect(
        service.getAllDocs('token', 'invalid-url', 'docs', 'main'),
      ).rejects.toThrow('Invalid GitHub URL');
    });
  });

  describe('pushDoc', () => {
    it('should throw error for invalid repo URL', async () => {
      await expect(
        service.pushDoc(
          'token',
          'invalid-url',
          'docs',
          'README.md',
          '# Content',
          'Update',
          'main',
        ),
      ).rejects.toThrow('Invalid GitHub URL');
    });
  });
});
