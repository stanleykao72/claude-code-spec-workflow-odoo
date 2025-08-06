import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { simpleGit, SimpleGit } from 'simple-git';
import { debug } from './logger';

const execAsync = promisify(exec);

export interface DiscoveredProject {
  path: string;
  name: string;
  hasActiveSession: boolean;
  lastActivity?: Date;
  specCount?: number;
  bugCount?: number;
  hasSteeringDocs?: boolean;
  gitBranch?: string;
  gitCommit?: string;
}

export class ProjectDiscovery {
  private searchPaths: string[] = [];

  constructor() {
    // Common project directories
    this.searchPaths = [
      join(homedir(), 'Projects'),
      join(homedir(), 'Documents'),
      join(homedir(), 'Development'),
      join(homedir(), 'Code'),
      join(homedir(), 'repos'),
      join(homedir(), 'workspace'),
      join(homedir(), 'src'),
    ];
  }

  async discoverProjects(): Promise<DiscoveredProject[]> {
    const projects: DiscoveredProject[] = [];
    const activeClaudes = await this.getActiveClaudeSessions();

    // Search for .claude directories
    for (const searchPath of this.searchPaths) {
      try {
        await fs.access(searchPath);
        const found = await this.searchDirectory(searchPath, activeClaudes);
        projects.push(...found);
      } catch {
        // Directory doesn't exist, skip it
      }
    }

    // Sort by last activity
    projects.sort((a, b) => {
      const dateA = a.lastActivity?.getTime() || 0;
      const dateB = b.lastActivity?.getTime() || 0;
      return dateB - dateA;
    });

    return projects;
  }

  private async searchDirectory(
    dir: string,
    activeSessions: string[],
    depth = 0
  ): Promise<DiscoveredProject[]> {
    if (depth > 4) return []; // Search up to 4 directories deep

    const projects: DiscoveredProject[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') && entry.name !== '.claude') continue;
        if (entry.name === 'node_modules' || entry.name === 'venv' || entry.name === '__pycache__')
          continue;

        const fullPath = join(dir, entry.name);

        // Check if this directory has a .claude folder
        const claudePath = join(fullPath, '.claude');
        try {
          const claudeStat = await fs.stat(claudePath);
          if (claudeStat.isDirectory()) {
            const project = await this.analyzeProject(fullPath, claudePath, activeSessions);
            projects.push(project);
          }
        } catch {
          // No .claude directory, check subdirectories
          if (depth < 4) {
            const subProjects = await this.searchDirectory(fullPath, activeSessions, depth + 1);
            projects.push(...subProjects);
          }
        }
      }
    } catch (error) {
      console.error(`Error searching directory ${dir}:`, error);
    }

    return projects;
  }

  private async analyzeProject(
    projectPath: string,
    claudePath: string,
    activeSessions: string[]
  ): Promise<DiscoveredProject> {
    debug(`Analyzing project: ${projectPath}`);
    const name = projectPath.split('/').pop() || 'Unknown';

    // Check if any active Claude session is in this project directory
    const hasActiveSession = activeSessions.some((session) => {
      // Normalize paths for comparison
      const normalizedSession = session.replace(/\/$/, '');
      const normalizedProject = projectPath.replace(/\/$/, '');
      const isMatch = normalizedSession === normalizedProject || normalizedSession.startsWith(normalizedProject + '/');
      if (isMatch) {
        debug(`Found active session match: ${session} matches ${projectPath}`);
      }
      return isMatch;
    });
    
    if (!hasActiveSession && name === 'beejax') {
      debug(`No active session found for beejax. Active sessions: ${activeSessions.join(', ')}, Project path: ${projectPath}`);
    }

    // Get git info (do this outside the try block so it always runs)
    const gitInfo = await this.getGitInfo(projectPath);

    // Get last activity by checking file modification times
    let lastActivity: Date | undefined;
    let specCount = 0;
    let bugCount = 0;
    
    try {
      const specsPath = join(claudePath, 'specs');
      const specDirs = await fs.readdir(specsPath);

      let mostRecent = 0;
      for (const specDir of specDirs) {
        if (specDir.startsWith('.')) continue;
        const specPath = join(specsPath, specDir);
        const stat = await fs.stat(specPath);
        if (stat.mtime.getTime() > mostRecent) {
          mostRecent = stat.mtime.getTime();
        }
      }

      if (mostRecent > 0) {
        lastActivity = new Date(mostRecent);
      }
      
      specCount = specDirs.filter((d) => !d.startsWith('.')).length;
    } catch {
      // Error reading specs directory, but continue with git info
      debug(`Could not read specs for ${projectPath}, but continuing with git info`);
    }

    // Count bugs
    try {
      const bugsPath = join(claudePath, 'bugs');
      const bugDirs = await fs.readdir(bugsPath);
      bugCount = bugDirs.filter((d) => !d.startsWith('.')).length;
      
      // Check bug modification times for last activity
      for (const bugDir of bugDirs) {
        if (bugDir.startsWith('.')) continue;
        const bugPath = join(bugsPath, bugDir);
        try {
          const stat = await fs.stat(bugPath);
          if (!lastActivity || stat.mtime > lastActivity) {
            lastActivity = stat.mtime;
          }
        } catch {
          // Error reading bug directory
        }
      }
    } catch {
      // No bugs directory or error reading it
      debug(`Could not read bugs for ${projectPath}`);
    }

    const result = {
      path: projectPath,
      name,
      hasActiveSession,
      lastActivity,
      specCount,
      bugCount,
      ...gitInfo,
    };
    
    debug(`Returning project ${name} with result:`, {
      hasGitInfo: !!(result.gitBranch || result.gitCommit),
      gitBranch: result.gitBranch,
      gitCommit: result.gitCommit
    });
    
    return result;
  }

  private async getActiveClaudeSessions(): Promise<string[]> {
    try {
      // Get Claude processes with their working directories
      const { stdout } = await execAsync(
        'ps aux | grep "claude" | grep -v grep | grep -v claude-code-spec'
      );
      const lines = stdout
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);

      // Try to get working directories for each Claude process
      const sessions: string[] = [];
      for (const line of lines) {
        const parts = line.split(/\s+/);
        const pid = parts[1];

        try {
          // On macOS, we can try to get the current working directory
          const { stdout: cwd } = await execAsync(`lsof -p ${pid} | grep cwd | awk '{print $NF}'`);
          if (cwd.trim()) {
            sessions.push(cwd.trim());
          }
        } catch {
          // Can't get CWD, that's okay
        }
      }

      debug(`Found ${sessions.length} active Claude sessions:`, sessions);
      return sessions;
    } catch {
      return [];
    }
  }

  private async getGitInfo(projectPath: string): Promise<{ gitBranch?: string; gitCommit?: string }> {
    debug(`Getting git info for: ${projectPath}`);
    try {
      const git: SimpleGit = simpleGit(projectPath);
      
      // Check if it's a git repository
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        debug(`${projectPath} is not a git repository`);
        return {};
      }
      
      // Get current branch
      const branchSummary = await git.branchLocal();
      const branch = branchSummary.current;
      
      // Get current commit hash (short version)
      const log = await git.log({ maxCount: 1 });
      const commit = log.latest?.hash.substring(0, 7);

      const gitInfo = {
        gitBranch: branch || undefined,
        gitCommit: commit || undefined,
      };
      
      if (gitInfo.gitBranch || gitInfo.gitCommit) {
        debug(`Git info for ${projectPath}: branch=${gitInfo.gitBranch}, commit=${gitInfo.gitCommit}`);
      }
      
      return gitInfo;
    } catch (error) {
      // Not a git repo or git command failed
      debug(`Failed to get git info for ${projectPath}:`, error instanceof Error ? error.message : String(error));
      return {};
    }
  }
}
