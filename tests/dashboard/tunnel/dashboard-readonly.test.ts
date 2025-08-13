import { DashboardServer } from '../../../src/dashboard/multi-server';
import { TunnelManager, CloudflareProvider, NgrokProvider } from '../../../src/dashboard/tunnel';
import { join } from 'path';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import WebSocket from 'ws';

// Mock the tunnel providers
jest.mock('../../../src/dashboard/tunnel/cloudflare-provider');
jest.mock('../../../src/dashboard/tunnel/ngrok-provider');

describe('Dashboard Read-Only Mode', () => {
  let server: DashboardServer;
  let tempDir: string;
  const testPort = 4567;

  beforeEach(async () => {
    // Create temp directory
    tempDir = join(__dirname, 'temp-dashboard-test');
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(join(tempDir, '.claude'), { recursive: true });
  });

  afterEach(async () => {
    // Stop server if running
    if (server) {
      await server.stop();
    }
    
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Server Initialization', () => {
    it('should enable read-only mode when tunnel option is set', async () => {
      server = new DashboardServer({
        port: testPort,
        projectPath: tempDir,
        tunnel: true,
        tunnelPassword: 'testPassword'
      });

      // Check that read-only mode is enabled
      expect((server as any).readOnlyMode).toBe(true);
      expect((server as any).tunnelManager).toBeDefined();
    });

    it('should not enable read-only mode without tunnel option', async () => {
      server = new DashboardServer({
        port: testPort,
        projectPath: tempDir
      });

      expect((server as any).readOnlyMode).toBe(false);
      expect((server as any).tunnelManager).toBeUndefined();
    });
  });

  describe('WebSocket Messages', () => {
    it('should include readOnly flag in initial WebSocket message', async () => {
      server = new DashboardServer({
        port: testPort,
        projectPath: tempDir,
        tunnel: true
      });

      // Mock tunnel creation to avoid actual tunnel
      const mockTunnelManager = (server as any).tunnelManager;
      mockTunnelManager.startTunnel = jest.fn().mockResolvedValue({
        url: 'https://test.tunnel.com',
        provider: 'mock',
        passwordProtected: false
      });

      await server.start();

      // Connect WebSocket client
      const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
      
      const messagePromise = new Promise<any>((resolve) => {
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'initial') {
            resolve(message);
          }
        });
      });

      const message = await messagePromise;
      expect(message.readOnly).toBe(true);

      ws.close();
    });

    it('should include readOnly flag in update messages', async () => {
      server = new DashboardServer({
        port: testPort,
        projectPath: tempDir,
        tunnel: true
      });

      // Mock tunnel creation
      const mockTunnelManager = (server as any).tunnelManager;
      mockTunnelManager.startTunnel = jest.fn().mockResolvedValue({
        url: 'https://test.tunnel.com',
        provider: 'mock',
        passwordProtected: false
      });

      await server.start();

      // Connect WebSocket client
      const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
      
      // Wait for connection
      await new Promise((resolve) => ws.on('open', resolve));

      // Trigger an update event
      const updatePromise = new Promise<any>((resolve) => {
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'update') {
            resolve(message);
          }
        });
      });

      // Emit a change event
      (server as any).watcher.emit('change', {
        spec: { name: 'test-spec', status: 'in-progress' }
      });

      const message = await updatePromise;
      expect(message.readOnly).toBe(true);

      ws.close();
    });
  });

  describe('HTTP Endpoints', () => {
    beforeEach(async () => {
      server = new DashboardServer({
        port: testPort,
        projectPath: tempDir,
        tunnel: true
      });

      // Mock tunnel and access controller
      const mockTunnelManager = (server as any).tunnelManager;
      mockTunnelManager.startTunnel = jest.fn().mockResolvedValue({
        url: 'https://test.tunnel.com',
        provider: 'mock',
        passwordProtected: false
      });
      
      // Mock the access controller's enforceReadOnly method
      const mockAccessController = {
        enforceReadOnly: jest.fn((req, reply) => {
          // Simulate blocking non-GET requests
          if (req.method !== 'GET') {
            reply.code(403).send({
              error: 'Read-only access',
              message: 'This dashboard is in read-only mode. Only viewing is allowed.'
            });
          }
        }),
        wrapWebSocketForReadOnly: jest.fn()
      };
      
      mockTunnelManager.getAccessController = jest.fn().mockReturnValue(mockAccessController);

      await server.start();
    });

    it('should allow GET requests in read-only mode', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/specs`);
      expect(response.status).toBe(200);
    });

    it('should block POST requests in read-only mode', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/specs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Read-only access');
    });

    it('should block PUT requests in read-only mode', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/specs/test`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      
      expect(response.status).toBe(403);
    });

    it('should block DELETE requests in read-only mode', async () => {
      const response = await fetch(`http://localhost:${testPort}/api/specs/test`, {
        method: 'DELETE'
      });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Tunnel Integration', () => {
    it('should display tunnel information when started', async () => {
      // Capture console output
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      
      server = new DashboardServer({
        port: testPort,
        projectPath: tempDir,
        tunnel: true,
        tunnelPassword: 'mySecret'
      });

      // Mock successful tunnel creation
      const mockTunnelManager = (server as any).tunnelManager;
      mockTunnelManager.startTunnel = jest.fn().mockResolvedValue({
        url: 'https://test.tunnel.com',
        provider: 'cloudflare',
        passwordProtected: true
      });
      
      mockTunnelManager.getAccessController = jest.fn().mockReturnValue({
        enforceReadOnly: jest.fn(),
        wrapWebSocketForReadOnly: jest.fn()
      });

      await server.start();

      // Check console output for tunnel information
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Tunnel Active'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('https://test.tunnel.com'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Password: mySecret'));
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Provider: cloudflare'));

      consoleLog.mockRestore();
    });

    it('should handle tunnel creation failure gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      server = new DashboardServer({
        port: testPort,
        projectPath: tempDir,
        tunnel: true
      });

      // Mock tunnel creation failure
      const mockTunnelManager = (server as any).tunnelManager;
      mockTunnelManager.startTunnel = jest.fn().mockRejectedValue(new Error('Tunnel creation failed'));
      mockTunnelManager.getAccessController = jest.fn().mockReturnValue({
        enforceReadOnly: jest.fn(),
        wrapWebSocketForReadOnly: jest.fn()
      });

      await server.start();

      expect(consoleError).toHaveBeenCalledWith('Failed to create tunnel:', expect.any(Error));

      consoleError.mockRestore();
    });
  });
});