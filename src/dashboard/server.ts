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

interface WebSocketConnection {
  socket: WebSocket;
}

export interface DashboardOptions {
  port: number;
  projectPath: string;
  autoOpen?: boolean;
}

export class DashboardServer {
  private app: FastifyInstance;
  private watcher: SpecWatcher;
  private parser: SpecParser;
  private options: DashboardOptions;
  private clients: Set<WebSocket> = new Set();

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
      prefix: '/',
    });

    await this.app.register(fastifyWebsocket);

    // WebSocket endpoint for real-time updates
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
            socket.send(
              JSON.stringify({
                type: 'initial',
                data: { specs, bugs },
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
      const allowedDocs = ['report', 'analysis', 'verification'];
      
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

    // Open browser if requested
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

    // Stop the watcher
    await this.watcher.stop();

    // Close the Fastify server
    await this.app.close();
  }
}
