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
  ): Promise<DocFile[]> {
    const octokit = this.createClient(token);
    const { owner, repo } = this.parseRepoUrl(repoUrl);

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: docsPath,
        ref: branch,
      });

      if (!Array.isArray(data)) {
        throw new Error(`${docsPath} is not a directory`);
      }

      const mdFiles = data.filter(
        (item) => item.type === 'file' && item.name.endsWith('.md'),
      );

      const docs: DocFile[] = [];
      for (const file of mdFiles) {
        const doc = await this.getDocFile(
          token,
          repoUrl,
          docsPath,
          file.name,
          branch,
        );
        docs.push(doc);
      }

      return docs;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list ${docsPath}: ${errMsg}`);
      throw error;
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
