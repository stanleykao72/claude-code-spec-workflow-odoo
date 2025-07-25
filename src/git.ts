import simpleGit, { SimpleGit } from 'simple-git';

export interface GitInfo {
  branch?: string;
  remoteUrl?: string;
  githubUrl?: string;
}

export class GitUtils {
  static async getGitInfo(projectPath: string): Promise<GitInfo> {
    const info: GitInfo = {};

    try {
      const git: SimpleGit = simpleGit(projectPath);
      
      // Check if it's a git repository
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return info;
      }

      // Get current branch
      const status = await git.status();
      info.branch = status.current || undefined;

      // Get remote origin URL
      try {
        const remotes = await git.getRemotes(true);
        const origin = remotes.find((r: any) => r.name === 'origin');
        if (origin?.refs?.fetch) {
          info.remoteUrl = origin.refs.fetch;
          // Convert to GitHub URL if it's a git URL
          info.githubUrl = this.convertToGithubUrl(info.remoteUrl) || undefined;
        }
      } catch {
        // No remote configured
      }
    } catch {
      // Not a git repository or git not available
    }

    return info;
  }

  private static convertToGithubUrl(remoteUrl: string): string | undefined {
    if (!remoteUrl) return undefined;

    // Handle SSH format: git@github.com:user/repo.git
    if (remoteUrl.startsWith('git@github.com:')) {
      const path = remoteUrl.slice('git@github.com:'.length).replace(/\.git$/, '');
      return `https://github.com/${path}`;
    }

    // Handle HTTPS format: https://github.com/user/repo.git
    if (remoteUrl.startsWith('https://github.com/')) {
      return remoteUrl.replace(/\.git$/, '');
    }

    // Handle other Git hosting services
    const gitHostPatterns = [
      { pattern: /git@gitlab\.com:(.+)\.git/, replacement: 'https://gitlab.com/$1' },
      { pattern: /https:\/\/gitlab\.com\/(.+)\.git/, replacement: 'https://gitlab.com/$1' },
      { pattern: /git@bitbucket\.org:(.+)\.git/, replacement: 'https://bitbucket.org/$1' },
      { pattern: /https:\/\/bitbucket\.org\/(.+)\.git/, replacement: 'https://bitbucket.org/$1' },
    ];

    for (const { pattern, replacement } of gitHostPatterns) {
      const match = remoteUrl.match(pattern);
      if (match) {
        return remoteUrl.replace(pattern, replacement);
      }
    }

    return undefined;
  }
}