import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { createHash } from 'crypto';

export interface DocFile {
  fileName: string;
  content: string;
  sha?: string | null;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger('GitHubService');

  private createClient(token: string): Octokit {
    return new Octokit({ auth: token });
  }

  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${repoUrl}`);
    }
    return { owner: match[1], repo: match[2] };
  }

  async getDocFile(
    token: string,
    repoUrl: string,
    docsPath: string,
    fileName: string,
    branch = 'main',
  ): Promise<DocFile> {
    const octokit = this.createClient(token);
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const path = `${docsPath}/${fileName}`;

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error(`${path} is not a file`);
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        fileName,
        content,
        sha: data.sha,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get ${path}: ${errMsg}`);
      throw error;
    }
  }

  async getAllDocs(
    token: string,
    repoUrl: string,
    docsPath: string,
    branch = 'main',
    recursive = false,
  ): Promise<DocFile[]> {
    const octokit = this.createClient(token);
    const { owner, repo } = this.parseRepoUrl(repoUrl);

    // Normalize path: empty string or "." means root
    const normalizedPath = docsPath === '.' || docsPath === '' ? '' : docsPath;

    try {
      const docs: DocFile[] = [];
      await this.fetchDocsRecursive(
        octokit,
        owner,
        repo,
        normalizedPath,
        branch,
        recursive,
        docs,
      );
      return docs;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list ${docsPath}: ${errMsg}`);
      throw error;
    }
  }

  private async fetchDocsRecursive(
    octokit: Octokit,
    owner: string,
    repo: string,
    path: string,
    branch: string,
    recursive: boolean,
    docs: DocFile[],
  ): Promise<void> {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: path || '',
      ref: branch,
    });

    if (!Array.isArray(data)) {
      // Single file - check if markdown
      if (data.type === 'file' && data.name.endsWith('.md')) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        // Use relative path from root as fileName
        const fileName = path || data.name;
        docs.push({ fileName, content, sha: data.sha });
      }
      return;
    }

    // Directory - process items
    for (const item of data) {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        const filePath = path ? `${path}/${item.name}` : item.name;
        try {
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch,
          });

          if (!Array.isArray(fileData) && fileData.type === 'file') {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            docs.push({ fileName: filePath, content, sha: fileData.sha });
          }
        } catch (err) {
          this.logger.warn(`Failed to fetch ${filePath}: ${err}`);
        }
      } else if (item.type === 'dir' && recursive) {
        const dirPath = path ? `${path}/${item.name}` : item.name;
        await this.fetchDocsRecursive(octokit, owner, repo, dirPath, branch, recursive, docs);
      }
    }
  }

  async pushDoc(
    token: string,
    repoUrl: string,
    docsPath: string,
    fileName: string,
    content: string,
    message: string,
    branch = 'main',
    sha?: string,
  ): Promise<void> {
    const octokit = this.createClient(token);
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const path = `${docsPath}/${fileName}`;

    let currentSha = sha;
    if (!currentSha) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });
        if (!Array.isArray(data)) {
          currentSha = data.sha;
        }
      } catch {
        // File doesn't exist, that's fine for new files
      }
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha: currentSha,
    });

    this.logger.log(`Pushed ${path} to ${owner}/${repo}`);
  }

  computeHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
