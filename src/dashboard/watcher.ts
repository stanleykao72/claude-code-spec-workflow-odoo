import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { join } from 'path';
import { SpecParser, Spec, Bug, SteeringStatus } from './parser';
import { simpleGit, SimpleGit } from 'simple-git';
import { debug } from './logger';

export interface SpecChangeEvent {
  type: 'added' | 'changed' | 'removed';
  spec: string;
  file: string;
  data?: Spec | null;
}

export interface BugChangeEvent {
  type: 'added' | 'changed' | 'removed';
  bug: string;
  file: string;
  data?: Bug | null;
}

export interface GitChangeEvent {
  type: 'branch-changed' | 'commit-changed';
  branch?: string;
  commit?: string;
}

export interface SteeringChangeEvent {
  type: 'added' | 'changed' | 'removed';
  file: string;
  steeringStatus?: SteeringStatus;
}

export class SpecWatcher extends EventEmitter {
  private watcher?: FSWatcher;
  private bugWatcher?: FSWatcher;
  private gitWatcher?: FSWatcher;
  private steeringWatcher?: FSWatcher;
  private projectPath: string;
  private parser: SpecParser;
  private git: SimpleGit;
  private lastBranch?: string;
  private lastCommit?: string;

  constructor(projectPath: string, parser: SpecParser) {
    super();
    this.projectPath = projectPath;
    this.parser = parser;
    this.git = simpleGit(projectPath);
  }

  async start() {
    const specsPath = join(this.projectPath, '.claude', 'specs');

    debug(`[Watcher] Starting to watch: ${specsPath}`);

    // Try to use FSEvents on macOS, fall back to polling if needed
    const isMacOS = process.platform === 'darwin';

    this.watcher = watch('.', {
      cwd: specsPath,
      ignored: /(^|[\\/])\.DS_Store/, // Only ignore .DS_Store
      persistent: true,
      ignoreInitial: true,
      // Use FSEvents on macOS if available, otherwise poll
      usePolling: !isMacOS,
      useFsEvents: isMacOS,
      // Polling fallback settings
      interval: isMacOS ? 100 : 1000,
      binaryInterval: 300,
      // Don't wait for write to finish - report changes immediately
      awaitWriteFinish: false,
      // Follow symlinks
      followSymlinks: true,
      // Emit all events
      ignorePermissionErrors: false,
      atomic: true,
    });

    this.watcher
      .on('add', (path) => {
        debug(`[Watcher] File added: ${path}`);
        this.handleFileChange('added', path);
      })
      .on('change', (path) => {
        debug(`[Watcher] File changed: ${path}`);
        this.handleFileChange('changed', path);
      })
      .on('unlink', (path) => {
        debug(`[Watcher] File removed: ${path}`);
        this.handleFileChange('removed', path);
      })
      .on('addDir', (path) => {
        debug(`[Watcher] Directory added: ${path}`);
        // When a new directory is added, we should check for .md files in it
        if (path) {
          // Check if this is a valid spec directory (top-level, alphanumeric with dashes)
          const parts = path.split(/[\/]/);
          if (parts.length === 1 && /^[a-z0-9-]+$/.test(parts[0])) {
            debug(`[Watcher] Valid spec directory detected: ${path}`);
            this.checkNewSpecDirectory(path);
          } else {
            debug(`[Watcher] Skipping non-spec directory: ${path}`);
          }
        }
      })
      .on('unlinkDir', (path) => {
        debug(`[Watcher] Directory removed: ${path}`);
        // Emit a remove event for the spec
        if (path) {
          // Check if this is a valid spec directory (top-level, alphanumeric with dashes)
          const parts = path.split(/[\/]/);
          if (parts.length === 1 && /^[a-z0-9-]+$/.test(parts[0])) {
            debug(`[Watcher] Valid spec directory removal detected: ${path}`);
            this.emit('change', {
              type: 'removed',
              spec: path,
              file: 'directory',
              data: null,
            } as SpecChangeEvent);
          } else {
            debug(`[Watcher] Skipping non-spec directory removal: ${path}`);
          }
        }
      })
      .on('ready', () => debug('[Watcher] Initial scan complete. Ready for changes.'))
      .on('error', (error) => console.error('[Watcher] Error:', error));

    // Start watching bugs directory
    const bugsPath = join(this.projectPath, '.claude', 'bugs');
    debug(`[BugWatcher] Starting to watch: ${bugsPath}`);

    this.bugWatcher = watch('.', {
      cwd: bugsPath,
      ignored: /(^|[\\/])\.DS_Store/,
      persistent: true,
      ignoreInitial: true,
      usePolling: !isMacOS,
      useFsEvents: isMacOS,
      interval: isMacOS ? 100 : 1000,
      binaryInterval: 300,
      awaitWriteFinish: false,
      followSymlinks: true,
      ignorePermissionErrors: false,
      atomic: true,
    });

    this.bugWatcher
      .on('add', (path) => {
        debug(`[BugWatcher] File added: ${path}`);
        this.handleBugFileChange('added', path);
      })
      .on('change', (path) => {
        debug(`[BugWatcher] File changed: ${path}`);
        this.handleBugFileChange('changed', path);
      })
      .on('unlink', (path) => {
        debug(`[BugWatcher] File removed: ${path}`);
        this.handleBugFileChange('removed', path);
      })
      .on('addDir', (path) => {
        debug(`[BugWatcher] Directory added: ${path}`);
        if (path) {
          // Check if this is a valid bug directory (top-level, alphanumeric with dashes)
          const parts = path.split(/[\/]/);
          if (parts.length === 1 && /^[a-z0-9-]+$/.test(parts[0])) {
            debug(`[BugWatcher] Valid bug directory detected: ${path}`);
            this.checkNewBugDirectory(path);
          } else {
            debug(`[BugWatcher] Skipping non-bug directory: ${path}`);
          }
        }
      })
      .on('unlinkDir', (path) => {
        debug(`[BugWatcher] Directory removed: ${path}`);
        if (path) {
          // Check if this is a valid bug directory (top-level, alphanumeric with dashes)
          const parts = path.split(/[\/]/);
          if (parts.length === 1 && /^[a-z0-9-]+$/.test(parts[0])) {
            debug(`[BugWatcher] Valid bug directory removal detected: ${path}`);
            this.emit('bug-change', {
              type: 'removed',
              bug: path,
              file: 'directory',
            } as BugChangeEvent);
          } else {
            debug(`[BugWatcher] Skipping non-bug directory removal: ${path}`);
          }
        }
      })
      .on('ready', () => debug('[BugWatcher] Initial scan complete. Ready for changes.'))
      .on('error', (error) => {
        // Don't log error if bugs directory doesn't exist yet
        if (!error.message.includes('ENOENT')) {
          console.error('[BugWatcher] Error:', error);
        }
      });

    // Start watching git files
    await this.startGitWatcher();
    
    // Start watching steering documents
    await this.startSteeringWatcher();
  }

  private async startGitWatcher() {
    const gitPath = join(this.projectPath, '.git');
    
    // Check if it's a git repository
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        debug(`[GitWatcher] ${this.projectPath} is not a git repository`);
        return;
      }
    } catch {
      debug(`[GitWatcher] Could not check git status for ${this.projectPath}`);
      return;
    }

    // Get initial git state
    try {
      const branchSummary = await this.git.branchLocal();
      this.lastBranch = branchSummary.current;
      
      const log = await this.git.log({ maxCount: 1 });
      this.lastCommit = log.latest?.hash.substring(0, 7);
      
      debug(`[GitWatcher] Initial state - branch: ${this.lastBranch}, commit: ${this.lastCommit}`);
    } catch (error) {
      console.error('[GitWatcher] Error getting initial state:', error);
    }

    // Watch specific git files that indicate changes
    this.gitWatcher = watch(['HEAD', 'logs/HEAD', 'refs/heads/**'], {
      cwd: gitPath,
      persistent: true,
      ignoreInitial: true,
      usePolling: false,
      useFsEvents: process.platform === 'darwin',
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.gitWatcher
      .on('change', async (path) => {
        debug(`[GitWatcher] Git file changed: ${path}`);
        await this.checkGitChanges();
      })
      .on('add', async (path) => {
        debug(`[GitWatcher] Git file added: ${path}`);
        await this.checkGitChanges();
      });
  }

  private async startSteeringWatcher() {
    const steeringPath = join(this.projectPath, '.claude', 'steering');
    
    debug(`[SteeringWatcher] Starting to watch: ${steeringPath}`);

    // Try to use FSEvents on macOS, fall back to polling if needed
    const isMacOS = process.platform === 'darwin';

    this.steeringWatcher = watch(['product.md', 'tech.md', 'structure.md'], {
      cwd: steeringPath,
      persistent: true,
      ignoreInitial: true,
      // Use FSEvents on macOS if available, otherwise poll
      usePolling: !isMacOS,
      useFsEvents: isMacOS,
      // Polling fallback settings
      interval: isMacOS ? 100 : 1000,
      binaryInterval: 300,
      // Don't wait for write to finish - report changes immediately
      awaitWriteFinish: false,
      // Follow symlinks
      followSymlinks: true,
      // Emit all events
      ignorePermissionErrors: true, // Don't fail if steering directory doesn't exist yet
      atomic: true,
    });

    this.steeringWatcher
      .on('add', (path) => {
        debug(`[SteeringWatcher] File added: ${path}`);
        this.handleSteeringChange('added', path);
      })
      .on('change', (path) => {
        debug(`[SteeringWatcher] File changed: ${path}`);
        this.handleSteeringChange('changed', path);
      })
      .on('unlink', (path) => {
        debug(`[SteeringWatcher] File removed: ${path}`);
        this.handleSteeringChange('removed', path);
      })
      .on('ready', () => debug('[SteeringWatcher] Initial scan complete. Ready for changes.'))
      .on('error', (error) => {
        // Don't log error if steering directory doesn't exist yet
        if (!error.message.includes('ENOENT')) {
          console.error('[SteeringWatcher] Error:', error);
        }
      });
  }

  private async checkGitChanges() {
    try {
      const branchSummary = await this.git.branchLocal();
      const currentBranch = branchSummary.current;
      
      const log = await this.git.log({ maxCount: 1 });
      const currentCommit = log.latest?.hash.substring(0, 7);

      let changed = false;
      const event: GitChangeEvent = {
        type: 'branch-changed',
        branch: currentBranch,
        commit: currentCommit
      };

      if (currentBranch !== this.lastBranch) {
        debug(`[GitWatcher] Branch changed from ${this.lastBranch} to ${currentBranch}`);
        this.lastBranch = currentBranch;
        changed = true;
        event.type = 'branch-changed';
      }

      if (currentCommit !== this.lastCommit) {
        debug(`[GitWatcher] Commit changed from ${this.lastCommit} to ${currentCommit}`);
        this.lastCommit = currentCommit;
        changed = true;
        event.type = 'commit-changed';
      }

      if (changed) {
        this.emit('git-change', event);
      }
    } catch (error) {
      console.error('[GitWatcher] Error checking git changes:', error);
    }
  }

  private async handleSteeringChange(type: 'added' | 'changed' | 'removed', fileName: string) {
    debug(`Steering change detected: ${type} - ${fileName}`);
    
    // Get updated steering status
    const steeringStatus = await this.parser.getProjectSteeringStatus();
    
    this.emit('steering-change', {
      type,
      file: fileName,
      steeringStatus,
    } as SteeringChangeEvent);
  }

  private async handleFileChange(type: 'added' | 'changed' | 'removed', filePath: string) {
    debug(`File change detected: ${type} - ${filePath}`);
    const parts = filePath.split(/[\\/]/);
    const specName = parts[0];

    if (parts.length === 2 && parts[1].match(/^(requirements|design|tasks)\.md$/)) {
      // Add a small delay to ensure file write is complete
      if (type === 'changed') {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const spec = await this.parser.getSpec(specName);
      debug(`Emitting change for spec: ${specName}, file: ${parts[1]}`);

      // Log approval status for debugging
      if (spec) {
        if (parts[1] === 'requirements.md' && spec.requirements) {
          debug(`Requirements approved: ${spec.requirements.approved}`);
        } else if (parts[1] === 'design.md' && spec.design) {
          debug(`Design approved: ${spec.design.approved}`);
        } else if (parts[1] === 'tasks.md' && spec.tasks) {
          debug(`Tasks approved: ${spec.tasks.approved}`);
        }
      }

      this.emit('change', {
        type,
        spec: specName,
        file: parts[1],
        data: spec,
      } as SpecChangeEvent);
    }
  }

  private async checkNewSpecDirectory(dirPath: string) {
    // When a new directory is created, check for any .md files already in it
    const specName = dirPath;
    const spec = await this.parser.getSpec(specName);

    if (spec) {
      debug(`Found spec in new directory: ${specName}`);
      this.emit('change', {
        type: 'added',
        spec: specName,
        file: 'directory',
        data: spec,
      } as SpecChangeEvent);
    }
  }

  private async handleBugFileChange(type: 'added' | 'changed' | 'removed', filePath: string) {
    debug(`Bug file change detected: ${type} - ${filePath}`);
    const parts = filePath.split(/[\\/]/);
    const bugName = parts[0];

    if (parts.length === 2 && parts[1].match(/^(report|analysis|verification)\.md$/)) {
      // Add a small delay to ensure file write is complete
      if (type === 'changed') {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const bug = await this.parser.getBug(bugName);
      debug(`Emitting change for bug: ${bugName}, file: ${parts[1]}`);

      this.emit('bug-change', {
        type,
        bug: bugName,
        file: parts[1],
        data: type !== 'removed' ? bug : null,
      } as BugChangeEvent);
    }
  }

  private async checkNewBugDirectory(dirPath: string) {
    // When a new directory is created, check for any .md files already in it
    const bugName = dirPath;
    const bug = await this.parser.getBug(bugName);
    
    if (bug) {
      debug(`Found bug in new directory: ${bugName}`);
      this.emit('bug-change', {
        type: 'added',
        bug: bugName,
        file: 'directory',
        data: bug,
      } as BugChangeEvent);
    }
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
    }
    if (this.bugWatcher) {
      await this.bugWatcher.close();
    }
    if (this.gitWatcher) {
      await this.gitWatcher.close();
    }
    if (this.steeringWatcher) {
      await this.steeringWatcher.close();
    }
  }
}
