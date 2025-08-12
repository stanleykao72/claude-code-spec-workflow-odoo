import fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { SpecWatcher } from './watcher';
import { SpecParser } from './parser';
import open from 'open';
import { WebSocket } from 'ws';
import { isPortAvailable, findAvailablePort } from '../utils';
import { GitUtils } from '../git';
import { debug } from './logger';
import { TunnelManager, TunnelOptions, TunnelProviderError } from './tunnel';
import { CloudflareProvider } from './tunnel/cloudflare-provider-native';
import { NgrokProvider } from './tunnel/ngrok-provider-native';

interface WebSocketConnection {
  socket: WebSocket;
}

export interface DashboardOptions {
  port: number;
  projectPath: string;
  autoOpen?: boolean;
  tunnel?: boolean;
  tunnelPassword?: string;
  tunnelProvider?: string;
}

export class DashboardServer {
  private app: FastifyInstance;
  private watcher: SpecWatcher;
  private parser: SpecParser;
  private options: DashboardOptions;
  private clients: Set<WebSocket> = new Set();
  private tunnelManager?: TunnelManager;

  constructor(options: DashboardOptions) {
    this.options = options;
    this.parser = new SpecParser(options.projectPath);
    this.watcher = new SpecWatcher(options.projectPath, this.parser);

    this.app = fastify({ logger: false });
  }

  async start() {
    // Register plugins
    await this.app.register(fastifyStatic, {
      root: join(__dirname, 'public'),
      prefix: '/public/',
    });

    await this.app.register(fastifyWebsocket);

    // Serve multi-project dashboard as default route
    this.app.get('/', async (request, reply) => {
      return reply.sendFile('index.html', join(__dirname, 'public'));
    });

    // Catch-all route for client-side routing - serve multi-project dashboard for any non-API route
    this.app.get('/*', async (request, reply) => {
      // Skip API routes and static files
      if (request.url.startsWith('/api/') || request.url.startsWith('/public/') || request.url.startsWith('/ws')) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html', join(__dirname, 'public'));
    });

    // WebSocket endpoint for real-time updates (multi-project compatible)
    const self = this;
    this.app.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection: WebSocketConnection) => {
        const socket = connection.socket;
        debug('WebSocket client connected');

        // Add client to set
        self.clients.add(socket);

        // Send initial state
        Promise.all([
          self.parser.getAllSpecs(),
          self.parser.getAllBugs()
        ])
          .then(([specs, bugs]) => {
            const tunnelStatus = self.getTunnelStatus();
            socket.send(
              JSON.stringify({
                type: 'initial',
                data: { specs, bugs, tunnelStatus },
              })
            );
          })
          .catch((error) => {
            console.error('Error getting initial data:', error);
          });

        // Handle client disconnect
        socket.on('close', () => {
          self.clients.delete(socket);
        });

        socket.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          self.clients.delete(socket);
        });
      });
    });

    // Serve Claude icon as favicon
    this.app.get('/favicon.ico', async (request, reply) => {
      return reply.sendFile('claude-icon.svg');
    });

    // API endpoints
    this.app.get('/api/test', async () => {
      return { message: 'Test endpoint works!' };
    });

    this.app.get('/api/specs', async () => {
      const specs = await this.parser.getAllSpecs();
      return specs;
    });

    this.app.get('/api/bugs', async () => {
      const bugs = await this.parser.getAllBugs();
      return bugs;
    });

    this.app.get('/api/info', async () => {
      const projectName = this.options.projectPath.split('/').pop() || 'Project';
      const gitInfo = await GitUtils.getGitInfo(this.options.projectPath);
      const steeringStatus = await this.parser.getProjectSteeringStatus();
      return { 
        projectName,
        steering: steeringStatus,
        ...gitInfo
      };
    });

    this.app.get('/api/specs/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      const spec = await this.parser.getSpec(name);
      if (!spec) {
        reply.code(404).send({ error: 'Spec not found' });
      }
      return spec;
    });

    this.app.get('/api/bugs/:name', async (request, reply) => {
      const { name } = request.params as { name: string };
      const bug = await this.parser.getBug(name);
      if (!bug) {
        reply.code(404).send({ error: 'Bug not found' });
      }
      return bug;
    });

    // Get raw markdown content
    this.app.get('/api/specs/:name/:document', async (request, reply) => {
      const { name, document } = request.params as { name: string; document: string };
      const allowedDocs = ['requirements', 'design', 'tasks'];
      
      if (!allowedDocs.includes(document)) {
        reply.code(400).send({ error: 'Invalid document type' });
        return;
      }
      
      const docPath = join(this.options.projectPath, '.claude', 'specs', name, `${document}.md`);
      
      try {
        const content = await readFile(docPath, 'utf-8');
        return { content };
      } catch {
        reply.code(404).send({ error: 'Document not found' });
      }
    });

    // Get raw bug markdown content
    this.app.get('/api/bugs/:name/:document', async (request, reply) => {
      const { name, document } = request.params as { name: string; document: string };
      const allowedDocs = ['report', 'analysis', 'fix', 'verification'];
      
      if (!allowedDocs.includes(document)) {
        reply.code(400).send({ error: 'Invalid document type' });
        return;
      }
      
      const docPath = join(this.options.projectPath, '.claude', 'bugs', name, `${document}.md`);
      
      try {
        const content = await readFile(docPath, 'utf-8');
        return { content };
      } catch {
        reply.code(404).send({ error: 'Document not found' });
      }
    });

    // Tunnel API endpoints
    this.app.get('/api/tunnel/status', async () => {
      const status = this.getTunnelStatus();
      return status;
    });

    this.app.post('/api/tunnel/stop', async (request, reply) => {
      if (!this.tunnelManager) {
        reply.code(404).send({ error: 'No tunnel manager available' });
        return;
      }
      
      try {
        await this.tunnelManager.stopTunnel();
        
        // Broadcast tunnel stopped event
        this.broadcast({
          type: 'tunnel:stopped',
          data: {}
        });
        
        return { success: true };
      } catch (error) {
        console.error('Error stopping tunnel:', error);
        reply.code(500).send({ error: 'Failed to stop tunnel' });
      }
    });

    // Set up file watcher
    this.watcher.on('change', (event) => {
      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'update',
        data: event,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(message);
        }
      });
    });

    // Set up bug change watcher
    this.watcher.on('bug-change', (event) => {
      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'bug-update',
        data: event,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(message);
        }
      });
    });

    // Set up steering change watcher
    this.watcher.on('steering-change', (event) => {
      // Broadcast steering updates to all connected clients
      const message = JSON.stringify({
        type: 'steering-update',
        data: event.steeringStatus,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(message);
        }
      });
    });

    // Start watcher
    await this.watcher.start();

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

    // Open browser if requested (always use localhost for local user)
    if (this.options.autoOpen) {
      await open(`http://localhost:${this.options.port}`);
    }
  }

  async stop() {
    // Close all WebSocket connections
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.close();
      }
    });
    this.clients.clear();

    // Stop the tunnel if active
    if (this.tunnelManager) {
      await this.tunnelManager.stopTunnel();
    }

    // Stop the watcher
    await this.watcher.stop();

    // Close the Fastify server
    await this.app.close();
  }

  private async initializeTunnel() {
    // Initialize tunnel manager
    this.tunnelManager = new TunnelManager(this.app);
    
    // Register providers
    this.tunnelManager.registerProvider(new CloudflareProvider());
    this.tunnelManager.registerProvider(new NgrokProvider());
    
    // Listen for tunnel events
    this.tunnelManager.on('tunnel:started', (tunnelInfo) => {
      debug('Tunnel started event:', tunnelInfo);
      this.broadcast({
        type: 'tunnel:started',
        data: tunnelInfo
      });
    });
    
    this.tunnelManager.on('tunnel:stopped', (data) => {
      debug('Tunnel stopped event:', data);
      this.broadcast({
        type: 'tunnel:stopped',
        data: data || {}
      });
    });
    
    this.tunnelManager.on('tunnel:metrics:updated', (metrics) => {
      debug('Tunnel metrics updated:', metrics);
      this.broadcast({
        type: 'tunnel:metrics:updated',
        data: metrics
      });
    });
    
    this.tunnelManager.on('tunnel:visitor:new', (visitor) => {
      debug('New tunnel visitor:', visitor);
      this.broadcast({
        type: 'tunnel:visitor:new',
        data: visitor
      });
    });
    
    // Start tunnel with options
    const tunnelOptions: TunnelOptions = {
      provider: this.options.tunnelProvider,
      password: this.options.tunnelPassword,
      analytics: true
    };
    
    try {
      const tunnelInfo = await this.tunnelManager.startTunnel(tunnelOptions);
      debug('Tunnel created:', tunnelInfo);
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
}
