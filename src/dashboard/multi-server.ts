import fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join, resolve, normalize } from 'path';
import { readFile } from 'fs/promises';
import { SpecWatcher } from './watcher';
import { SpecParser, Task } from './parser';
import { ProjectDiscovery, DiscoveredProject } from './project-discovery';
import open from 'open';
import { WebSocket } from 'ws';
import { userInfo } from 'os';
import { isPortAvailable, findAvailablePort } from '../utils';
import { debug } from './logger';
import { TunnelManager, TunnelOptions, TunnelProviderError } from './tunnel';
import { CloudflareProvider } from './tunnel/cloudflare-provider-native';
import { NgrokProvider } from './tunnel/ngrok-provider-native';

interface ProjectState {
  project: DiscoveredProject;
  parser: SpecParser;
  watcher: SpecWatcher;
}

interface WebSocketConnection {
  socket: WebSocket;
}

interface ActiveTask {
  projectPath: string;
  projectName: string;
  specName: string;
  specDisplayName: string;
  task: Task;
  isCurrentlyActive: boolean;
  hasActiveSession: boolean;
  gitBranch?: string;
  gitCommit?: string;
}

// Discriminated union for type-safe active sessions
type ActiveSession = ActiveSpecSession | ActiveBugSession;

interface BaseActiveSession {
  projectPath: string;
  projectName: string;
  displayName: string;
  lastModified: Date;
  isCurrentlyActive: boolean;
  hasActiveSession: boolean;
  gitBranch?: string;
  gitCommit?: string;
}

interface ActiveSpecSession extends BaseActiveSession {
  type: 'spec';
  specName: string;
  task: Task;
}

interface ActiveBugSession extends BaseActiveSession {
  type: 'bug';
  bugName: string;
  bugStatus: 'analyzing' | 'fixing' | 'verifying';
  bugSeverity?: 'critical' | 'high' | 'medium' | 'low';
  nextCommand: string;  // e.g., '/bug-fix bug-name'
}

export interface MultiDashboardOptions {
  port: number;
  autoOpen?: boolean;
  tunnel?: boolean;
  tunnelPassword?: string;
  tunnelProvider?: string;
}

export class MultiProjectDashboardServer {
  private app: FastifyInstance;
  private options: MultiDashboardOptions;
  private clients: Set<WebSocket> = new Set();
  private projects: Map<string, ProjectState> = new Map();
  private discovery: ProjectDiscovery;
  private rescanInterval?: ReturnType<typeof setInterval>;
  private tunnelManager?: TunnelManager;

  constructor(options: MultiDashboardOptions) {
    this.options = options;
    this.discovery = new ProjectDiscovery();
    this.app = fastify({ logger: false });
  }

  async start() {
    // Discover projects
    console.log('Starting project discovery...');
    const discoveredProjects = await this.discovery.discoverProjects();

    // Filter to show projects with specs OR active Claude sessions
    const activeProjects = discoveredProjects.filter(
      (p) => (p.specCount || 0) > 0 || p.hasActiveSession
    );
    console.log(`Found ${activeProjects.map(p => p.name).join(', ')}`);

    // Initialize watchers for each project
    for (const project of activeProjects) {
      debug(`Initializing project ${project.name}`);
      await this.initializeProject(project);
    }

    // Register plugins
    await this.app.register(fastifyStatic, {
      root: join(__dirname, 'public'),
      prefix: '/public/',
    });

    // Serve multi.html as the main page
    this.app.get('/', async (request, reply) => {
      return reply.sendFile('multi.html', join(__dirname, 'public'));
    });

    await this.app.register(fastifyWebsocket);

    // WebSocket endpoint
    const self = this;
    this.app.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection: WebSocketConnection) => {
        const socket = connection.socket;
        debug('Multi-project WebSocket client connected');

        self.clients.add(socket);

        // Send initial state with all projects
        self.sendInitialState(socket);

        socket.on('close', () => {
          self.clients.delete(socket);
        });

        socket.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          self.clients.delete(socket);
        });
      });
    });

    // API endpoints
    this.app.get('/api/projects', async () => {
      const projectList = Array.from(this.projects.values()).map((p) => ({
        ...p.project,
        specs: [], // Don't include specs in list
      }));
      return projectList;
    });

    this.app.get('/api/projects/:projectPath/specs', async (request, reply) => {
      const { projectPath } = request.params as { projectPath: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const specs = await projectState.parser.getAllSpecs();
      return specs;
    });

    this.app.get('/api/projects/:projectPath/bugs', async (request, reply) => {
      const { projectPath } = request.params as { projectPath: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const bugs = await projectState.parser.getAllBugs();
      return bugs;
    });

    // Get raw markdown content for a specific document
    this.app.get('/api/projects/:projectPath/specs/:name/:document', async (request, reply) => {
      const { projectPath, name, document } = request.params as { projectPath: string; name: string; document: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const allowedDocs = ['requirements', 'design', 'tasks'];
      if (!allowedDocs.includes(document)) {
        reply.code(400).send({ error: 'Invalid document type' });
        return;
      }

      const docPath = join(decodedPath, '.claude', 'specs', name, `${document}.md`);
      
      try {
        const content = await readFile(docPath, 'utf-8');
        return { content };
      } catch {
        reply.code(404).send({ error: 'Document not found' });
      }
    });

    // Get raw markdown content for bug documents
    this.app.get('/api/projects/:projectPath/bugs/:name/:document', async (request, reply) => {
      const { projectPath, name, document } = request.params as { projectPath: string; name: string; document: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const allowedDocs = ['report', 'analysis', 'fix', 'verification'];
      if (!allowedDocs.includes(document)) {
        reply.code(400).send({ error: 'Invalid document type' });
        return;
      }

      const docPath = join(decodedPath, '.claude', 'bugs', name, `${document}.md`);
      
      try {
        const content = await readFile(docPath, 'utf-8');
        return { content };
      } catch {
        reply.code(404).send({ error: 'Document not found' });
      }
    });

    // Find available port if the requested port is busy
    let actualPort = this.options.port;
    if (!(await isPortAvailable(this.options.port))) {
      console.log(`Port ${this.options.port} is in use, finding alternative...`);
      actualPort = await findAvailablePort(this.options.port);
      console.log(`Using port ${actualPort} instead`);
    }

    // Start server
    await this.app.listen({ port: actualPort, host: '0.0.0.0' });
    
    // Update the port in options for URL generation
    this.options.port = actualPort;

    // Initialize tunnel if requested
    if (this.options.tunnel) {
      await this.initializeTunnel();
    }

    // Start periodic rescan for new active projects
    // Disabled: We now use file watching instead of polling
    // this.startPeriodicRescan();

    // Open browser if requested
    if (this.options.autoOpen) {
      const url = this.tunnelManager ? 
        (await this.tunnelManager.getStatus()).info?.url : 
        `http://localhost:${this.options.port}`;
      await open(url || `http://localhost:${this.options.port}`);
    }
  }

  private async initializeProject(project: DiscoveredProject) {
    // Normalize and resolve the project path to handle different path formats
    const normalizedPath = normalize(resolve(project.path));
    project.path = normalizedPath; // Update the project path with normalized version
    
    const parser = new SpecParser(normalizedPath);
    const watcher = new SpecWatcher(normalizedPath, parser);

    // Set up watcher events
    watcher.on('change', async (event) => {
      // Transform the watcher event into the format expected by the client
      const projectUpdateEvent = {
        type: 'spec-update',
        spec: event.spec,
        file: event.file,
        data: event.data,
      };
      
      // Broadcast update with project context
      const message = JSON.stringify({
        type: 'project-update',
        projectPath: project.path,
        data: projectUpdateEvent,
      });

      debug(`[Multi-server] Sending spec update for ${project.name}/${event.spec} to ${this.clients.size} clients`);
      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });

      // Also send updated active tasks
      const activeTasks = await this.collectActiveSessions();
      debug(`[Multi-server] Collected ${activeTasks.length} active tasks after spec update`);
      const activeTasksMessage = JSON.stringify({
        type: 'active-tasks-update',
        data: activeTasks,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(activeTasksMessage);
        }
      });
    });

    // Handle git change events
    watcher.on('git-change', async (event) => {
      debug(`[Multi-server] Git change detected for ${project.name}:`, event);
      
      // Update the project's git info
      if (event.branch) {
        project.gitBranch = event.branch;
      }
      if (event.commit) {
        project.gitCommit = event.commit;
      }

      // Send git update to all clients
      const message = JSON.stringify({
        type: 'git-update',
        projectPath: project.path,
        gitBranch: project.gitBranch,
        gitCommit: project.gitCommit,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    });

    // Handle steering change events
    watcher.on('steering-change', async (event) => {
      debug(`[Multi-server] Steering change detected for ${project.name}:`, event);
      
      // Send steering update to all clients
      const message = JSON.stringify({
        type: 'steering-update',
        projectPath: project.path,
        data: event.steeringStatus,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    });

    // Handle bug change events
    watcher.on('bug-change', async (event) => {
      debug(`[Multi-server] Bug change detected for ${project.name}:`, event);
      
      // Send bug update to all clients
      const message = JSON.stringify({
        type: 'bug-update',
        projectPath: project.path,
        data: event,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    });

    await watcher.start();

    this.projects.set(project.path, {
      project,
      parser,
      watcher,
    });
  }

  private async sendInitialState(socket: WebSocket) {
    const projects = await Promise.all(
      Array.from(this.projects.entries()).map(async ([, state]) => {
        const specs = await state.parser.getAllSpecs();
        const bugs = await state.parser.getAllBugs();
        const steeringStatus = await state.parser.getProjectSteeringStatus();
        const projectData = {
          ...state.project,
          specs,
          bugs,
          steering: steeringStatus,
        };
        debug(`Sending project ${projectData.name}`);
        return projectData;
      })
    );

    // Collect all active tasks across projects
    const activeTasks = await this.collectActiveSessions();

    socket.send(
      JSON.stringify({
        type: 'initial',
        data: projects,
        activeTasks,
        username: this.getUsername(),
      })
    );
  }

  private async collectActiveSessions(): Promise<ActiveSession[]> {
    const activeSessions: ActiveSession[] = [];

    for (const [projectPath, state] of this.projects) {
      const specs = await state.parser.getAllSpecs();
      debug(`[collectActiveSessions] Project ${state.project.name}: ${specs.length} specs`);

      let hasActiveTaskInProject = false;
      
      for (const spec of specs) {
        if (spec.tasks && spec.tasks.taskList.length > 0) {
          debug(`[collectActiveSessions] Spec ${spec.name}: ${spec.tasks.taskList.length} tasks, inProgress: ${spec.tasks.inProgress}`);
          if (spec.tasks.inProgress) {
            // Only get the currently active task (marked as in progress)
            const activeTask = this.findTaskById(spec.tasks.taskList, spec.tasks.inProgress);

            if (activeTask) {
              hasActiveTaskInProject = true;
              activeSessions.push({
              type: 'spec',
              projectPath,
              projectName: state.project.name,
              displayName: spec.displayName || spec.name,
              specName: spec.name,
              task: activeTask,
              lastModified: spec.lastModified || new Date(),
              isCurrentlyActive: true,
              hasActiveSession: true,
              gitBranch: state.project.gitBranch,
              gitCommit: state.project.gitCommit,
            } as ActiveSpecSession);
            }
          }
        }
      }

      // Collect active bugs
      const bugs = await state.parser.getAllBugs();
      debug(`[collectActiveSessions] Project ${state.project.name}: ${bugs.length} bugs`);

      for (const bug of bugs) {
        // Check if bug is in an active state
        if (['analyzing', 'fixing', 'verifying'].includes(bug.status)) {
          debug(`[collectActiveSessions] Bug ${bug.name}: status ${bug.status}`);
          hasActiveTaskInProject = true;

          // Determine the next command based on bug status
          let nextCommand = '';
          switch (bug.status) {
            case 'analyzing':
              nextCommand = `/bug-analyze ${bug.name}`;
              break;
            case 'fixing':
              nextCommand = `/bug-fix ${bug.name}`;
              break;
            case 'verifying':
              nextCommand = `/bug-verify ${bug.name}`;
              break;
          }

          activeSessions.push({
            type: 'bug',
            projectPath,
            projectName: state.project.name,
            displayName: bug.displayName || bug.name,
            bugName: bug.name,
            bugStatus: bug.status as 'analyzing' | 'fixing' | 'verifying',
            bugSeverity: bug.report?.severity,
            nextCommand,
            lastModified: bug.lastModified || new Date(),
            isCurrentlyActive: true,
            hasActiveSession: true,
            gitBranch: state.project.gitBranch,
            gitCommit: state.project.gitCommit,
          } as ActiveBugSession);
        }
      }
      
      // Update the project's active session status based on whether it has active tasks
      if (state.project.hasActiveSession !== hasActiveTaskInProject) {
        state.project.hasActiveSession = hasActiveTaskInProject;
        
        // Send status update to clients
        const statusUpdate = {
          type: 'project-update',
          projectPath,
          data: {
            type: 'status-update',
            data: {
              hasActiveSession: hasActiveTaskInProject,
              lastActivity: new Date(),
              isClaudeActive: hasActiveTaskInProject
            }
          }
        };
        
        this.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(statusUpdate));
          }
        });
      }
    }

    // Sort by currently active first, then by project name
    activeSessions.sort((a, b) => {
      if (a.isCurrentlyActive && !b.isCurrentlyActive) return -1;
      if (!a.isCurrentlyActive && b.isCurrentlyActive) return 1;
      return a.projectName.localeCompare(b.projectName);
    });

    debug(`[collectActiveSessions] Total active sessions found: ${activeSessions.length}`);
    return activeSessions;
  }

  private findTaskById(tasks: Task[], taskId: string): Task | null {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }

      if (task.subtasks) {
        const found = this.findTaskById(task.subtasks, taskId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  private startPeriodicRescan() {
    // Rescan every 30 seconds for new active projects
    this.rescanInterval = setInterval(async () => {
      const currentProjects = await this.discovery.discoverProjects();
      const activeProjects = currentProjects.filter(
        (p) => (p.specCount || 0) > 0 || p.hasActiveSession
      );

      // Check for new projects
      for (const project of activeProjects) {
        if (!this.projects.has(project.path)) {
          debug(`New active project detected: ${project.name}`);
          await this.initializeProject(project);

          // Notify all clients about the new project
          const parser = this.projects.get(project.path)?.parser;
          const specs = (await parser?.getAllSpecs()) || [];
          const bugs = (await parser?.getAllBugs()) || [];
          const projectData = { ...project, specs, bugs };

          const message = JSON.stringify({
            type: 'new-project',
            data: projectData,
          });

          this.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(message);
            }
          });
        }
      }

      // Check for projects that are no longer active
      for (const [path, state] of this.projects) {
        const stillActive = activeProjects.some((p) => p.path === path);
        if (!stillActive) {
          const hasSpecs = (await state.parser.getAllSpecs()).length > 0;
          const currentProject = activeProjects.find((p) => p.path === path);
          const hasActiveSession = currentProject?.hasActiveSession || false;

          if (!hasSpecs && !hasActiveSession) {
            debug(`Project no longer active: ${state.project.name}`);
            await state.watcher.stop();
            this.projects.delete(path);

            // Notify clients to remove the project
            const message = JSON.stringify({
              type: 'remove-project',
              data: { path },
            });

            this.clients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(message);
              }
            });
          }
        }
      }
    }, 30000); // 30 seconds
  }

  async stop() {
    // Stop the rescan interval
    if (this.rescanInterval) {
      clearInterval(this.rescanInterval);
    }

    // Stop all watchers
    for (const [, state] of this.projects) {
      await state.watcher.stop();
    }

    // Stop the tunnel if active
    if (this.tunnelManager) {
      await this.tunnelManager.stopTunnel();
    }

    // Close all WebSocket connections
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.close();
      }
    });
    this.clients.clear();

    // Close the server
    await this.app.close();
  }

  private async initializeTunnel() {
    // Initialize tunnel manager
    this.tunnelManager = new TunnelManager(this.app);
    
    // Register providers
    this.tunnelManager.registerProvider(new CloudflareProvider());
    this.tunnelManager.registerProvider(new NgrokProvider());
    
    // Start tunnel with options
    const tunnelOptions: TunnelOptions = {
      provider: this.options.tunnelProvider,
      password: this.options.tunnelPassword,
      analytics: true
    };
    
    try {
      const tunnelInfo = await this.tunnelManager.startTunnel(tunnelOptions);
      debug('Tunnel created:', tunnelInfo);
      
      // Broadcast tunnel status to all connected clients
      this.broadcast({
        type: 'tunnel:started',
        data: tunnelInfo
      });
    } catch (error) {
      if (error instanceof TunnelProviderError) {
        console.error('Tunnel setup failed:', error.getUserFriendlyMessage());
      } else {
        console.error('Failed to create tunnel:', error);
      }
      throw error;
    }
  }

  getTunnelStatus() {
    return this.tunnelManager?.getStatus() || { active: false };
  }

  private broadcast(message: { type: string; data: unknown }) {
    const jsonMessage = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(jsonMessage);
      }
    });
  }

  private getUsername(): string {
    try {
      const info = userInfo();
      // Try to get the full name first, fall back to username
      const username = info.username || 'User';
      // Capitalize first letter
      return username.charAt(0).toUpperCase() + username.slice(1);
    } catch {
      return 'User';
    }
  }
}
